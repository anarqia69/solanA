import { db } from "@/db";
import { tokens } from "@/db/schema";
import { getSettings, toPublicConfig } from "@/lib/settings";
import { isValidAddress } from "@/lib/server-utils";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    mintAddress?: string;
    signature?: string;
    failed?: boolean;
  };

  const [token] = await db.select().from(tokens).where(eq(tokens.id, id));
  if (!token) return Response.json({ error: "Not found" }, { status: 404 });
  if (token.status === "confirmed") return Response.json({ ok: true });

  if (body.failed) {
    await db.update(tokens).set({ status: "failed" }).where(eq(tokens.id, id));
    return Response.json({ ok: true });
  }

  if (!isValidAddress(body.mintAddress) || typeof body.signature !== "string" || body.signature.length < 40 || body.signature.length > 100) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Verify the signature on-chain with the configured RPC.
  const cfg = toPublicConfig(await getSettings());
  let status = "confirmed";
  try {
    const res = await fetch(cfg.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignatureStatuses",
        params: [[body.signature], { searchTransactionHistory: true }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json()) as { result?: { value?: ({ err: unknown } | null)[] } };
    const st = json.result?.value?.[0];
    if (st && st.err) status = "failed";
  } catch {
    // RPC unreachable: trust the client confirmation
  }

  await db
    .update(tokens)
    .set({ mintAddress: body.mintAddress, signature: body.signature, status })
    .where(eq(tokens.id, id));
  return Response.json({ ok: true, status });
}
