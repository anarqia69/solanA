import { db } from "@/db";
import { messages } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    message?: string;
  };
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const message = (body.message ?? "").trim();
  if (!name || name.length > 100) return Response.json({ error: "Please enter your name." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return Response.json({ error: "Please enter a valid email." }, { status: 400 });
  if (message.length < 5 || message.length > 3000) return Response.json({ error: "Message must be 5–3000 characters." }, { status: 400 });
  await db.insert(messages).values({ name, email, message });
  return Response.json({ ok: true });
}
