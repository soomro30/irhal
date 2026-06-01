import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const allowedTags = new Set(["irhal-city", "irhal-city-nav"]);

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

  const requestedTags = asStringArray(body.tags).filter((tag) =>
    allowedTags.has(tag),
  );
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
