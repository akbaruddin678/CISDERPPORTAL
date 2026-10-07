import React from "react";
import { Link } from "react-router-dom";
import { FileText, IdCard, Image as ImageIcon, Award, Users, Wallet } from "lucide-react";
import SiteLayout, { AccentLink, Container, Eyebrow, PageHero, PrimaryLink } from "./SiteLayout";
import { ADMISSION_STEPS } from "./siteData";

const DOCUMENTS = [
  { icon: IdCard, text: "CNIC or B-Form of the student" },
  { icon: FileText, text: "Previous academic result card / certificate" },
  { icon: ImageIcon, text: "Recent passport-size photograph" },
  { icon: IdCard, text: "CNIC of father or guardian" },
];

const PERKS = [
  { icon: Award, title: "Scholarships", text: "Fully funded scholarships for deserving students." },
  { icon: Users, title: "Priority admission", text: "Priority for women, rural applicants and persons with disabilities." },
  { icon: Wallet, title: "Affordable fees", text: "Clear fee structure with a simple challan payment process." },
];

const Admissions = () => (
  <SiteLayout>
    <PageHero
      eyebrow="Admissions open"
      title="Apply to CISD in five simple steps"
      subtitle="Create your account, submit your application online and get your admission letter, with no paperwork queues."
    />

    <section className="pb-14">
      <Container>
        <ol className="grid gap-4 md:grid-cols-5">
          {ADMISSION_STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#0b2a6b] text-sm font-extrabold text-white">
                {i + 1}
              </div>
              <h3 className="text-sm font-extrabold text-[#0b2a6b]">{s.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <AccentLink to="/signup">Create your account</AccentLink>
          <PrimaryLink to="/login">I already have an account</PrimaryLink>
        </div>
      </Container>
    </section>

    <section className="bg-slate-50 py-14">
      <Container className="grid gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow>Keep these ready</Eyebrow>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#0b2a6b] md:text-3xl">Documents required</h2>
          <ul className="mt-6 space-y-3">
            {DOCUMENTS.map((d) => (
              <li key={d.text} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                <span className="rounded-lg bg-lime-100 p-2 text-lime-700">
                  <d.icon size={18} />
                </span>
                <span className="text-sm font-medium text-slate-700">{d.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Eyebrow>Why apply</Eyebrow>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#0b2a6b] md:text-3xl">
            Support for every learner
          </h2>
          <div className="mt-6 space-y-3">
            {PERKS.map((p) => (
              <div key={p.title} className="flex gap-4 rounded-xl bg-white p-4 shadow-sm">
                <span className="h-fit rounded-lg bg-[#0b2a6b] p-2 text-white">
                  <p.icon size={18} />
                </span>
                <div>
                  <h3 className="font-extrabold text-[#0b2a6b]">{p.title}</h3>
                  <p className="text-sm text-slate-600">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>

    <section className="py-14">
      <Container className="text-center">
        <p className="text-slate-600">
          Questions about admission?{" "}
          <Link to="/contact" className="font-bold text-[#0b2a6b] underline">
            Contact our admissions team
          </Link>
          .
        </p>
      </Container>
    </section>
  </SiteLayout>
);

export default Admissions;
