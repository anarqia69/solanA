import type { ReactNode } from "react";
import { getSettings, toPublicConfig } from "@/lib/settings";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { WalletProvider } from "./WalletProvider";
import { WalletModal } from "./WalletButton";

export async function SiteShell({ children }: { children: ReactNode }) {
  const s = await getSettings();
  const config = toPublicConfig(s);
  return (
    <WalletProvider config={config}>
      {s.announcement.trim() && (
        <div className="bg-gradient-to-r from-violet-600 to-emerald-500 px-4 py-2 text-center text-sm font-medium text-black">
          {s.announcement}
        </div>
      )}
      <Header />
      <main>{children}</main>
      <Footer s={s} />
      <WalletModal />
    </WalletProvider>
  );
}
