"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { fetchMintInfo, revokeAuthorities, type MintInfo } from "@/lib/solana";
import { explorerUrl, short } from "@/lib/format";
import { useWallet } from "./WalletProvider";

export function RevokeForm() {
  const { config, address, openModal, signTransaction } = useWallet();
  const [mint, setMint] = useState("");
  const [info, setInfo] = useState<MintInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [selMint, setSelMint] = useState(false);
  const [selFreeze, setSelFreeze] = useState(false);

  async function lookup() {
    setError(null);
    setInfo(null);
    setDone(null);
    setSelMint(false);
    setSelFreeze(false);
    try {
      new PublicKey(mint.trim());
    } catch {
      return setError("That is not a valid Solana address.");
    }
    setLoading(true);
    try {
      setInfo(await fetchMintInfo(config.rpcUrl, mint.trim()));
    } catch {
      setError(`Token not found on ${config.network}. Make sure it is a standard SPL token mint address.`);
    } finally {
      setLoading(false);
    }
  }

  const isOwnerMint = !!info?.mintAuthority && info.mintAuthority === address;
  const isOwnerFreeze = !!info?.freezeAuthority && info.freezeAuthority === address;
  const fee = (selMint ? config.revokeMintFee : 0) + (selFreeze ? config.revokeFreezeFee : 0);

  async function run() {
    if (!address) return openModal();
    if (!selMint && !selFreeze) return setError("Select at least one authority to revoke.");
    setError(null);
    setBusy(true);
    try {
      const signature = await revokeAuthorities({
        rpcUrl: config.rpcUrl,
        owner: address,
        signTransaction,
        mintAddress: mint.trim(),
        mint: selMint,
        freeze: selFreeze,
        treasury: config.treasury,
        feeSol: fee,
      });
      await fetch("/api/revocations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mintAddress: mint.trim(),
          wallet: address,
          types: [selMint && "mint", selFreeze && "freeze"].filter(Boolean),
          signature,
        }),
      });
      setDone(signature);
      setInfo(await fetchMintInfo(config.rpcUrl, mint.trim()));
      setSelMint(false);
      setSelFreeze(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed.";
      setError(/reject|denied|cancel/i.test(msg) ? "Transaction was rejected in your wallet." : msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-5 p-6 sm:p-8">
      <div>
        <label className="label">Token mint address</label>
        <div className="flex gap-2">
          <input className="field font-mono" placeholder="Paste your token mint address" value={mint} onChange={(e) => setMint(e.target.value)} />
          <button className="btn-ghost shrink-0" onClick={lookup} disabled={loading || !mint.trim()}>
            {loading ? "Loading…" : "Lookup"}
          </button>
        </div>
      </div>

      {info && (
        <div className="space-y-3">
          <Row
            title="Mint Authority"
            current={info.mintAuthority}
            mine={isOwnerMint}
            checked={selMint}
            onChange={setSelMint}
            fee={config.revokeMintFee}
            desc="Revoking prevents any future minting."
          />
          <Row
            title="Freeze Authority"
            current={info.freezeAuthority}
            mine={isOwnerFreeze}
            checked={selFreeze}
            onChange={setSelFreeze}
            fee={config.revokeFreezeFee}
            desc="Needed to list the token on most DEX pools."
          />
          <p className="text-xs text-slate-500">
            Supply: {(Number(info.supply) / 10 ** info.decimals).toLocaleString()} · Decimals: {info.decimals}
          </p>
        </div>
      )}

      {error && <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
      {done && (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Authority revoked successfully.{" "}
          <a className="underline" target="_blank" rel="noreferrer" href={explorerUrl("tx", done, config.network)}>
            View transaction
          </a>
        </p>
      )}

      {info && (
        <>
          <div className="flex items-center justify-between rounded-xl bg-black/30 px-4 py-3 text-sm">
            <span className="text-slate-400">Fee</span>
            <span className="font-semibold">{fee > 0 ? `${Number(fee.toFixed(4))} SOL` : "Free"}</span>
          </div>
          <button className="btn-primary w-full !py-3.5" disabled={busy || (!selMint && !selFreeze)} onClick={run}>
            {busy ? "Waiting for wallet…" : address ? "Revoke Selected" : "Connect Wallet"}
          </button>
        </>
      )}
      {!info && !address && (
        <button className="btn-primary w-full" onClick={openModal}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}

function Row(props: {
  title: string;
  current: string | null;
  mine: boolean;
  checked: boolean;
  onChange: (v: boolean) => void;
  fee: number;
  desc: string;
}) {
  const revoked = !props.current;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
      <div>
        <p className="text-sm font-semibold">
          {props.title}{" "}
          {revoked ? (
            <span className="ml-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-300">Revoked</span>
          ) : (
            <span className="ml-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-300">Active</span>
          )}
        </p>
        <p className="text-xs text-slate-400">
          {revoked
            ? "Nobody holds this authority."
            : props.mine
              ? `${props.desc} ${props.fee > 0 ? `Fee: ${props.fee} SOL.` : ""}`
              : `Held by ${short(props.current!, 5)} — connect that wallet to revoke.`}
        </p>
      </div>
      {!revoked && props.mine && (
        <input type="checkbox" className="h-5 w-5 accent-violet-500" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
      )}
    </div>
  );
}
