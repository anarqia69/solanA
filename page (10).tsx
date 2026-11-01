import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "../../actions";

export const dynamic = "force-dynamic";

function Field({
  label,
  name,
  value,
  hint,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  hint?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-300">{label}</label>
      <input name={name} type={type} defaultValue={value} placeholder={placeholder} step={type === "number" ? "any" : undefined} min={type === "number" ? 0 : undefined} className="admin-input" />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default async function SettingsAdmin({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const s = await getSettings();
  return (
    <form action={saveSettingsAction} className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-slate-400">Configure branding, fees, treasury wallet and network.</p>
      </div>
      {saved && <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">Settings saved.</p>}
      {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">{error}</p>}

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Branding</h2>
        <Field label="Site name" name="siteName" value={s.siteName} />
        <Field label="Tagline" name="tagline" value={s.tagline} />
        <Field label="Announcement banner" name="announcement" value={s.announcement} hint="Leave empty to hide the banner." />
        <Field label="Contact email" name="contactEmail" value={s.contactEmail} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Twitter / X URL" name="twitter" value={s.twitter} />
          <Field label="Telegram URL" name="telegram" value={s.telegram} />
          <Field label="Discord URL" name="discord" value={s.discord} />
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Blockchain</h2>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-300">Network</label>
          <select name="network" defaultValue={s.network} className="admin-input">
            <option value="devnet">Devnet (testing — free SOL)</option>
            <option value="mainnet-beta">Mainnet Beta (real SOL)</option>
          </select>
        </div>
        <Field label="Custom RPC URL" name="rpcUrl" value={s.rpcUrl} placeholder="https://your-rpc-provider/..." hint="Recommended for mainnet — the public RPC is rate limited. Leave empty to use the public cluster endpoint." />
        <Field label="Public site URL" name="siteUrl" value={s.siteUrl} placeholder="https://yourdomain.com" hint="Used for token metadata & image URLs. Leave empty to auto-detect from the request host. Must be publicly reachable for explorers/wallets to show logos." />
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Fees &amp; treasury</h2>
        <Field label="Treasury wallet" name="treasury" value={s.treasury} placeholder="Solana address that receives fees" hint="If empty, all fees are waived and the service is free." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Create token fee (SOL)" name="createFee" type="number" value={s.createFee} />
          <Field label="Revoke mint fee (SOL)" name="revokeMintFee" type="number" value={s.revokeMintFee} />
          <Field label="Revoke freeze fee (SOL)" name="revokeFreezeFee" type="number" value={s.revokeFreezeFee} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold">Maintenance</h2>
        <label className="mt-3 flex items-center gap-3 text-sm text-slate-300">
          <input type="checkbox" name="maintenance" defaultChecked={s.maintenance === "true"} className="h-4 w-4" />
          Pause token creation (visitors see a maintenance notice)
        </label>
      </section>

      <button className="admin-btn !px-6 !py-2.5">Save settings</button>
    </form>
  );
}
