import React, { useState } from "react";
import { Mail, MapPin, Phone, Instagram, Facebook } from "lucide-react";
import SiteLayout, { Container, PageHero } from "./SiteLayout";
import { SITE } from "./siteData";

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
    {children}
  </label>
);

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#7ab317] focus:ring-2 focus:ring-lime-100";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  // No contact-form API exists, so this opens the visitor's email app addressed to CISD.
  const submit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Enquiry from ${form.name}`);
    const body = encodeURIComponent(
      `${form.message}\n\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}`,
    );
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
  };

  const cards = [
    { icon: Phone, title: "Call us", value: SITE.phone, href: SITE.phoneHref },
    { icon: Mail, title: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
    { icon: MapPin, title: "Head office", value: SITE.address },
  ];

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact"
        title="We would love to hear from you"
        subtitle="Questions about programs, admission or scholarships? Reach out and our team will help."
      />

      <section className="pb-16">
        <Container className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            {cards.map((c) => (
              <div key={c.title} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <span className="h-fit rounded-xl bg-lime-100 p-3 text-lime-700">
                  <c.icon size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0b2a6b]">{c.title}</h3>
                  {c.href ? (
                    <a href={c.href} className="text-sm text-slate-600 hover:text-[#0b2a6b]">
                      {c.value}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-600">{c.value}</p>
                  )}
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-1">
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="rounded-full bg-[#0b2a6b] p-3 text-white hover:bg-[#12388a]"
              >
                <Instagram size={18} />
              </a>
              <a
                href={SITE.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="rounded-full bg-[#0b2a6b] p-3 text-white hover:bg-[#12388a]"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-3"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input required value={form.name} onChange={set("name")} className={inputCls} placeholder="Your name" />
              </Field>
              <Field label="Phone">
                <input value={form.phone} onChange={set("phone")} className={inputCls} placeholder="03xx xxxxxxx" />
              </Field>
            </div>
            <Field label="Email">
              <input
                required
                type="email"
                value={form.email}
                onChange={set("email")}
                className={inputCls}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Message">
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={set("message")}
                className={inputCls}
                placeholder="How can we help?"
              />
            </Field>
            <button
              type="submit"
              className="rounded-full bg-[#7ab317] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#6a9d13]"
            >
              Send message
            </button>
          </form>
        </Container>
      </section>
    </SiteLayout>
  );
};

export default Contact;
