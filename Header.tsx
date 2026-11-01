"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WalletButton } from "./WalletButton";
import { useWallet } from "./WalletProvider";

const links = [
  { href: "/", label: "Create Token" },
  { href: "/revoke", label: "Revoke Authority" },
  { href: "/explorer", label: "Explorer" },
  { href: "/#faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Logo({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-emerald-400 text-sm text-black">
        ✦
      </span>
      {name}
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const { config } = useWallet();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0b0a1a]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/">
          <Logo name={config.siteName} />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm transition hover:text-white ${
                pathname === l.href ? "text-white" : "text-slate-400"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {config.network !== "mainnet-beta" && (
            <span className="hidden rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-300 sm:inline">
              {config.network}
            </span>
          )}
          <WalletButton />
          <button
            className="btn-ghost !px-3 md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-white/5 px-4 py-2 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
