import { PublicKey } from "@solana/web3.js";
import type { SiteSettings } from "@/lib/settings";

export function isValidAddress(value: unknown): value is string {
  if (typeof value !== "string" || value.length < 32 || value.length > 44) return false;
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export function getOrigin(req: Request, s: SiteSettings) {
  if (s.siteUrl.trim()) return s.siteUrl.trim().replace(/\/+$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

export function cleanUrl(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  if (v.length > 200) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}
