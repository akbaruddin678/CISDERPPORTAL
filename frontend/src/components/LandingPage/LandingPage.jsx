import React from "react";
import studentsStudying from "./assets/students-studying.jpg";
import { Link } from "react-router-dom";
import AdmissionAnnouncementModal from "./AdmissionAnnouncementModal";

import {
  Star,
  Users,
  GraduationCap,
  BookOpen,
  MapPin,
  Phone,
  Mail,
  Clock,
  Award,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

/* ─────────────────────────────
   HELPERS & STYLES
───────────────────────────── */
const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { font-family: 'Plus Jakarta Sans', sans-serif; }
`;

const fmtPKR = (val) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(val || 0);

/* =========================
   UI Components
   ========================= */
const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  as: As = "button",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";
  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-3",
  };
  const variants = {
    primary: "bg-blue-900 text-white hover:brightness-110 active:brightness-95",
    university:
      "bg-yellow-500 text-blue-900 hover:brightness-110 active:brightness-95",
    accent:
      "bg-yellow-500 text-blue-900 hover:brightness-110 active:brightness-95 shadow-md",
    outline: "border border-current text-blue-900/90 hover:bg-white/80",
    ghost: "text-blue-900 hover:bg-blue-100",
  };
  return (
    <As
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </As>
  );
};

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border border-black/5 bg-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.05)] backdrop-blur-sm ${className}`}
  >
    {children}
  </div>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const variants = {
    default: "bg-blue-100 text-blue-900",
    secondary: "bg-yellow-500/20 text-yellow-600 border border-yellow-500/30",
    outline: "border border-yellow-500 text-yellow-500",
  };
  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

/* =========================
   Page
   ========================= */
const UniversityLanding = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style>{FONT_IMPORT}</style>
      <AdmissionAnnouncementModal />

      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center">
          <div className="absolute inset-0 bg-[url('/cisd-logo.png')] bg-contain bg-center bg-no-repeat opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white/80 to-lime-50/70" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          {/* Headline with smooth entry and shadow for legibility */}
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-black mb-6 tracking-tighter whitespace-nowrap text-red-900 transition-all duration-700 ease-in-out animate-in fade-in slide-in-from-bottom-4 flex justify-center">
            <span className="flex gap-4 md:gap-8 drop-shadow-sm">
              <span>CISD</span>
            </span>
          </h1>

          {/* Subheadline with fade-in delay */}
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-white/90 leading-relaxed font-medium transition-opacity duration-1000 delay-300 animate-in fade-in">
            Join thousands of students who have transformed their lives through
            our world-class education and cutting-edge research.
          </p>

          {/* Buttons with hover scale effects */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in zoom-in-95 duration-700 delay-500">
            <Button
              as={Link}
              to="/login"
              size="lg"
              variant="accent"
              className="text-lg px-8 py-4 hover:scale-105 transition-transform duration-300"
            >
              Apply for Fall 2026 <ChevronRight className="ml-1.5 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-900 hover:scale-105 transition-all duration-300"
            >
              Schedule Campus Tour
            </Button>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-6">
                About CISD
              </Badge>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-blue-900">
                Leading Innovation in Higher Education
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                For over three decades, CISD has been
                at the forefront of academic innovation, research excellence,
                and student success.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { i: Award, t: "Internationally accredited programs" },
                  { i: Users, t: "World-class faculty" },
                  { i: BookOpen, t: "State-of-the-art facilities" },
                ].map((x, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <x.i className="h-6 w-6 text-yellow-500" />{" "}
                    <span>{x.t}</span>
                  </div>
                ))}
              </div>
              <Button variant="university" size="lg">
                Learn More About CISD
              </Button>
            </div>
            <img
              src={studentsStudying}
              alt="Students"
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-950 text-white py-16">
        <div className="container mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap className="h-8 w-8 text-yellow-500" />
              <h3 className="text-xl font-bold">
                CISD
              </h3>
            </div>
            <p className="text-white/70">
              Empowering minds and transforming lives since 1985.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-yellow-500">Academics</h4>
            <ul className="space-y-3 text-white/70 text-sm">
              <li>Undergraduate Programs</li>
              <li>Graduate Programs</li>
              <li>Research Opportunities</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-yellow-500">Student Life</h4>
            <ul className="space-y-3 text-white/70 text-sm">
              <li>Campus Housing</li>
              <li>Career Services</li>
              <li>Alumni Network</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-yellow-500">Contact</h4>
            <div className="space-y-3 text-sm text-white/70">
              <p className="flex items-center gap-2">
                <MapPin size={16} /> B/17, Islamabad, Pakistan
              </p>
              <p className="flex items-center gap-2">
                <Phone size={16} /> (555) 123-4567
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UniversityLanding;
