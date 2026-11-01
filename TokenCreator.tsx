"use client";

import { useMemo, useState } from "react";
import { createSplToken } from "@/lib/solana";
import { explorerUrl } from "@/lib/format";
import { useWallet } from "./WalletProvider";

type Result = { mintAddress: string; signature: string };

function fmtSol(n: number) {
  return `${Number(n.toFixed(4))} SOL`;
}

export function TokenCreator() {
  const { config, address, openModal, signTransaction } = useWallet();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(6);
  const [supply, setSupply] = useState("1000000000");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [revokeMint, setRevokeMint] = useState(false);
  const [revokeFreeze, setRevokeFreeze] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const total = useMemo(
    () =>
      config.createFee +
      (revokeMint ? config.revokeMintFee : 0) +
      (revokeFreeze ? config.revokeFreezeFee : 0),
    [config, revokeMint, revokeFreeze],
  );

  function onImage(file: File | null) {
    setError(null);
    if (!file) {
      setImage(null);
      setPreview(null);
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("Image must be smaller than 1MB.");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!address) return openModal();
    if (config.maintenance) return setError("Token creation is temporarily disabled.");
    if (!image) return setError("Please upload a token image.");

    try {
      setBusy("Preparing metadata…");
      const fd = new FormData();
      fd.set("name", name);
      fd.set("symbol", symbol);
      fd.set("decimals", String(decimals));
      fd.set("supply", supply.replace(/[,\s_]/g, ""));
      fd.set("description", description);
      fd.set("wallet", address);
      fd.set("revokeMint", String(revokeMint));
      fd.set("revokeFreeze", String(revokeFreeze));
      fd.set("website", website);
      fd.set("twitter", twitter);
      fd.set("telegram", telegram);
      fd.set("image", image);
      const prep = await fetch("/api/tokens/prepare", { method: "POST", body: fd });
      const data = await prep.json();
      if (!prep.ok) throw new Error(data.error || "Could not prepare token.");

      setBusy("Approve the transaction in your wallet…");
      try {
        const res = await createSplToken({
          rpcUrl: config.rpcUrl,
          owner: address,
          signTransaction,
          name,
          symbol,
          decimals,
          supply: supply.replace(/[,\s_]/g, ""),
          metadataUri: data.metadataUri,
          treasury: config.treasury,
          feeSol: data.feeSol,
          revokeMint,
          revokeFreeze,
        });
        setBusy("Finalizing…");
        await fetch(`/api/tokens/${data.id}/confirm`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(res),
        });
        setResult(res);
      } catch (err) {
        await fetch(`/api/tokens/${data.id}/confirm`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ failed: true }),
        }).catch(() => {});
        throw err;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(
        /reject|denied|cancel/i.test(msg)
          ? "Transaction was rejected in your wallet."
          : /0x1|insufficient|debit/i.test(msg)
            ? "Insufficient SOL balance to cover fees and network rent."
            : msg,
      );
    } finally {
      setBusy(null);
    }
  }

  if (result) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-2xl text-emerald-300">
          ✓
        </div>
        <h3 className="text-2xl font-bold">Your token is live!</h3>
        <p className="mt-2 text-sm text-slate-400">
          {supply} {symbol.toUpperCase()} were minted to your wallet.
        </p>
        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-left">
          <p className="text-xs text-slate-400">Mint address</p>
          <p className="break-all font-mono text-sm">{result.mintAddress}</p>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a className="btn-primary" target="_blank" rel="noreferrer" href={explorerUrl("address", result.mintAddress, config.network)}>
            View token
          </a>
          <a className="btn-ghost" target="_blank" rel="noreferrer" href={explorerUrl("tx", result.signature, config.network)}>
            View transaction
          </a>
          <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(result.mintAddress)}>
            Copy mint
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              setResult(null);
              setName("");
              setSymbol("");
              setDescription("");
              setImage(null);
              setPreview(null);
            }}
          >
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Token name</label>
          <input className="field" required maxLength={32} placeholder="e.g. Nova Coin" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Symbol (max 8)</label>
          <input className="field uppercase" required maxLength={8} placeholder="NOVA" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        </div>
        <div>
          <label className="label">Decimals</label>
          <select className="field" value={decimals} onChange={(e) => setDecimals(Number(e.target.value))}>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i} value={i}>
                {i}
                {i === 6 ? " (recommended)" : i === 9 ? " (SOL standard)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Total supply</label>
          <input className="field" required inputMode="numeric" placeholder="1000000000" value={supply} onChange={(e) => setSupply(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea className="field min-h-24" maxLength={500} placeholder="A short description of your token" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <label className="label">Token image (PNG, JPG, WEBP — max 1MB)</label>
        <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-white/20 bg-black/20 p-4 transition hover:border-violet-400/60">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-2xl">🖼</span>
          )}
          <span className="text-sm text-slate-300">
            {image ? image.name : "Click to upload your token logo"}
          </span>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => onImage(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      <div>
        <button type="button" className="text-sm text-violet-300 hover:text-violet-200" onClick={() => setShowSocials((s) => !s)}>
          {showSocials ? "− Hide" : "+ Add"} social links (optional)
        </button>
        {showSocials && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <input className="field" placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
            <input className="field" placeholder="Twitter / X" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
            <input className="field" placeholder="Telegram" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          checked={revokeFreeze}
          onChange={setRevokeFreeze}
          title="Revoke Freeze Authority"
          desc="Required to create a liquidity pool."
          fee={config.revokeFreezeFee}
        />
        <Toggle
          checked={revokeMint}
          onChange={setRevokeMint}
          title="Revoke Mint Authority"
          desc="No more tokens can ever be minted."
          fee={config.revokeMintFee}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3 text-sm">
        <span className="text-slate-400">Service fee (+ network rent)</span>
        <span className="font-semibold">{total > 0 ? fmtSol(total) : "Free"}</span>
      </div>

      {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
      {config.maintenance && (
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Token creation is temporarily paused for maintenance.
        </p>
      )}

      <button type="submit" disabled={!!busy || config.maintenance} className="btn-primary w-full !py-3.5 !text-base">
        {busy ?? (address ? "Create Token" : "Connect Wallet to Continue")}
      </button>
      <p className="text-center text-xs text-slate-500">
        Network: <span className="text-slate-300">{config.network}</span> · You will receive the full supply in your wallet.
      </p>
    </form>
  );
}

function Toggle(props: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc: string;
  fee: number;
}) {
  return (
    <button
      type="button"
      onClick={() => props.onChange(!props.checked)}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
        props.checked ? "border-emerald-400/60 bg-emerald-400/10" : "border-white/10 bg-black/20 hover:border-white/25"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
          props.checked ? "border-emerald-400 bg-emerald-400 text-black" : "border-white/30"
        }`}
      >
        {props.checked ? "✓" : ""}
      </span>
      <span>
        <span className="block text-sm font-semibold">
          {props.title} {props.fee > 0 && <span className="text-emerald-300">+{fmtSol(props.fee)}</span>}
        </span>
        <span className="block text-xs text-slate-400">{props.desc}</span>
      </span>
    </button>
  );
}
