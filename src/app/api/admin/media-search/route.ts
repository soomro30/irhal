import { searchMediaCandidates } from "@/lib/admin/media-discovery";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return searchMediaCandidates(request);
}
