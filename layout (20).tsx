import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `${s.siteName} — Solana Token Creator | No-Code SPL Tokens`,
    description: s.tagline,
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
