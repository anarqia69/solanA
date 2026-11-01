import { db } from "@/db";
import { faqs } from "@/db/schema";
import { asc } from "drizzle-orm";
import { ensureSeed } from "@/lib/settings";
import { deleteFaqAction, saveFaqAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function FaqsAdmin() {
  await ensureSeed();
  const rows = await db.select().from(faqs).orderBy(asc(faqs.sortOrder), asc(faqs.id));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">FAQs</h1>
        <p className="text-sm text-slate-400">Shown on the homepage, ordered by sort number.</p>
      </div>

      <form action={saveFaqAction} className="card space-y-3 p-5">
        <h2 className="font-semibold">Add FAQ</h2>
        <input name="question" required placeholder="Question" className="admin-input" />
        <textarea name="answer" required placeholder="Answer" className="admin-input min-h-20" />
        <div className="flex items-center gap-4">
          <input name="sortOrder" type="number" defaultValue={rows.length} className="admin-input !w-24" />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" name="published" defaultChecked /> Published
          </label>
          <button className="admin-btn ml-auto">Add</button>
        </div>
      </form>

      <div className="space-y-4">
        {rows.map((f) => (
          <div key={f.id} className="card p-5">
            <form action={saveFaqAction} className="space-y-3">
              <input type="hidden" name="id" value={f.id} />
              <input name="question" required defaultValue={f.question} className="admin-input font-medium" />
              <textarea name="answer" required defaultValue={f.answer} className="admin-input min-h-20" />
              <div className="flex items-center gap-4">
                <input name="sortOrder" type="number" defaultValue={f.sortOrder} className="admin-input !w-24" />
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" name="published" defaultChecked={f.published} /> Published
                </label>
                <button className="admin-btn ml-auto">Save</button>
              </div>
            </form>
            <form action={deleteFaqAction} className="mt-2">
              <input type="hidden" name="id" value={f.id} />
              <button className="admin-btn admin-btn-danger">Delete</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
