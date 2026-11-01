import { db } from "@/db";
import { messages } from "@/db/schema";
import { desc } from "drizzle-orm";
import { messageAction } from "../../actions";

export const dynamic = "force-dynamic";

function Btn({ id, op, label, danger }: { id: number; op: string; label: string; danger?: boolean }) {
  return (
    <form action={messageAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <button className={`admin-btn ${danger ? "admin-btn-danger" : "admin-btn-muted"}`}>{label}</button>
    </form>
  );
}

export default async function MessagesAdmin() {
  const rows = await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(200);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-sm text-slate-400">Submissions from the contact form.</p>
      </div>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-slate-500">Inbox is empty.</p>}
        {rows.map((m) => (
          <div key={m.id} className={`card p-5 ${m.read ? "opacity-70" : "border-violet-400/40"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {m.name} {!m.read && <span className="ml-1 rounded bg-rose-500 px-1.5 text-[10px]">NEW</span>}
                </p>
                <a href={`mailto:${m.email}`} className="text-sm text-violet-300 hover:underline">{m.email}</a>
              </div>
              <span className="text-xs text-slate-500">{m.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{m.message}</p>
            <div className="mt-4 flex gap-2">
              <Btn id={m.id} op={m.read ? "unread" : "read"} label={m.read ? "Mark unread" : "Mark read"} />
              <Btn id={m.id} op="delete" label="Delete" danger />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
