import { db } from "@/db";
import { tokens } from "@/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { explorerUrl, short } from "@/lib/format";
import { purgeStaleTokensAction, tokenAction } from "../../actions";

export const dynamic = "force-dynamic";

const STATUSES = ["all", "confirmed", "pending", "failed"];

function Act({ id, op, label, danger }: { id: string; op: string; label: string; danger?: boolean }) {
  return (
    <form action={tokenAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <button className={`admin-btn ${danger ? "admin-btn-danger" : "admin-btn-muted"}`}>{label}</button>
    </form>
  );
}

export default async function TokensAdmin({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "all", q = "" } = await searchParams;
  const term = q.trim();
  const rows = await db
    .select()
    .from(tokens)
    .where(
      and(
        status !== "all" ? eq(tokens.status, status) : undefined,
        term
          ? or(
              ilike(tokens.name, `%${term}%`),
              ilike(tokens.symbol, `%${term}%`),
              ilike(tokens.wallet, `%${term}%`),
              ilike(tokens.mintAddress, `%${term}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(tokens.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tokens</h1>
          <p className="text-sm text-slate-400">All token creation attempts ({rows.length} shown).</p>
        </div>
        <form action={purgeStaleTokensAction}>
          <button className="admin-btn admin-btn-muted">Purge pending older than 1h</button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/tokens?status=${s}${term ? `&q=${encodeURIComponent(term)}` : ""}`}
              className={`rounded-lg px-3 py-1.5 text-xs capitalize ${
                status === s ? "bg-violet-500/30 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          <input type="hidden" name="status" value={status} />
          <input name="q" defaultValue={term} placeholder="Search name, symbol, wallet, mint" className="admin-input w-72" />
          <button className="admin-btn">Search</button>
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="p-3">Token</th>
              <th className="p-3">Creator</th>
              <th className="p-3">Supply</th>
              <th className="p-3">Options</th>
              <th className="p-3">Fee</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-slate-500">No tokens found.</td></tr>
            )}
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-white/5 align-top">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {t.imageData ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/uploads/${t.id}`} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="h-9 w-9 rounded-full bg-white/10" />
                    )}
                    <div>
                      <p className="font-medium">
                        {t.name} {t.featured && <span className="text-amber-300">★</span>} {t.hidden && <span className="text-xs text-slate-500">(hidden)</span>}
                      </p>
                      <p className="text-xs text-slate-400">${t.symbol} · {t.decimals} dec · {t.network}</p>
                      {t.mintAddress && (
                        <a className="font-mono text-xs text-violet-300 hover:underline" target="_blank" rel="noreferrer" href={explorerUrl("address", t.mintAddress, t.network)}>
                          {short(t.mintAddress, 5)}
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-3 font-mono text-xs">{short(t.wallet, 5)}</td>
                <td className="p-3">{Number(t.supply).toLocaleString("en-US")}</td>
                <td className="p-3 text-xs text-slate-400">
                  {t.revokeMint && <div>Mint revoked</div>}
                  {t.revokeFreeze && <div>Freeze revoked</div>}
                  {!t.revokeMint && !t.revokeFreeze && "—"}
                </td>
                <td className="p-3">{Number(t.feeSol.toFixed(4))} SOL</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      t.status === "confirmed" ? "bg-emerald-400/15 text-emerald-300" : t.status === "failed" ? "bg-rose-400/15 text-rose-300" : "bg-amber-400/15 text-amber-300"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="p-3 text-xs text-slate-400">{t.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Act id={t.id} op="feature" label={t.featured ? "Unfeature" : "Feature"} />
                    <Act id={t.id} op="hide" label={t.hidden ? "Show" : "Hide"} />
                    {t.status !== "confirmed" && <Act id={t.id} op="confirm" label="Mark confirmed" />}
                    {t.status === "pending" && <Act id={t.id} op="fail" label="Mark failed" />}
                    <Act id={t.id} op="delete" label="Delete" danger />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
