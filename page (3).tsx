import { RevokeForm } from "@/components/RevokeForm";

export const metadata = { title: "Revoke Solana Token Authority" };

export default function RevokePage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-4xl font-extrabold tracking-tight">
        Revoke <span className="gradient-text">Authority</span>
      </h1>
      <p className="mt-3 text-slate-300">
        Revoke the mint and/or freeze authority of any SPL token you control. Revoking is permanent and builds trust with
        buyers and liquidity platforms.
      </p>
      <div className="mt-8">
        <RevokeForm />
      </div>
    </section>
  );
}
