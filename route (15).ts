import { db } from "@/db";
import { tokens } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { getOrigin } from "@/lib/server-utils";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const [t] = await db.select().from(tokens).where(eq(tokens.id, id));
  if (!t) return Response.json({ error: "Not found" }, { status: 404 });
  const origin = getOrigin(req, await getSettings());
  const body: Record<string, unknown> = {
    name: t.name,
    symbol: t.symbol,
    description: t.description,
    ...(t.imageData ? { image: `${origin}/api/uploads/${t.id}` } : {}),
    extensions: {
      ...(t.website ? { website: t.website } : {}),
      ...(t.twitter ? { twitter: t.twitter } : {}),
      ...(t.telegram ? { telegram: t.telegram } : {}),
    },
  };
  return Response.json(body, { headers: { "access-control-allow-origin": "*" } });
}
