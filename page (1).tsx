import { db } from "@/db";
import { tokens } from "@/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { explorerUrl, short } from "@/lib/format";

export const metadata = { title: "Token Explorer" };
export const dynamic = "force-dynamic";

export default async function ExplorerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();
  const rows = await db
    .select()
    .from(tokens)
    .where(
      and(
        eq(tokens.status, "confirmed"),
        eq(tokens.hidden, false),
        term
          ? or(
              ilike(tokens.name, `%${term}%`),
              ilike(tokens.symbol, `%${term}%`),
              ilike(tokens.mintAddress, `%${term}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(tokens.featured), desc(tokens.createdAt))
    .limit(60);

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl font-extrabold tracking-tight">
        Token <span className="gradient-text">Explorer</span>
      </h1>
      <p className="mt-3 text-slate-300">Recently created tokens on this platform.</p>
      <form className="mt-6 flex max-w-md gap-2">
        <input name="q" defaultValue={term} placeholder="Search name, symbol or mint…" className="field" />
        <button className="btn-ghost">Search</button>
      </form>
      {rows.length === 0 ? (
        <p className="mt-10 text-slate-400">No tokens found yet.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((t) => (
            <div key={t.id} className="card p-5">
              <div className="flex items-center gap-3">
                {t.imageData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/uploads/${t.id}`} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 font-bold">{t.symbol[0]}</span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {t.name} {t.featured && <span className="ml-1 text-xs text-amber-300">★ Featured</span>}
                  </p>
                  <p className="text-xs text-slate-400">${t.symbol.toUpperCase()} · {t.network}</p>
                </div>
              </div>
              {t.description && <p className="mt-3 line-clamp-2 text-sm text-slate-400">{t.description}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                {t.revokeMint && <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-emerald-300">Mint revoked</span>}
                {t.revokeFreeze && <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-emerald-300">Freeze revoked</span>}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Supply {Number(t.supply).toLocaleString("en-US")}</span>
                {t.mintAddress && (
                  <a className="font-mono text-violet-300 hover:underline" target="_blank" rel="noreferrer" href={explorerUrl("address", t.mintAddress, t.network)}>
                    {short(t.mintAddress, 5)}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
