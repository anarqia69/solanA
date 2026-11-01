import { requireAdmin } from "@/lib/auth";
import { changePasswordAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AccountAdmin({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  const { saved, error } = await searchParams;
  return (
    <form action={changePasswordAction} className="max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-sm text-slate-400">Change your admin username or password.</p>
      </div>
      {saved && <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">Account updated.</p>}
      {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">{error}</p>}
      <div className="card space-y-4 p-6">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-300">Username</label>
          <input name="username" defaultValue={admin.username} required className="admin-input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-300">Current password</label>
          <input name="current" type="password" required className="admin-input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-300">New password (optional, min 8 chars)</label>
          <input name="next" type="password" className="admin-input" autoComplete="new-password" />
        </div>
        <button className="admin-btn">Update account</button>
      </div>
    </form>
  );
}
