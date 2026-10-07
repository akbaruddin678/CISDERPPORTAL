import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, GraduationCap, Handshake, Users } from "lucide-react";
import SiteLayout, { AccentLink, Container, Eyebrow, PrimaryLink } from "./SiteLayout";
import AdmissionAnnouncementModal from "./AdmissionAnnouncementModal";
import { ADMISSION_STEPS, AFFILIATIONS, PROGRAMS, STATS, WHY_CISD } from "./siteData";

const WHY_ICONS = [GraduationCap, BadgeCheck, Handshake, Users];

const UniversityLanding = () => (
  <SiteLayout>
    <AdmissionAnnouncementModal />

    {/* Hero */}
    <section className="bg-gradient-to-b from-lime-50 via-white to-white">
      <Container className="grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2">
        <div>
          <Eyebrow>Admissions open · Scholarships available</Eyebrow>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-[#0b2a6b] md:text-5xl lg:text-6xl">
            Skills that turn into <span className="text-[#7ab317]">careers.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            Pakistan's largest private vocational training network. Learn hands-on, earn a recognised qualification and
            step into work in Pakistan and abroad.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AccentLink to="/signup">
              Apply now <ArrowRight size={16} />
            </AccentLink>
            <PrimaryLink to="/programs">Explore programs</PrimaryLink>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-500">
            <span>Recognised by</span>
            {AFFILIATIONS.map((a) => (
              <span key={a} className="rounded-full border border-slate-200 px-3 py-1 text-[#0b2a6b]">
                {a}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-3 rounded-[2rem] bg-lime-200/50" />
          <img
            src="/site/cisd-team.jpg"
            alt="CISD students from every program"
            className="relative w-full rounded-[1.5rem] object-cover shadow-xl"
          />
        </div>
      </Container>
    </section>

    {/* Stats */}
    <section className="bg-[#0b2a6b]">
      <Container className="grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl font-extrabold text-white md:text-4xl">{s.value}</div>
            <div className="mt-1 text-sm text-white/70">{s.label}</div>
          </div>
        ))}
      </Container>
    </section>

    {/* Programs */}
    <section className="py-16 md:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Programs</Eyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0b2a6b] md:text-4xl">
            7 career paths you can pursue after Matric
          </h2>
          <p className="mt-3 text-slate-600">Practical programs built around real jobs, with scholarships for deserving students.</p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.slice(1).map((p) => (
            <Link
              key={p.slug}
              to="/programs"
              className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <img src={p.image} alt={p.title} loading="lazy" className="aspect-square w-full object-cover" />
              <div className="p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-[#7ab317]">{p.tag}</div>
                <h3 className="mt-1 text-lg font-extrabold text-[#0b2a6b]">{p.title}</h3>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#0b2a6b] group-hover:gap-2">
                  Learn more <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>

    {/* Inter Tech feature */}
    <section className="bg-lime-50 py-16 md:py-20">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <img
          src="/site/inter-tech-graphic.jpg"
          alt="2 years Inter Tech degree program"
          loading="lazy"
          className="w-full rounded-2xl shadow-lg"
        />
        <div>
          <Eyebrow>FBISE approved</Eyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0b2a6b] md:text-4xl">
            2-year Inter Tech Degree Program
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Earn an FBISE-approved Inter Tech degree while building practical skills in graphic design, branding, video
            editing and media production. Fully funded scholarships are available for deserving students.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <AccentLink to="/signup">Apply now</AccentLink>
            <PrimaryLink to="/admissions">How admission works</PrimaryLink>
          </div>
        </div>
      </Container>
    </section>

    {/* Why CISD */}
    <section className="py-16 md:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Why CISD</Eyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0b2a6b] md:text-4xl">
            Learn by doing. Graduate ready to work.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_CISD.map((item, i) => {
            const Icon = WHY_ICONS[i];
            return (
              <div key={item.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="mb-4 inline-flex rounded-xl bg-lime-100 p-3 text-lime-700">
                  <Icon size={22} />
                </div>
                <h3 className="font-extrabold text-[#0b2a6b]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>

    {/* Admission steps */}
    <section className="bg-slate-50 py-16 md:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Admissions</Eyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0b2a6b] md:text-4xl">
            Apply in five simple steps
          </h2>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-5">
          {ADMISSION_STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#0b2a6b] text-sm font-extrabold text-white">
                {i + 1}
              </div>
              <h3 className="text-sm font-extrabold text-[#0b2a6b]">{s.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>

    {/* CTA */}
    <section className="py-16 md:py-20">
      <Container>
        <div className="overflow-hidden rounded-3xl bg-[#0b2a6b] px-6 py-12 text-center md:px-12 md:py-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Ready to start? Admissions are open.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/75">
            Limited seats at 70+ campuses across Pakistan. Scholarships are available for deserving students.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <AccentLink to="/signup">Apply now</AccentLink>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </Container>
    </section>
  </SiteLayout>
);

export default UniversityLanding;
