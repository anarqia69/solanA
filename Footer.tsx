import Link from "next/link";
import type { SiteSettings } from "@/lib/settings";

export function Footer({ s }: { s: SiteSettings }) {
  const socials = [
    { label: "Twitter / X", href: s.twitter },
    { label: "Telegram", href: s.telegram },
    { label: "Discord", href: s.discord },
  ].filter((x) => x.href.trim());
  return (
    <footer className="mt-24 border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="text-lg font-bold">{s.siteName}</p>
          <p className="mt-2 text-sm text-slate-400">{s.tagline}</p>
        </div>
        <div className="flex gap-12 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-slate-200">Tools</p>
            <Link className="block text-slate-400 hover:text-white" href="/">Create Token</Link>
            <Link className="block text-slate-400 hover:text-white" href="/revoke">Revoke Authority</Link>
            <Link className="block text-slate-400 hover:text-white" href="/explorer">Explorer</Link>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-slate-200">Support</p>
            <Link className="block text-slate-400 hover:text-white" href="/#faq">FAQ</Link>
            <Link className="block text-slate-400 hover:text-white" href="/contact">Contact</Link>
            {socials.map((x) => (
              <a key={x.label} className="block text-slate-400 hover:text-white" href={x.href} target="_blank" rel="noreferrer">
                {x.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {s.siteName}. Not affiliated with Solana Foundation. Tokens are created on-chain and are irreversible.
      </div>
    </footer>
  );
}
