"use server";

import { db } from "@/db";
import { admins, faqs, messages, revocations, tokens } from "@/db/schema";
import { hashPassword, login, logout, requireAdmin, verifyPassword } from "@/lib/auth";
import { DEFAULT_SETTINGS, saveSettings, type SettingKey, type SiteSettings } from "@/lib/settings";
import { isValidAddress } from "@/lib/server-utils";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => Number(fd.get(k) ?? 0);

// ---------- Auth ----------
export async function loginAction(fd: FormData) {
  const ok = await login(str(fd, "username"), String(fd.get("password") ?? ""));
  redirect(ok ? "/admin" : "/admin/login?error=1");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

export async function changePasswordAction(fd: FormData) {
  const admin = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const username = str(fd, "username");
  if (!verifyPassword(current, admin.passwordHash)) redirect("/admin/account?error=Current+password+is+incorrect");
  if (username.length < 3) redirect("/admin/account?error=Username+must+be+at+least+3+characters");
  const patch: { username: string; passwordHash?: string } = { username };
  if (next) {
    if (next.length < 8) redirect("/admin/account?error=New+password+must+be+at+least+8+characters");
    patch.passwordHash = hashPassword(next);
  }
  try {
    await db.update(admins).set(patch).where(eq(admins.id, admin.id));
  } catch {
    redirect("/admin/account?error=Username+already+taken");
  }
  redirect("/admin/account?saved=1");
}

// ---------- Settings ----------
export async function saveSettingsAction(fd: FormData) {
  await requireAdmin();
  const values: Partial<SiteSettings> = {};
  for (const key of Object.keys(DEFAULT_SETTINGS) as SettingKey[]) {
    if (key === "maintenance") {
      values.maintenance = fd.get("maintenance") === "on" ? "true" : "false";
      continue;
    }
    if (!fd.has(key)) continue;
    values[key] = str(fd, key);
  }
  if (values.network && !["devnet", "mainnet-beta"].includes(values.network)) values.network = "devnet";
  for (const k of ["createFee", "revokeMintFee", "revokeFreezeFee"] as const) {
    const v = values[k];
    if (v !== undefined && (!Number.isFinite(Number(v)) || Number(v) < 0)) values[k] = DEFAULT_SETTINGS[k];
  }
  if (values.treasury && !isValidAddress(values.treasury)) {
    redirect("/admin/settings?error=Treasury+wallet+is+not+a+valid+Solana+address");
  }
  await saveSettings(values);
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

// ---------- Tokens ----------
export async function tokenAction(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const op = str(fd, "op");
  const [t] = await db.select().from(tokens).where(eq(tokens.id, id));
  if (!t) return;
  if (op === "delete") await db.delete(tokens).where(eq(tokens.id, id));
  if (op === "feature") await db.update(tokens).set({ featured: !t.featured }).where(eq(tokens.id, id));
  if (op === "hide") await db.update(tokens).set({ hidden: !t.hidden }).where(eq(tokens.id, id));
  if (op === "confirm") await db.update(tokens).set({ status: "confirmed" }).where(eq(tokens.id, id));
  if (op === "fail") await db.update(tokens).set({ status: "failed" }).where(eq(tokens.id, id));
  revalidatePath("/admin/tokens");
  revalidatePath("/explorer");
}

export async function purgeStaleTokensAction() {
  await requireAdmin();
  const rows = await db.select().from(tokens).where(eq(tokens.status, "pending"));
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const r of rows) {
    if (r.createdAt.getTime() < cutoff) await db.delete(tokens).where(eq(tokens.id, r.id));
  }
  revalidatePath("/admin/tokens");
}

// ---------- Revocations ----------
export async function deleteRevocationAction(fd: FormData) {
  await requireAdmin();
  await db.delete(revocations).where(eq(revocations.id, num(fd, "id")));
  revalidatePath("/admin/revocations");
}

// ---------- FAQs ----------
export async function saveFaqAction(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const question = str(fd, "question");
  const answer = str(fd, "answer");
  if (!question || !answer) return;
  const values = {
    question,
    answer,
    sortOrder: Math.trunc(num(fd, "sortOrder")) || 0,
    published: fd.get("published") === "on",
  };
  if (id) await db.update(faqs).set(values).where(eq(faqs.id, id));
  else await db.insert(faqs).values(values);
  revalidatePath("/admin/faqs");
  revalidatePath("/");
}

export async function deleteFaqAction(fd: FormData) {
  await requireAdmin();
  await db.delete(faqs).where(eq(faqs.id, num(fd, "id")));
  revalidatePath("/admin/faqs");
  revalidatePath("/");
}

// ---------- Messages ----------
export async function messageAction(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const op = str(fd, "op");
  if (op === "delete") await db.delete(messages).where(eq(messages.id, id));
  if (op === "read") await db.update(messages).set({ read: true }).where(eq(messages.id, id));
  if (op === "unread") await db.update(messages).set({ read: false }).where(eq(messages.id, id));
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}
