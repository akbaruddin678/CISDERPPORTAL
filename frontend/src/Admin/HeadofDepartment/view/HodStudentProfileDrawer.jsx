import React, { useEffect, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  AlertCircle,
  GraduationCap,
  User,
  Users,
  BookOpen,
  MapPin,
  CalendarDays,
  Layers,
  Building2,
} from "lucide-react";
import { StatusChip, StudentAvatar } from "./HodStudentBits";

const dash = "—";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : dash;

const ageFrom = (dob) => {
  if (!dob) return null;
  const b = new Date(dob);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age >= 0 && age < 120 ? age : null;
};

// CNIC is stored as 13 plain digits; show it in the familiar 5-7-1 form.
const fmtCnic = (raw) => {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length !== 13) return raw || dash;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
};

const titleCase = (v) =>
  v ? String(v).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : dash;

const INCOME_LABELS = {
  less_than_40000: "Less than 40,000",
  "40000_to_100000": "40,000 – 100,000",
  above_100000: "Above 100,000",
};

const fmtAddress = (a) => {
  if (!a) return dash;
  const parts = [a.address, a.district, a.province, a.country].filter(Boolean);
  return parts.length ? parts.join(", ") : dash;
};

const TABS = [
  { key: "overview", label: "Overview", icon: GraduationCap },
  { key: "personal", label: "Personal", icon: User },
  { key: "family", label: "Family", icon: Users },
  { key: "education", label: "Education", icon: BookOpen },
];

const Field = ({ label, value, wide }) => (
  <div className={wide ? "sm:col-span-2" : ""}>
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="text-sm font-semibold text-slate-800 mt-1 break-words">{value || dash}</p>
  </div>
);

const Card = ({ title, icon, children }) => {
  const Icon = icon;
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {Icon && (
            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Icon size={14} />
            </span>
          )}
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};

const Fields = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">{children}</div>
);

const StatTile = ({ icon, label, value }) => {
  const Icon = icon;
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
        <Icon size={16} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-black text-slate-900 mt-0.5">{value || dash}</p>
    </div>
  );
};

const BodySkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="grid grid-cols-2 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-2xl bg-slate-200/70" />
      ))}
    </div>
    <div className="h-40 rounded-2xl bg-slate-200/70" />
    <div className="h-32 rounded-2xl bg-slate-200/70" />
  </div>
);

const HodStudentProfileDrawer = ({
  isOpen,
  onClose,
  profile,
  isLoading,
  errorMessage,
  position,
  total,
  onPrev,
  onNext,
}) => {
  const [tab, setTab] = useState("overview");

  // Each newly opened / navigated-to student starts on the Overview tab.
  const studentKey = profile?._id;
  useEffect(() => {
    setTab("overview");
  }, [studentKey]);

  // Esc closes; ← / → step through the students on screen.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && onPrev) onPrev();
      else if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen) return null;

  const p = profile?.personalInfo || {};
  const f = profile?.familyInfo || {};
  const e = profile?.enrollment || {};
  const education = profile?.educationHistory || [];
  const age = ageFrom(p.dob);
  const semesterLabel = profile?.semester?.number ? `Section ${profile.semester.number}` : null;

  return (
    <div className="fixed inset-0 z-[110]">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 h-full w-full sm:max-w-xl bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Gradient header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white px-6 pt-5 pb-6 shrink-0">
          <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full bg-white/5" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onPrev}
                disabled={!onPrev}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-30 disabled:hover:bg-white/15 flex items-center justify-center transition-colors"
                aria-label="Previous student"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={onNext}
                disabled={!onNext}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-30 disabled:hover:bg-white/15 flex items-center justify-center transition-colors"
                aria-label="Next student"
              >
                <ChevronRight size={16} />
              </button>
              {position > 0 && (
                <span className="ml-2 text-xs font-semibold text-indigo-100">
                  {position} of {total}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="relative flex items-center gap-4 mt-5">
            <StudentAvatar name={p.fullName} photo={profile?.profilePhoto} size="lg" ring />
            <div className="min-w-0">
              <h2 className="text-xl font-black leading-tight truncate">
                {isLoading && !profile ? "Loading…" : p.fullName || "Student profile"}
              </h2>
              {profile && (
                <>
                  <p className="text-xs font-mono font-semibold text-indigo-100 mt-1">
                    {profile.studentId}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    {profile.program?.name && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/15 ring-1 ring-white/25">
                        {profile.program.name}
                      </span>
                    )}
                    {semesterLabel && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/15 ring-1 ring-white/25">
                        {semesterLabel}
                      </span>
                    )}
                    <StatusChip status={profile.status} onDark />
                  </div>
                </>
              )}
            </div>
          </div>

          {profile && (p.email || p.phone) && (
            <div className="relative flex gap-2 mt-5">
              {p.phone && (
                <a
                  href={`tel:${p.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 ring-1 ring-white/20 text-xs font-bold transition-colors"
                >
                  <Phone size={14} /> {p.phone}
                </a>
              )}
              {p.email && (
                <a
                  href={`mailto:${p.email}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 ring-1 ring-white/20 text-xs font-bold transition-colors min-w-0"
                >
                  <Mail size={14} className="shrink-0" />
                  <span className="truncate">{p.email}</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-200 px-4 shrink-0">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                    active
                      ? "border-indigo-600 text-indigo-700"
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading && !profile ? (
            <BodySkeleton />
          ) : errorMessage ? (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-5 text-sm font-medium">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              {errorMessage}
            </div>
          ) : profile ? (
            <>
              {tab === "overview" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <StatTile icon={Layers} label="Section" value={semesterLabel} />
                    <StatTile icon={CalendarDays} label="Session" value={profile.session?.name} />
                    <StatTile icon={GraduationCap} label="Enrollment" value={titleCase(e.status)} />
                    <StatTile
                      icon={CalendarDays}
                      label="Enrolled on"
                      value={fmtDate(e.enrollmentDate || profile.admittedOn)}
                    />
                  </div>
                  <Card title="Academic placement" icon={Building2}>
                    <Fields>
                      <Field label="Class" value={profile.department?.name} />
                      <Field label="Program" value={profile.program?.name} />
                      <Field label="Registration No." value={profile.studentId} />
                      <Field label="Academic year" value={e.academicYear} />
                    </Fields>
                  </Card>
                </>
              )}

              {tab === "personal" && (
                <>
                  <Card title="Identity" icon={User}>
                    <Fields>
                      <Field label="Full name" value={p.fullName} />
                      <Field label="CNIC" value={fmtCnic(p.cnic)} />
                      <Field
                        label="Date of birth"
                        value={p.dob ? `${fmtDate(p.dob)}${age != null ? ` · ${age} yrs` : ""}` : null}
                      />
                      <Field label="Gender" value={titleCase(p.gender)} />
                      <Field label="Email" value={p.email} />
                      <Field label="Phone" value={p.phone} />
                    </Fields>
                  </Card>
                  <Card title="Address" icon={MapPin}>
                    <Fields>
                      <Field label="Current address" value={fmtAddress(p.currentAddress)} wide />
                      <Field label="Permanent address" value={fmtAddress(p.permanentAddress)} wide />
                    </Fields>
                  </Card>
                </>
              )}

              {tab === "family" && (
                <Card title="Family & guardian" icon={Users}>
                  <Fields>
                    <Field label="Father's name" value={f.fatherName} />
                    <Field label="Father's CNIC" value={f.fatherCnic ? fmtCnic(f.fatherCnic) : null} />
                    <Field label="Mother's name" value={f.motherName} />
                    <Field label="Mother's CNIC" value={f.motherCnic ? fmtCnic(f.motherCnic) : null} />
                    <Field label="Father's profession" value={titleCase(f.fathersProfession)} />
                    <Field label="Guardian status" value={titleCase(f.guardianStatus)} />
                    <Field label="Guardian phone" value={f.guardianPhone} />
                    <Field label="Guardian designation" value={f.guardianDesignation} />
                    <Field
                      label="Income bracket"
                      value={INCOME_LABELS[f.incomeBracket] || titleCase(f.incomeBracket)}
                    />
                  </Fields>
                </Card>
              )}

              {tab === "education" &&
                (education.length === 0 ? (
                  <Card>
                    <div className="py-8 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <BookOpen size={20} />
                      </div>
                      <p className="text-sm font-bold text-slate-600">No education records on file</p>
                    </div>
                  </Card>
                ) : (
                  education.map((row, i) => {
                    const pct =
                      row.obtainedMarks != null && row.totalMarks
                        ? Math.round((row.obtainedMarks / row.totalMarks) * 100)
                        : null;
                    return (
                      <Card key={row._id || i}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900">
                              {row.educationProgram || dash}
                            </p>
                            <p className="text-xs font-medium text-slate-500 mt-1">
                              {[row.institution, row.board].filter(Boolean).join(" · ") || dash}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium mt-1">
                              Started {fmtDate(row.startDate)}
                            </p>
                          </div>
                          {pct != null && (
                            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black shrink-0">
                              {pct}%
                            </span>
                          )}
                        </div>
                        {pct != null && (
                          <div className="mt-4">
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <p className="text-[11px] font-mono text-slate-500 mt-1.5">
                              {row.obtainedMarks} / {row.totalMarks} marks
                            </p>
                          </div>
                        )}
                      </Card>
                    );
                  })
                ))}
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
};

export default HodStudentProfileDrawer;
