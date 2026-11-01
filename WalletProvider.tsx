"use client";

import { Transaction, PublicKey } from "@solana/web3.js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PublicConfig } from "@/lib/settings";

type InjectedProvider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  publicKey?: PublicKey | null;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey?: PublicKey } | void>;
  disconnect: () => Promise<void>;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  off?: (event: string, cb: (...args: unknown[]) => void) => void;
};

export type WalletInfo = {
  id: "phantom" | "solflare" | "backpack";
  name: string;
  url: string;
  color: string;
  installed: boolean;
};

type Ctx = {
  config: PublicConfig;
  address: string | null;
  walletName: string | null;
  wallets: WalletInfo[];
  connecting: boolean;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  connect: (id: WalletInfo["id"]) => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
};

const WalletCtx = createContext<Ctx | null>(null);

type W = typeof window & {
  phantom?: { solana?: InjectedProvider };
  solana?: InjectedProvider;
  solflare?: InjectedProvider;
  backpack?: InjectedProvider;
};

function getProvider(id: WalletInfo["id"]): InjectedProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as W;
  if (id === "phantom") {
    const p = w.phantom?.solana ?? (w.solana?.isPhantom ? w.solana : undefined);
    return p?.isPhantom ? p : null;
  }
  if (id === "solflare") return w.solflare?.isSolflare ? w.solflare : null;
  if (id === "backpack") return w.backpack?.isBackpack ? w.backpack : (null as InjectedProvider | null);
  return null;
}

const WALLET_DEFS: Omit<WalletInfo, "installed">[] = [
  { id: "phantom", name: "Phantom", url: "https://phantom.app/download", color: "#ab9ff2" },
  { id: "solflare", name: "Solflare", url: "https://solflare.com/download", color: "#fc9c1c" },
  { id: "backpack", name: "Backpack", url: "https://backpack.app/downloads", color: "#e33e3f" },
];

export function WalletProvider({ config, children }: { config: PublicConfig; children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [active, setActive] = useState<WalletInfo["id"] | null>(null);
  const [installed, setInstalled] = useState<Record<string, boolean>>({});
  const [connecting, setConnecting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const detect = useCallback(() => {
    setInstalled({
      phantom: !!getProvider("phantom"),
      solflare: !!getProvider("solflare"),
      backpack: !!getProvider("backpack"),
    });
  }, []);

  const connect = useCallback(async (id: WalletInfo["id"]) => {
    const provider = getProvider(id);
    if (!provider) {
      window.open(WALLET_DEFS.find((w) => w.id === id)!.url, "_blank");
      return;
    }
    setConnecting(true);
    try {
      const res = await provider.connect();
      const pk = (res && "publicKey" in res ? res.publicKey : undefined) ?? provider.publicKey;
      if (pk) {
        setAddress(pk.toString());
        setActive(id);
        localStorage.setItem("wallet", id);
        setModalOpen(false);
      }
    } catch {
      // user rejected
    } finally {
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      detect();
      const last = localStorage.getItem("wallet") as WalletInfo["id"] | null;
      if (last) {
        const p = getProvider(last);
        p?.connect({ onlyIfTrusted: true })
          .then((res) => {
            const pk = (res && "publicKey" in res ? res.publicKey : undefined) ?? p.publicKey;
            if (pk) {
              setAddress(pk.toString());
              setActive(last);
            }
          })
          .catch(() => {});
      }
    }, 400);
    return () => clearTimeout(t);
  }, [detect]);

  useEffect(() => {
    if (!active) return;
    const p = getProvider(active);
    if (!p?.on) return;
    const onDisconnect = () => {
      setAddress(null);
      setActive(null);
    };
    const onAccount = (pk: unknown) => {
      if (pk && typeof (pk as PublicKey).toString === "function") setAddress((pk as PublicKey).toString());
      else onDisconnect();
    };
    p.on("disconnect", onDisconnect);
    p.on("accountChanged", onAccount);
    return () => {
      p.off?.("disconnect", onDisconnect);
      p.off?.("accountChanged", onAccount);
    };
  }, [active]);

  const disconnect = useCallback(async () => {
    if (active) {
      try {
        await getProvider(active)?.disconnect();
      } catch {}
    }
    localStorage.removeItem("wallet");
    setAddress(null);
    setActive(null);
  }, [active]);

  const signTransaction = useCallback(
    async (tx: Transaction) => {
      if (!active) throw new Error("Wallet not connected");
      const p = getProvider(active);
      if (!p) throw new Error("Wallet not available");
      return p.signTransaction(tx);
    },
    [active],
  );

  const value = useMemo<Ctx>(
    () => ({
      config,
      address,
      walletName: active ? WALLET_DEFS.find((w) => w.id === active)!.name : null,
      wallets: WALLET_DEFS.map((w) => ({ ...w, installed: !!installed[w.id] })),
      connecting,
      modalOpen,
      openModal: () => {
        detect();
        setModalOpen(true);
      },
      closeModal: () => setModalOpen(false),
      connect,
      disconnect,
      signTransaction,
    }),
    [config, address, active, installed, connecting, modalOpen, connect, disconnect, signTransaction, detect],
  );

  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
