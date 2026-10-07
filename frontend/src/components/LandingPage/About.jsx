import React from "react";
import { BadgeCheck, Globe2, Hammer, HeartHandshake } from "lucide-react";
import SiteLayout, { AccentLink, Container, Eyebrow, PageHero } from "./SiteLayout";
import { AFFILIATIONS, SITE, STATS, WHY_CISD } from "./siteData";

const VALUES = [
  { icon: Hammer, title: "Skill-first", text: "Labs are the classroom. Theory appears only where it enables practice." },
  { icon: BadgeCheck, title: "Recognised", text: "Qualifications recognised by NAVTTC, PSDF, TEVTA and FBISE." },
  { icon: Globe2, title: "Global pathways", text: "International certifications recognised in the Gulf, Korea, Germany and Japan." },
  { icon: HeartHandshake, title: "Inclusive", text: "Priority admission for women, rural applicants and persons with disabilities." },
];

const About = () => (
  <SiteLayout>
    <PageHero
      eyebrow="About CISD"
      title="Pakistan's largest private vocational training network"
      subtitle={`Founded in ${SITE.founded}, CISD connects skills, recognised qualifications and employment opportunities in Pakistan and globally.`}
    />

    <section className="pb-14">
      <Container className="grid items-center gap-10 lg:grid-cols-2">
        <img src="/site/cisd-team.jpg" alt="CISD students" loading="lazy" className="w-full rounded-2xl shadow-lg" />
        <div>
          <Eyebrow>Our approach</Eyebrow>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#0b2a6b] md:text-3xl">
            Hands-on competence, not just theory
          </h2>
          <p className="mt-4 leading-relaxed text-slate-600">
            Every programme is built around practical skill. Courses are co-designed with employers, taught in real
            labs and linked to corporate placement pipelines, so graduates leave ready to work.
          </p>
          <p className="mt-4 leading-relaxed text-slate-600">
            Our certificates are recognised by {AFFILIATIONS.join(", ")}, which keeps your qualification portable,
            including for overseas employment.
          </p>
          <div className="mt-6">
            <AccentLink to="/programs">See our programs</AccentLink>
          </div>
        </div>
      </Container>
    </section>

    <section className="bg-[#0b2a6b] py-12">
      <Container className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl font-extrabold text-white md:text-4xl">{s.value}</div>
            <div className="mt-1 text-sm text-white/70">{s.label}</div>
          </div>
        ))}
      </Container>
    </section>

    <section className="py-16">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>What we stand for</Eyebrow>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#0b2a6b] md:text-3xl">Our values</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-xl bg-lime-100 p-3 text-lime-700">
                <v.icon size={22} />
              </div>
              <h3 className="font-extrabold text-[#0b2a6b]">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>

    <section className="bg-slate-50 py-16">
      <Container>
        <div className="grid gap-5 md:grid-cols-2">
          {WHY_CISD.map((w) => (
            <div key={w.title} className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="font-extrabold text-[#0b2a6b]">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{w.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  </SiteLayout>
);

export default About;
