"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/tokens", label: "Tokens", icon: "◉" },
  { href: "/admin/revocations", label: "Revocations", icon: "⛔" },
  { href: "/admin/messages", label: "Messages", icon: "✉" },
  { href: "/admin/faqs", label: "FAQs", icon: "?" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
  { href: "/admin/account", label: "Account", icon: "☺" },
];

export function AdminNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((i) => {
        const active = i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              active ? "bg-violet-500/20 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="w-4 text-center">{i.icon}</span>
            {i.label}
            {i.href === "/admin/messages" && unread > 0 && (
              <span className="ml-auto rounded-full bg-rose-500 px-1.5 text-xs text-white">{unread}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
