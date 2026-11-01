import { db } from "@/db";
import { tokens } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = raw.replace(/\.\w+$/, "");
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const [t] = await db
    .select({ data: tokens.imageData, mime: tokens.imageMime })
    .from(tokens)
    .where(eq(tokens.id, id));
  if (!t?.data || !t.mime) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(t.data, "base64"), {
    headers: {
      "content-type": t.mime,
      "cache-control": "public, max-age=3600",
      "access-control-allow-origin": "*",
    },
  });
}
