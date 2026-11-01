import { db } from "@/db";
import { messages, revocations, tokens } from "@/db/schema";
import { count, countDistinct, desc, eq, sql, sum } from "drizzle-orm";
import Link from "next/link";
import { short } from "@/lib/format";

export const dynamic = "force-dynamic";

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default async function Dashboard() {
  const [t] = await db
    .select({ total: count(), wallets: countDistinct(tokens.wallet) })
    .from(tokens);
  const [confirmed] = await db.select({ n: count(), fees: sum(tokens.feeSol) }).from(tokens).where(eq(tokens.status, "confirmed"));
  const [pending] = await db.select({ n: count() }).from(tokens).where(eq(tokens.status, "pending"));
  const [failed] = await db.select({ n: count() }).from(tokens).where(eq(tokens.status, "failed"));
  const [rev] = await db.select({ n: count(), fees: sum(revocations.feeSol) }).from(revocations);
  const [unread] = await db.select({ n: count() }).from(messages).where(eq(messages.read, false));

  const perDay = await db.execute<{ day: string; n: number }>(sql`
    select to_char(d::date, 'MM-DD') as day,
      (select count(*)::int from tokens where status = 'confirmed' and created_at::date = d::date) as n
    from generate_series(current_date - interval '13 days', current_date, interval '1 day') d
    order by d
  `);
  const series = perDay.rows;
  const max = Math.max(1, ...series.map((r) => Number(r.n)));

  const recent = await db.select().from(tokens).orderBy(desc(tokens.createdAt)).limit(6);
  const recentMsgs = await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(4);
  const revenue = Number(confirmed?.fees ?? 0) + Number(rev?.fees ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-400">Overview of platform activity.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Tokens created" value={confirmed?.n ?? 0} sub={`${t?.total ?? 0} attempts · ${pending?.n ?? 0} pending · ${failed?.n ?? 0} failed`} />
        <Stat label="Unique creators" value={t?.wallets ?? 0} />
        <Stat label="Fees collected (SOL)" value={Number(revenue.toFixed(4))} sub="Recorded service fees" />
        <Stat label="Revocations" value={rev?.n ?? 0} sub={`${unread?.n ?? 0} unread messages`} />
      </div>

      <div className="card p-6">
        <h2 className="font-semibold">Tokens created — last 14 days</h2>
        <div className="mt-6 flex h-40 items-end gap-2">
          {series.map((r) => (
            <div key={r.day} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-slate-400">{Number(r.n) || ""}</span>
              <div
                className="w-full rounded-t bg-gradient-to-t from-violet-600 to-emerald-400"
                style={{ height: `${Math.max(3, (Number(r.n) / max) * 100)}%`, opacity: Number(r.n) ? 1 : 0.25 }}
              />
              <span className="text-[10px] text-slate-500">{r.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent tokens</h2>
            <Link href="/admin/tokens" className="text-xs text-violet-300 hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-slate-500">No tokens yet.</p>}
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span>
                  <span className="font-medium">{r.name}</span> <span className="text-slate-400">${r.symbol}</span>
                  <span className="block font-mono text-xs text-slate-500">{short(r.wallet, 5)}</span>
                </span>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Latest messages</h2>
            <Link href="/admin/messages" className="text-xs text-violet-300 hover:underline">Inbox →</Link>
          </div>
          <div className="space-y-3">
            {recentMsgs.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
            {recentMsgs.map((m) => (
              <div key={m.id} className="text-sm">
                <p className="font-medium">
                  {m.name} {!m.read && <span className="ml-1 rounded bg-rose-500 px-1.5 text-[10px]">NEW</span>}
                </p>
                <p className="line-clamp-1 text-slate-400">{m.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "confirmed"
      ? "bg-emerald-400/15 text-emerald-300"
      : status === "failed"
        ? "bg-rose-400/15 text-rose-300"
        : "bg-amber-400/15 text-amber-300";
  return <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{status}</span>;
}
