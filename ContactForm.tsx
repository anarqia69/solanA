"use client";

import { useState } from "react";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setState("sending");
    setError(null);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd)),
    });
    if (res.ok) {
      setState("sent");
      form.reset();
    } else {
      setState("idle");
      setError((await res.json()).error || "Could not send message.");
    }
  }

  if (state === "sent") {
    return (
      <div className="card p-8 text-center">
        <p className="text-xl font-semibold">Message sent ✓</p>
        <p className="mt-2 text-sm text-slate-400">Thanks for reaching out — we will get back to you shortly.</p>
        <button className="btn-ghost mt-5" onClick={() => setState("idle")}>Send another</button>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input name="name" required className="field" />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" required className="field" />
        </div>
      </div>
      <div>
        <label className="label">Message</label>
        <textarea name="message" required minLength={5} className="field min-h-36" />
      </div>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button className="btn-primary w-full" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
