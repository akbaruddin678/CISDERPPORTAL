import React, { useEffect, useState } from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import SiteLayout, { AccentLink, Container, PageHero } from "./SiteLayout";
import { baseUrl } from "../base/baseurl";
import { SITE, STATS } from "./siteData";

// Campuses page. The list comes from the schools created by the admin in
// "Schools & campuses", so it always matches what is set up in the portal.
const Campuses = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${baseUrl}/api/schools/public`)
      .then((res) => res.json())
      .then((json) => !cancelled && setSchools(json?.data || []))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const logoSrc = (url) => (!url ? "" : url.startsWith("http") ? url : `${baseUrl}${url}`);

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Campuses"
        title="70+ campuses across Pakistan"
        subtitle="From big cities to rural towns, CISD brings recognised skills training close to home."
      />

      <section className="pb-6">
        <Container className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl bg-lime-50 p-5 text-center">
              <div className="text-2xl font-extrabold text-[#0b2a6b] md:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs text-slate-600">{s.label}</div>
            </div>
          ))}
        </Container>
      </section>

      <section className="py-12">
        <Container>
          {loading ? (
            <p className="text-center text-slate-500">Loading campuses…</p>
          ) : schools.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-500">
              Campus details are coming soon. Contact us to find the campus nearest you.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {schools.map((s) => (
                <article key={s.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                  <div className="flex h-36 items-center justify-center bg-slate-50 p-5">
                    {s.logoUrl ? (
                      <img src={logoSrc(s.logoUrl)} alt={`${s.name} logo`} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-3xl font-extrabold text-[#0b2a6b]">{s.code}</span>
                    )}
                  </div>
                  <div className="space-y-2 p-5">
                    <h3 className="font-extrabold text-[#0b2a6b]">{s.name}</h3>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#7ab317]">{s.code}</div>
                    {s.address && (
                      <p className="flex gap-2 text-sm text-slate-600">
                        <MapPin size={16} className="mt-0.5 shrink-0" /> {s.address}
                      </p>
                    )}
                    {s.phone && (
                      <p className="flex gap-2 text-sm text-slate-600">
                        <Phone size={16} className="mt-0.5 shrink-0" /> {s.phone}
                      </p>
                    )}
                    {s.email && (
                      <p className="flex gap-2 text-sm text-slate-600">
                        <Mail size={16} className="mt-0.5 shrink-0" /> {s.email}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>

      <section className="pb-16">
        <Container className="rounded-3xl bg-[#0b2a6b] px-6 py-10 text-center">
          <h2 className="text-2xl font-extrabold text-white">Find the campus nearest you</h2>
          <p className="mt-2 text-white/75">Call {SITE.phone} or send us a message and we will guide you.</p>
          <div className="mt-6">
            <AccentLink to="/contact">Contact us</AccentLink>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
};

export default Campuses;
