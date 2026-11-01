import { ContactForm } from "@/components/ContactForm";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <section className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-4xl font-extrabold tracking-tight">
        Contact <span className="gradient-text">us</span>
      </h1>
      <p className="mt-3 text-slate-300">
        Questions about creating a token? Send us a message{s.contactEmail ? ` or email ${s.contactEmail}` : ""}.
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </section>
  );
}
