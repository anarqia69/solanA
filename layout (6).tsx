import Link from "next/link";
import type { ReactNode } from "react";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { count, eq } from "drizzle-orm";
import { logoutAction } from "../actions";
import { AdminNav } from "./AdminNav";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const [{ n: unread }] = await db.select({ n: count() }).from(messages).where(eq(messages.read, false));
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-white/10 bg-black/30 p-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="mb-4 flex items-center justify-between md:mb-6 md:block">
          <p className="flex items-center gap-2 text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-emerald-400 text-sm text-black">✦</span>
            Admin
          </p>
          <p className="text-xs text-slate-400 md:mt-1">Signed in as {admin.username}</p>
        </div>
        <AdminNav unread={unread} />
        <div className="mt-4 flex gap-2 md:absolute md:bottom-4 md:left-4 md:right-4 md:flex-col">
          <Link href="/" target="_blank" className="admin-btn admin-btn-muted justify-center">View site ↗</Link>
          <form action={logoutAction} className="contents">
            <button className="admin-btn admin-btn-danger justify-center">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1 p-4 sm:p-8">{children}</div>
    </div>
  );
}
