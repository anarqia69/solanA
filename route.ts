import { getSettings, toPublicConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSettings();
  return Response.json(toPublicConfig(s));
}
