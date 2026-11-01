import { db } from "@/db";
import { faqs, settings } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export const DEFAULT_SETTINGS = {
  siteName: "NovaMint",
  tagline: "Create your Solana SPL token in minutes — no code required.",
  announcement: "",
  maintenance: "false",
  network: "devnet", // "devnet" | "mainnet-beta"
  rpcUrl: "",
  treasury: "",
  createFee: "0.3",
  revokeMintFee: "0.1",
  revokeFreezeFee: "0.1",
  siteUrl: "",
  twitter: "",
  telegram: "",
  discord: "",
  contactEmail: "support@example.com",
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;
export type SiteSettings = Record<SettingKey, string>;

export async function getSettings(): Promise<SiteSettings> {
  const rows = await db.select().from(settings);
  const out: SiteSettings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key in DEFAULT_SETTINGS) {
      out[row.key as SettingKey] = row.value;
    }
  }
  return out;
}

export async function saveSettings(values: Partial<SiteSettings>) {
  for (const [key, value] of Object.entries(values)) {
    if (!(key in DEFAULT_SETTINGS) || value === undefined) continue;
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }
}

export function defaultRpc(network: string) {
  return network === "mainnet-beta"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com";
}

export function toNumber(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export type PublicConfig = {
  siteName: string;
  network: string;
  rpcUrl: string;
  treasury: string;
  createFee: number;
  revokeMintFee: number;
  revokeFreezeFee: number;
  maintenance: boolean;
};

export function toPublicConfig(s: SiteSettings): PublicConfig {
  const charge = s.treasury.trim().length > 0;
  return {
    siteName: s.siteName,
    network: s.network,
    rpcUrl: s.rpcUrl.trim() || defaultRpc(s.network),
    treasury: s.treasury.trim(),
    createFee: charge ? toNumber(s.createFee, 0) : 0,
    revokeMintFee: charge ? toNumber(s.revokeMintFee, 0) : 0,
    revokeFreezeFee: charge ? toNumber(s.revokeFreezeFee, 0) : 0,
    maintenance: s.maintenance === "true",
  };
}

const DEFAULT_FAQS = [
  {
    question: "What is an SPL token?",
    answer:
      "SPL tokens are the standard for fungible tokens on the Solana blockchain — similar to ERC-20 tokens on Ethereum. Meme coins, community tokens and utility tokens on Solana are all SPL tokens.",
  },
  {
    question: "Do I need to know how to code?",
    answer:
      "No. Connect your wallet, fill in the name, symbol, supply and image, then approve the transaction. Your token is created on-chain in a few seconds.",
  },
  {
    question: "What does Revoke Mint Authority do?",
    answer:
      "Revoking mint authority permanently removes the ability to create more tokens, guaranteeing that the total supply can never increase. Buyers consider this a key trust signal.",
  },
  {
    question: "Why do I need to Revoke Freeze Authority?",
    answer:
      "Most DEXs and liquidity pool platforms require freeze authority to be revoked. If it is enabled, the owner could freeze holders' token accounts, so pools usually refuse such tokens.",
  },
  {
    question: "How long does it take and how much does it cost?",
    answer:
      "Creation takes a few seconds once you approve the transaction. The service fee is shown on the form before you sign, plus the small network rent that Solana charges for the accounts created.",
  },
  {
    question: "Who owns the token after creation?",
    answer:
      "You do. The full supply is minted straight into your wallet and the authorities are assigned to your wallet. We never hold your tokens or private keys.",
  },
];

export async function ensureSeed() {
  const seeded = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "faq_seeded"));
  if (seeded.length > 0) return;
  const [{ n }] = await db.select({ n: count() }).from(faqs);
  if (n === 0) {
    await db.insert(faqs).values(
      DEFAULT_FAQS.map((f, i) => ({ ...f, sortOrder: i, published: true })),
    );
  }
  await db
    .insert(settings)
    .values({ key: "faq_seeded", value: "1" })
    .onConflictDoNothing();
}
