import config from "@payload-config";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { getPayload } from "payload";
import { z } from "zod";

const editorRoles = new Set(["admin", "super-admin", "editor"]);
const maxImageBytes = 12 * 1024 * 1024;
const provider = "unsplash" as const;

const fetchWithTimeout = async (
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = 12000,
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const accessKey = () => process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_TOKEN || "";

const requireEditor = async (request: Request) => {
  const payload = await getPayload({ config });
  const auth = await payload.auth({ headers: request.headers });
  const role = asString(auth.user?.role);

  if (!auth.user || !editorRoles.has(role)) {
    return {
      error: Response.json(
        { status: "error", message: "Editor access is required." },
        { status: 401 },
      ),
      payload,
      user: null,
    };
  }

  return { error: null, payload, user: auth.user };
};

const requireUnsplashKey = () => {
  const key = accessKey();

  if (!key) {
    return {
      error: Response.json(
        {
          status: "error",
          message:
            "UNSPLASH_ACCESS_KEY is required before the image discovery tool can search the internet.",
        },
        { status: 501 },
      ),
      key: "",
    };
  }

  return { error: null, key };
};

const requestSchema = z.object({
  city: z.string().max(120).optional(),
  kind: z.string().max(80).optional(),
  page: z.number().int().min(1).max(5).default(1),
  query: z.string().trim().min(2).max(160),
  title: z.string().max(160).optional(),
});

const importSchema = z.object({
  alt: z.string().trim().min(3).max(180).optional(),
  guideItemId: z.union([z.string(), z.number()]),
  photoId: z.string().trim().min(3).max(80),
  query: z.string().trim().min(2).max(160).optional(),
  title: z.string().trim().min(2).max(160).optional(),
});

type UnsplashPhoto = {
  alt_description?: string | null;
  blur_hash?: string | null;
  color?: string | null;
  description?: string | null;
  height?: number;
  id: string;
  links?: {
    download_location?: string;
    html?: string;
    self?: string;
  };
  urls?: {
    full?: string;
    raw?: string;
    regular?: string;
    small?: string;
    thumb?: string;
  };
  user?: {
    links?: {
      html?: string;
    };
    name?: string | null;
    username?: string | null;
  };
  width?: number;
};

const scorePhoto = (photo: UnsplashPhoto, title: string) => {
  const width = asNumber(photo.width);
  const height = asNumber(photo.height);
  const haystack = [
    photo.description,
    photo.alt_description,
    photo.user?.name,
    photo.user?.username,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const titleTokens = title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3);
  const matchedTokens = titleTokens.filter((token) => haystack.includes(token)).length;
  const landscape = width > height ? 10 : 0;
  const resolution = Math.min(Math.round((width * height) / 350000), 20);

  return Math.min(100, 45 + landscape + resolution + matchedTokens * 8);
};

const mapPhoto = (photo: UnsplashPhoto, title: string) => {
  const photographer = asString(photo.user?.name, "Unsplash photographer");
  const sourceUrl = asString(photo.links?.html);

  return {
    alt: photo.alt_description || photo.description || `${title} travel image`,
    attribution: `Photo by ${photographer} on Unsplash`,
    blurHash: photo.blur_hash || undefined,
    color: photo.color || undefined,
    height: asNumber(photo.height),
    id: photo.id,
    license: "Unsplash License - editorial review required",
    photographer,
    photographerUrl: asString(photo.user?.links?.html) || undefined,
    previewUrl: asString(photo.urls?.regular) || asString(photo.urls?.small),
    provider,
    score: scorePhoto(photo, title),
    sourceUrl,
    thumbUrl: asString(photo.urls?.small) || asString(photo.urls?.thumb),
    width: asNumber(photo.width),
  };
};

export const searchMediaCandidates = async (request: Request) => {
  const auth = await requireEditor(request);
  if (auth.error) return auth.error;

  const keyResult = requireUnsplashKey();
  if (keyResult.error) return keyResult.error;

  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      { status: "error", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const searchParams = new URLSearchParams({
    content_filter: "high",
    order_by: "relevant",
    orientation: "landscape",
    page: String(parsed.data.page),
    per_page: "12",
    query: parsed.data.query,
  });

  const response = await fetchWithTimeout(
    `https://api.unsplash.com/search/photos?${searchParams.toString()}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Client-ID ${keyResult.key}`,
      },
    },
  );

  if (!response.ok) {
    return Response.json(
      {
        status: "error",
        message: `Unsplash search failed with ${response.status}.`,
      },
      { status: 502 },
    );
  }

  const result = (await response.json()) as {
    results?: UnsplashPhoto[];
    total?: number;
    total_pages?: number;
  };

  return Response.json({
    provider,
    query: parsed.data.query,
    results: (result.results || []).map((photo) => mapPhoto(photo, parsed.data.title || parsed.data.query)),
    status: "ok",
    total: result.total || 0,
    totalPages: result.total_pages || 0,
  });
};

const safeFilename = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "guide-item-media";

const imageUrlFromDownload = async (photo: UnsplashPhoto, key: string) => {
  const downloadLocation = asString(photo.links?.download_location);

  if (downloadLocation) {
    const url = new URL(downloadLocation);

    if (url.hostname !== "api.unsplash.com") {
      throw new Error("Unexpected Unsplash download tracking URL.");
    }

    const response = await fetchWithTimeout(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Client-ID ${key}`,
      },
    });

    if (response.ok) {
      const json = (await response.json()) as { url?: string };
      if (json.url) return json.url;
    }
  }

  const raw = asString(photo.urls?.raw) || asString(photo.urls?.full) || asString(photo.urls?.regular);
  if (!raw) {
    throw new Error("The selected Unsplash photo does not include an importable image URL.");
  }

  const url = new URL(raw);
  url.searchParams.set("fit", "max");
  url.searchParams.set("fm", "jpg");
  url.searchParams.set("q", "85");
  url.searchParams.set("w", "1800");
  return url.toString();
};

const downloadImage = async (sourceUrl: string) => {
  const url = new URL(sourceUrl);
  if (url.hostname !== "images.unsplash.com") {
    throw new Error("Only vetted Unsplash image CDN URLs can be imported.");
  }

  const response = await fetchWithTimeout(url, {
    headers: { Accept: "image/avif,image/webp,image/jpeg,image/png,image/*" },
  });

  if (!response.ok) {
    throw new Error(`Image download failed with ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error("The selected asset did not resolve to an image.");
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maxImageBytes) {
    throw new Error("The selected image is too large to import safely.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maxImageBytes) {
    throw new Error("The selected image is too large to import safely.");
  }

  return {
    buffer,
    contentType,
  };
};

export const importMediaCandidate = async (request: Request) => {
  const auth = await requireEditor(request);
  if (auth.error) return auth.error;

  const keyResult = requireUnsplashKey();
  if (keyResult.error) return keyResult.error;

  const parsed = importSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      { status: "error", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await auth.payload.findByID({
      collection: "guide-items" as never,
      id: parsed.data.guideItemId,
      overrideAccess: true,
      req: {
        headers: request.headers,
        user: auth.user,
      },
    });
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Guide item not found.",
      },
      { status: 404 },
    );
  }

  try {
    const photoResponse = await fetchWithTimeout(
      `https://api.unsplash.com/photos/${encodeURIComponent(parsed.data.photoId)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Client-ID ${keyResult.key}`,
        },
      },
    );

    if (!photoResponse.ok) {
      return Response.json(
        {
          status: "error",
          message: `Unsplash photo lookup failed with ${photoResponse.status}.`,
        },
        { status: 502 },
      );
    }

    const photo = (await photoResponse.json()) as UnsplashPhoto;
    const sourceUrl = asString(photo.links?.html);

    if (sourceUrl) {
      const existing = await auth.payload.find({
        collection: "media" as never,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        req: {
          headers: request.headers,
          user: auth.user,
        },
        where: {
          sourceUrl: {
            equals: sourceUrl,
          },
        },
      });

      const existingMedia = existing.docs[0];
      if (existingMedia) {
        return Response.json({
          media: existingMedia,
          status: "ok",
        });
      }
    }

    const importUrl = await imageUrlFromDownload(photo, keyResult.key);
    const image = await downloadImage(importUrl);
    const title = parsed.data.title || parsed.data.query || photo.alt_description || photo.description || photo.id;
    const alt = parsed.data.alt || photo.alt_description || photo.description || `${title} travel image`;
    const photographer = asString(photo.user?.name, "Unsplash photographer");
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "irhal-media-import-"));

    try {
      const tmpPath = path.join(tmpDir, `${safeFilename(`${title}-${photo.id}`)}.jpg`);

      await fs.writeFile(tmpPath, image.buffer);

      const created = await auth.payload.create({
        collection: "media" as never,
        data: {
          alt,
          attribution: `Photo by ${photographer} on Unsplash`,
          caption: `Imported candidate for ${title}.`,
          license: "editorial-review-required",
          photographer,
          sourceUrl,
          usageNotes: [
            `Provider: Unsplash`,
            `Unsplash photo ID: ${photo.id}`,
            `Imported from search query: ${parsed.data.query || title}`,
            `Imported at: ${new Date().toISOString()}`,
            `Original CDN URL: ${importUrl}`,
            "Download tracking endpoint was called before import when provided by Unsplash.",
            "Verify place accuracy and usage rights before approving this media for public pages.",
          ].join("\n"),
          usageStatus: "draft",
        } as never,
        filePath: tmpPath,
        overrideAccess: true,
        req: {
          headers: request.headers,
          user: auth.user,
        },
      });

      return Response.json({
        media: created,
        status: "ok",
      });
    } finally {
      await fs.rm(tmpDir, { force: true, recursive: true });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Image import failed.";

    return Response.json(
      {
        status: "error",
        message,
      },
      { status: 502 },
    );
  }
};
