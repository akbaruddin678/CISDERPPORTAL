import React from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Award,
  Users,
  Building2,
  Wallet,
  UserPlus,
  MailCheck,
  ClipboardList,
  CreditCard,
  CheckCircle2,
  FileText,
  IdCard,
  Image as ImageIcon,
  Home,
  Calendar,
  ArrowRight,
} from "lucide-react";
import universityHero from "./assets/university-hero.jpg";

const whyChooseNei = [
  {
    icon: Award,
    title: "HEC-Recognized Programs",
    description:
      "Every degree and diploma we offer is recognized by the Higher Education Commission and relevant regulatory bodies.",
  },
  {
    icon: Users,
    title: "Experienced Faculty",
    description:
      "Learn from qualified, industry-experienced faculty committed to your academic and professional growth.",
  },
  {
    icon: Building2,
    title: "Modern Campus & Labs",
    description:
      "Purpose-built classrooms, laboratories, and clinical training facilities designed for hands-on learning.",
  },
  {
    icon: Wallet,
    title: "Affordable Fee Structure",
    description:
      "Transparent, installment-friendly fee plans so quality education stays within reach.",
  },
];

const applySteps = [
  {
    icon: UserPlus,
    title: "Create Your Account",
    description: "Sign up on the CISD Admission Portal with your email and a password.",
  },
  {
    icon: MailCheck,
    title: "Verify Your Email",
    description: "Confirm your email address using the code we send you to activate your account.",
  },
  {
    icon: ClipboardList,
    title: "Complete Your Application",
    description: "Choose your program and session, then fill in your personal and academic details.",
  },
  {
    icon: CreditCard,
    title: "Pay the Admission Fee",
    description: "Once accepted, pay your first admission fee challan online or at any partner bank.",
  },
  {
    icon: CheckCircle2,
    title: "Get Confirmed",
    description: "Receive your official admission letter and registration number, and begin your journey.",
  },
];

const requirements = [
  { icon: FileText, label: "Matric / O-Level Certificate" },
  { icon: FileText, label: "Intermediate / A-Level Certificate (for BS programs)" },
  { icon: IdCard, label: "CNIC / B-Form (copy)" },
  { icon: ImageIcon, label: "Recent Passport-Size Photograph" },
  { icon: Home, label: "Domicile Certificate" },
];

const sessions = [
  {
    name: "Spring 2026",
    detail: "Admissions open now for the Spring 2026 intake across all eligible programs.",
  },
  {
    name: "Fall 2026",
    detail: "Applications for the Fall 2026 session are also being accepted — apply early to secure your seat.",
  },
];

const Admissions = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={universityHero}
            alt="CISD campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-28 sm:py-36 text-center">
          <span className="inline-block bg-[#E81D3A] text-white text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
            Admissions Open — 2026
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            JOIN THE FUTURE OF EDUCATION AT CISD ISLAMABAD
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto mb-10">
            Welcome to the CISD, where your academic
            journey begins with opportunity, excellence, and accessibility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-[#E81D3A] hover:bg-[#d01932] text-white font-bold py-3.5 px-8 rounded-md text-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              Apply Now <ArrowRight size={18} />
            </Link>
            <Link
              to="/programs"
              className="bg-white/10 hover:bg-white/20 border border-white/40 text-white font-bold py-3.5 px-8 rounded-md text-lg transition-colors inline-flex items-center justify-center"
            >
              Explore Programs
            </Link>
          </div>
        </div>
      </div>

      {/* Intro */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <p className="text-lg text-gray-700 leading-relaxed">
          Our admissions are now open for the 2026 academic sessions across a
          wide array of undergraduate, diploma, and short-course programs.
          Whether you're aiming for medical sciences, business administration,
          or information technology, CISD offers HEC-recognized,
          industry-relevant programs to launch your future.
        </p>
      </div>

      {/* Why Choose CISD */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
              Why Choose CISD
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A supportive, modern learning environment built around your success.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseNei.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="bg-[#E81D3A]/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#E81D3A]" />
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* How to Apply */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
            How to Apply
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Five simple steps from application to admission confirmation.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {applySteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative border border-gray-200 rounded-lg p-6 text-center">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#E81D3A] text-white text-sm font-bold flex items-center justify-center">
                  {index + 1}
                </div>
                <div className="bg-[#E81D3A]/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-[#E81D3A]" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Requirements + Sessions */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Requirements */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
              Admission Requirements
            </h2>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              {requirements.map((req) => {
                const Icon = req.icon;
                return (
                  <div key={req.label} className="flex items-center gap-3 p-4">
                    <div className="bg-[#E81D3A]/10 p-2 rounded-lg shrink-0">
                      <Icon className="w-5 h-5 text-[#E81D3A]" />
                    </div>
                    <span className="text-gray-700 font-medium">{req.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sessions */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
              Current Admission Sessions
            </h2>
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.name}
                  className="bg-white border border-gray-200 rounded-lg p-5 flex items-start gap-4"
                >
                  <div className="bg-[#E81D3A]/10 p-3 rounded-lg shrink-0">
                    <Calendar className="w-6 h-6 text-[#E81D3A]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{session.name}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{session.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-[#E81D3A] to-[#c21830] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <GraduationCap className="w-12 h-12 text-white mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-red-100 text-lg mb-8 max-w-xl mx-auto">
            Create your account today and take the first step toward your
            future at CISD.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-[#E81D3A] font-bold py-3.5 px-8 rounded-md text-lg hover:bg-gray-100 transition-colors"
          >
            Apply Now <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Admissions;
