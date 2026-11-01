import { db } from "@/db";
import { faqs, tokens } from "@/db/schema";
import { and, asc, count, countDistinct, eq } from "drizzle-orm";
import { TokenCreator } from "@/components/TokenCreator";
import { ensureSeed, getSettings, toPublicConfig } from "@/lib/settings";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STEPS = [
  "Connect your Solana wallet.",
  "Specify the desired name for your token.",
  "Indicate the symbol (max 8 characters).",
  "Select the decimals quantity (6 is recommended for all tokens).",
  "Provide a brief description for your SPL token.",
  "Upload the image for your token (PNG).",
  "Determine the supply of your token.",
  "Click create, accept the transaction and wait until your tokens are ready.",
];

export default async function HomePage() {
  await ensureSeed();
  const s = await getSettings();
  const cfg = toPublicConfig(s);
  const faqRows = await db.select().from(faqs).where(eq(faqs.published, true)).orderBy(asc(faqs.sortOrder), asc(faqs.id));
  const [stats] = await db
    .select({ n: count(), w: countDistinct(tokens.wallet) })
    .from(tokens)
    .where(and(eq(tokens.status, "confirmed")));

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-10 pt-14 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs text-violet-200">
            ● {cfg.network === "mainnet-beta" ? "Solana Mainnet" : `Solana ${cfg.network}`}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Create <span className="gradient-text">Solana Token</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-300">
            Effortlessly create your Solana SPL token with our 7+1 step process — no coding required.
            Customize your token exactly the way you envision it. Less than 5 minutes, at an affordable cost.
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-2xl font-bold">{stats?.n ?? 0}</p>
              <p className="text-slate-400">Tokens created</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.w ?? 0}</p>
              <p className="text-slate-400">Creators</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{cfg.createFee > 0 ? `${cfg.createFee} SOL` : "Free"}</p>
              <p className="text-slate-400">Creation fee</p>
            </div>
          </div>

          <h2 className="mt-10 text-xl font-semibold">How to use the Solana Token Creator</h2>
          <ol className="mt-4 space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-300">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-emerald-400 text-xs font-bold text-black">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <TokenCreator />
      </section>

      <section className="mx-auto mt-16 grid max-w-6xl gap-6 px-4 md:grid-cols-2">
        <div className="card p-7">
          <h3 className="text-xl font-semibold">Revoke Freeze Authority</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            If you want to create a liquidity pool you will need to “Revoke Freeze Authority” of the token. You can do that
            right when you create it, or later from the revoke tool.
          </p>
          <p className="mt-3 text-sm text-emerald-300">Cost: {cfg.revokeFreezeFee > 0 ? `${cfg.revokeFreezeFee} SOL` : "Free"}</p>
        </div>
        <div className="card p-7">
          <h3 className="text-xl font-semibold">Revoke Mint Authority</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Revoking mint authority ensures that there can be no more tokens minted than the total supply. This provides
            security and peace of mind to buyers.
          </p>
          <p className="mt-3 text-sm text-emerald-300">Cost: {cfg.revokeMintFee > 0 ? `${cfg.revokeMintFee} SOL` : "Free"}</p>
        </div>
        <div className="md:col-span-2 text-center text-sm text-slate-400">
          Once the creation process starts it only takes a few seconds, and you receive the total supply in your wallet. You can
          choose to revoke authorities later from the{" "}
          <Link className="text-violet-300 underline" href="/revoke">revoke tool</Link>.
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-6xl gap-5 px-4 sm:grid-cols-3">
        {[
          ["⚡", "Lightning fast", "Tokens are minted on-chain in seconds, straight to your wallet."],
          ["🔒", "Non-custodial", "You approve every transaction. We never hold keys or tokens."],
          ["🧩", "Full metadata", "Name, symbol, logo and links stored via Metaplex token metadata."],
        ].map(([icon, title, text]) => (
          <div key={title} className="card p-6">
            <div className="text-2xl">{icon}</div>
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">{text}</p>
          </div>
        ))}
      </section>

      <section id="faq" className="mx-auto mt-20 max-w-3xl scroll-mt-24 px-4">
        <h2 className="text-center text-3xl font-bold">Frequently asked questions</h2>
        <div className="mt-8 space-y-3">
          {faqRows.map((f) => (
            <details key={f.id} className="card group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {f.question}
                <span className="text-violet-300 transition group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
