import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";
import logo from "../../assets/cisd-logo.png";
import { useAuth } from "../auth/context/AuthContext";
import { NAV_LINKS, SITE } from "./siteData";

export const FONT = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  .cisd-site, .cisd-site * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
`;

export const NAVY = "#0b2a6b";
export const GREEN = "#7ab317";

export const Container = ({ className = "", children }) => (
  <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>
);

export const Eyebrow = ({ children }) => (
  <span className="inline-block rounded-full bg-lime-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-lime-700">
    {children}
  </span>
);

export const PrimaryLink = ({ to, children, className = "" }) => (
  <Link
    to={to}
    className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#0b2a6b] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#12388a] ${className}`}
  >
    {children}
  </Link>
);

export const AccentLink = ({ to, children, className = "" }) => (
  <Link
    to={to}
    className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#7ab317] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#6a9d13] ${className}`}
  >
    {children}
  </Link>
);

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { isLogin, authLoading } = useAuth();

  useEffect(() => setOpen(false), [pathname]);

  const link = ({ isActive }) =>
    `text-sm font-semibold transition-colors ${isActive ? "text-[#0b2a6b]" : "text-slate-500 hover:text-[#0b2a6b]"}`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="CISD logo" className="h-10 w-auto object-contain" />
          <span className="hidden text-sm font-extrabold leading-tight text-[#0b2a6b] sm:block">
            College of International
            <br />
            Skills Development
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className={link}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block">
          {!authLoading && (
            <Link
              to={isLogin ? "/profile" : "/login"}
              className="rounded-full bg-[#0b2a6b] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#12388a]"
            >
              {isLogin ? "My Portal" : "Login"}
            </Link>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-[#0b2a6b] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-3 text-sm font-semibold ${isActive ? "bg-lime-50 text-[#0b2a6b]" : "text-slate-600"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to={isLogin ? "/profile" : "/login"}
              className="mt-2 rounded-full bg-[#0b2a6b] px-5 py-3 text-center text-sm font-bold text-white"
            >
              {isLogin ? "My Portal" : "Login"}
            </Link>
          </Container>
        </div>
      )}
    </header>
  );
};

const Footer = () => (
  <footer className="bg-[#0b2a6b] text-white">
    <Container className="grid gap-10 py-14 md:grid-cols-4">
      <div className="md:col-span-2">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-white p-2">
            <img src={logo} alt="CISD logo" className="h-10 w-auto object-contain" />
          </span>
          <span className="text-lg font-extrabold leading-tight">
            College of International
            <br />
            Skills Development
          </span>
        </div>
        <p className="mt-5 max-w-md text-sm leading-relaxed text-white/70">
          Pakistan's largest private vocational training network, connecting skills, recognised qualifications and
          employment opportunities in Pakistan and globally.
        </p>
        <div className="mt-5 flex gap-3">
          <a href={SITE.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="rounded-full bg-white/10 p-2.5 hover:bg-white/20">
            <Instagram size={18} />
          </a>
          <a href={SITE.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="rounded-full bg-white/10 p-2.5 hover:bg-white/20">
            <Facebook size={18} />
          </a>
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#9bd13d]">Explore</h4>
        <ul className="space-y-2.5 text-sm text-white/75">
          {NAV_LINKS.map((item) => (
            <li key={item.to}>
              <Link to={item.to} className="hover:text-white">
                {item.label}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/login" className="hover:text-white">
              Login
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#9bd13d]">Contact</h4>
        <ul className="space-y-3 text-sm text-white/75">
          <li className="flex gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0" /> {SITE.address}
          </li>
          <li className="flex gap-2">
            <Phone size={16} className="mt-0.5 shrink-0" />
            <a href={SITE.phoneHref} className="hover:text-white">
              {SITE.phone}
            </a>
          </li>
          <li className="flex gap-2">
            <Mail size={16} className="mt-0.5 shrink-0" />
            <a href={`mailto:${SITE.email}`} className="hover:text-white">
              {SITE.email}
            </a>
          </li>
        </ul>
      </div>
    </Container>
    <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
      © {new Date().getFullYear()} College of International Skills Development. All rights reserved.
    </div>
  </footer>
);

export const PageHero = ({ eyebrow, title, subtitle }) => (
  <section className="bg-gradient-to-b from-lime-50 to-white">
    <Container className="py-14 text-center md:py-20">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-[#0b2a6b] md:text-5xl">
        {title}
      </h1>
      {subtitle && <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">{subtitle}</p>}
    </Container>
  </section>
);

const SiteLayout = ({ children }) => (
  <div className="cisd-site flex min-h-screen flex-col bg-white text-slate-800">
    <style>{FONT}</style>
    <SiteHeader />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

export default SiteLayout;
