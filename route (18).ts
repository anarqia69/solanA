import { db } from "@/db";
import { tokens } from "@/db/schema";
import { getSettings, toPublicConfig } from "@/lib/settings";
import { cleanUrl, getOrigin, isValidAddress } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

const MAX_IMAGE = 1024 * 1024; // 1MB
const U64_MAX = BigInt("18446744073709551615");

export async function POST(req: Request) {
  const s = await getSettings();
  const cfg = toPublicConfig(s);
  if (cfg.maintenance) {
    return Response.json({ error: "Token creation is temporarily disabled." }, { status: 503 });
  }

  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const symbol = String(form.get("symbol") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const wallet = form.get("wallet");
  const decimals = Number(form.get("decimals") ?? 6);
  const supplyRaw = String(form.get("supply") ?? "").trim();
  const revokeMint = form.get("revokeMint") === "true";
  const revokeFreeze = form.get("revokeFreeze") === "true";
  const image = form.get("image");

  if (!isValidAddress(wallet)) return Response.json({ error: "Invalid wallet address." }, { status: 400 });
  if (name.length < 1 || name.length > 32) return Response.json({ error: "Name must be 1–32 characters." }, { status: 400 });
  if (symbol.length < 1 || symbol.length > 8) return Response.json({ error: "Symbol must be 1–8 characters." }, { status: 400 });
  if (description.length > 500) return Response.json({ error: "Description is too long (max 500)." }, { status: 400 });
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 9) return Response.json({ error: "Decimals must be between 0 and 9." }, { status: 400 });
  if (!/^\d+$/.test(supplyRaw)) return Response.json({ error: "Supply must be a whole number." }, { status: 400 });
  const supply = BigInt(supplyRaw);
  if (supply <= BigInt(0)) return Response.json({ error: "Supply must be greater than 0." }, { status: 400 });
  if (supply * BigInt(10) ** BigInt(decimals) > U64_MAX) {
    return Response.json({ error: "Supply × 10^decimals exceeds the maximum allowed by Solana (u64). Lower the supply or decimals." }, { status: 400 });
  }

  let imageData: string | null = null;
  let imageMime: string | null = null;
  if (image instanceof File && image.size > 0) {
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(image.type)) {
      return Response.json({ error: "Image must be PNG, JPG, WEBP or GIF." }, { status: 400 });
    }
    if (image.size > MAX_IMAGE) return Response.json({ error: "Image must be smaller than 1MB." }, { status: 400 });
    imageData = Buffer.from(await image.arrayBuffer()).toString("base64");
    imageMime = image.type;
  }

  const feeSol =
    cfg.createFee + (revokeMint ? cfg.revokeMintFee : 0) + (revokeFreeze ? cfg.revokeFreezeFee : 0);

  const [row] = await db
    .insert(tokens)
    .values({
      name,
      symbol,
      decimals,
      description,
      supply: supply.toString(),
      imageData,
      imageMime,
      website: cleanUrl(form.get("website")),
      twitter: cleanUrl(form.get("twitter")),
      telegram: cleanUrl(form.get("telegram")),
      wallet,
      revokeMint,
      revokeFreeze,
      feeSol,
      network: cfg.network,
      status: "pending",
    })
    .returning({ id: tokens.id });

  const origin = getOrigin(req, s);
  return Response.json({
    id: row.id,
    metadataUri: `${origin}/api/metadata/${row.id}`,
    feeSol,
  });
}
