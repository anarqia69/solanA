import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getAdmin()) redirect("/admin");
  const { error } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form action={loginAction} className="card w-full max-w-sm space-y-4 p-8">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-emerald-400 text-xl text-black">✦</div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-slate-400">Sign in to manage your platform</p>
        </div>
        {error && <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">Invalid username or password.</p>}
        <div>
          <label className="label">Username</label>
          <input name="username" className="field" autoComplete="username" required defaultValue="" />
        </div>
        <div>
          <label className="label">Password</label>
          <input name="password" type="password" className="field" autoComplete="current-password" required />
        </div>
        <button className="btn-primary w-full">Sign in</button>
      </form>
    </div>
  );
}
