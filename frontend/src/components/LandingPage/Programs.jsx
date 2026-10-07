import React from "react";
import { Check } from "lucide-react";
import SiteLayout, { AccentLink, Container, PageHero } from "./SiteLayout";
import { PROGRAMS } from "./siteData";

const Programs = () => (
  <SiteLayout>
    <PageHero
      eyebrow="Programs"
      title="Practical programs for real careers"
      subtitle="Seven career paths you can pursue after Matric, plus the 2-year FBISE-approved Inter Tech degree. Scholarships are available for deserving students."
    />

    <section className="pb-8">
      <Container className="space-y-14">
        {PROGRAMS.map((p, i) => (
          <article
            key={p.slug}
            id={p.slug}
            className={`grid items-center gap-8 lg:grid-cols-2 ${i % 2 ? "lg:[&>img]:order-2" : ""}`}
          >
            <img src={p.image} alt={p.title} loading="lazy" className="w-full rounded-2xl shadow-md" />
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#7ab317]">{p.tag}</div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0b2a6b] md:text-3xl">{p.title}</h2>
              <p className="mt-3 leading-relaxed text-slate-600">{p.summary}</p>
              <ul className="mt-5 space-y-2.5">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 rounded-full bg-lime-100 p-1 text-lime-700">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <AccentLink to="/signup">Apply for this program</AccentLink>
              </div>
            </div>
          </article>
        ))}
      </Container>
    </section>

    <section className="py-16">
      <Container>
        <img
          src="/site/career-paths.jpg"
          alt="7 career paths after Matric"
          loading="lazy"
          className="mx-auto w-full max-w-xl rounded-2xl shadow-md"
        />
      </Container>
    </section>
  </SiteLayout>
);

export default Programs;
