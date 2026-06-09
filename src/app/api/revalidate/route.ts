import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const exactAllowedTags = new Set(["irhal-city", "irhal-city-nav"]);
const allowedTagPrefixes = [
  "irhal-city:",
  "irhal-city-guide-items:",
  "irhal-city-guide-sections:",
  "irhal-city-itineraries:",
  "irhal-city-listings:",
  "irhal-city-neighborhoods:",
  "irhal-city-search:",
  "irhal-city-shell:",
  "irhal-city-sitemap:",
];

const isAllowedTag = (tag: string) =>
  exactAllowedTags.has(tag) ||
  (/^[a-z0-9:-]+$/.test(tag) &&
    allowedTagPrefixes.some((prefix) => tag.startsWith(prefix)));

const asStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const unauthorized = () =>
  NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function POST(request: Request) {
  const configuredSecret =
    process.env.IRHAL_REVALIDATE_SECRET || process.env.PAYLOAD_SECRET;
  const requestSecret = request.headers.get("x-irhal-revalidate-secret");

  if (!configuredSecret || requestSecret !== configuredSecret) {
    return unauthorized();
  }

  const body = (await request.json().catch(() => ({}))) as {
    paths?: unknown;
    tags?: unknown;
  };

  const requestedTags = asStringArray(body.tags).filter(isAllowedTag);
  const tags = requestedTags.length > 0 ? requestedTags : ["irhal-city"];
  const paths = asStringArray(body.paths).filter((path) =>
    path.startsWith("/"),
  );

  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({
    ok: true,
    paths,
    tags,
  });
}
