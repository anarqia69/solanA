import { db } from "@/db";
import { revocations } from "@/db/schema";
import { getSettings, toPublicConfig } from "@/lib/settings";
import { isValidAddress } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    mintAddress?: string;
    wallet?: string;
    types?: string[];
    signature?: string;
  };
  if (!isValidAddress(body.mintAddress) || !isValidAddress(body.wallet)) {
    return Response.json({ error: "Invalid address" }, { status: 400 });
  }
  if (typeof body.signature !== "string" || body.signature.length < 40 || body.signature.length > 100) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  const types = (body.types ?? []).filter((t) => t === "mint" || t === "freeze");
  if (types.length === 0) return Response.json({ error: "Nothing to record" }, { status: 400 });

  const cfg = toPublicConfig(await getSettings());
  await db.insert(revocations).values(
    types.map((type) => ({
      mintAddress: body.mintAddress!,
      wallet: body.wallet!,
      type,
      signature: body.signature!,
      feeSol: type === "mint" ? cfg.revokeMintFee : cfg.revokeFreezeFee,
      network: cfg.network,
    })),
  );
  return Response.json({ ok: true });
}
