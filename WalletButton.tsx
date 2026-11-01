"use client";

import { useState } from "react";
import { useWallet } from "./WalletProvider";

import { short } from "@/lib/format";

export function WalletButton({ className = "" }: { className?: string }) {
  const { address, openModal, disconnect, walletName } = useWallet();
  const [open, setOpen] = useState(false);

  if (!address) {
    return (
      <button onClick={openModal} className={`btn-primary ${className}`}>
        Connect Wallet
      </button>
    );
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`btn-ghost font-mono ${className}`}
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        {short(address)}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-white/10 bg-[#14122a] p-2 shadow-xl">
          <p className="px-3 py-1 text-xs text-slate-400">Connected with {walletName}</p>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(address);
              setOpen(false);
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
          >
            Copy address
          </button>
          <button
            onClick={() => {
              setOpen(false);
              disconnect();
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-300 hover:bg-white/5"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

export function WalletModal() {
  const { modalOpen, closeModal, wallets, connect, connecting } = useWallet();
  if (!modalOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#14122a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Connect a wallet</h3>
          <button onClick={closeModal} className="text-slate-400 hover:text-white" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {wallets.map((w) => (
            <button
              key={w.id}
              disabled={connecting}
              onClick={() => connect(w.id)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-violet-400/60 hover:bg-white/10 disabled:opacity-60"
            >
              <span className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-black"
                  style={{ background: w.color }}
                >
                  {w.name[0]}
                </span>
                {w.name}
              </span>
              <span className={`text-xs ${w.installed ? "text-emerald-400" : "text-slate-400"}`}>
                {w.installed ? "Detected" : "Install"}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400">
          We never ask for your seed phrase. You approve every transaction in your wallet.
        </p>
      </div>
    </div>
  );
}
