import { importMediaCandidate } from "@/lib/admin/media-discovery";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return importMediaCandidate(request);
}
