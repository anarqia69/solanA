import { db } from "@/db";
import { revocations } from "@/db/schema";
import { desc } from "drizzle-orm";
import { explorerUrl, short } from "@/lib/format";
import { deleteRevocationAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function RevocationsAdmin() {
  const rows = await db.select().from(revocations).orderBy(desc(revocations.createdAt)).limit(300);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revocations</h1>
        <p className="text-sm text-slate-400">Standalone mint / freeze authority revocations done through the revoke tool.</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Mint</th>
              <th className="p-3">Wallet</th>
              <th className="p-3">Fee</th>
              <th className="p-3">Network</th>
              <th className="p-3">Tx</th>
              <th className="p-3">Date</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-slate-500">No revocations yet.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="p-3 capitalize">{r.type}</td>
                <td className="p-3 font-mono text-xs">{short(r.mintAddress, 5)}</td>
                <td className="p-3 font-mono text-xs">{short(r.wallet, 5)}</td>
                <td className="p-3">{Number(r.feeSol.toFixed(4))} SOL</td>
                <td className="p-3">{r.network}</td>
                <td className="p-3">
                  <a className="text-violet-300 hover:underline" target="_blank" rel="noreferrer" href={explorerUrl("tx", r.signature, r.network)}>
                    {short(r.signature, 5)}
                  </a>
                </td>
                <td className="p-3 text-xs text-slate-400">{r.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
                <td className="p-3">
                  <form action={deleteRevocationAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="admin-btn admin-btn-danger">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
