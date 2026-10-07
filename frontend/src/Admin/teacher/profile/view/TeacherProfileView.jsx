import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, IdCard, Mail, Phone, MapPin, HeartPulse, Users, Calendar,
  GraduationCap, BookMarked, FlaskConical, Briefcase, Clock4, Award,
  FileText, Download, CheckCircle2, ShieldAlert, Sparkles,
} from "lucide-react";
import StateCard from "../../components/StateCard";

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "—";

const SectionCard = ({ icon: Icon, title, children, className = "" }) => (
  <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 ${className}`}>
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
      <Icon size={17} className="text-slate-400" />
      <h4 className="text-base font-bold text-slate-800">{title}</h4>
    </div>
    {children}
  </div>
);

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={15} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-700 break-words">{value || "—"}</p>
    </div>
  </div>
);

const STATUS_STYLES = {
  Active: "bg-emerald-100 text-emerald-700",
  "On Leave": "bg-amber-100 text-amber-700",
  Suspended: "bg-rose-100 text-rose-700",
  Resigned: "bg-slate-200 text-slate-600",
  Terminated: "bg-slate-200 text-slate-600",
};

const TeacherProfileView = ({ profile, documents = [], isFetching, isError, refetch }) => {
  const navigate = useNavigate();

  if (isFetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <StateCard variant="loading" title="Loading your profile…" className="w-full max-w-sm" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <StateCard
          variant="error"
          icon={ShieldAlert}
          title="Couldn't load your profile"
          className="w-full max-w-sm"
          action={
            <button
              onClick={refetch}
              className="mt-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors text-sm"
            >
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  const person = profile.personalInfo || {};
  const initials = (person.name || "?").charAt(0).toUpperCase();
  const emergencyContacts = profile.emergencyContacts?.length
    ? profile.emergencyContacts
    : person.emergencyContact?.name
      ? [person.emergencyContact]
      : [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-12 font-sans w-full">
      <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 shadow-lg">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="relative p-5 sm:p-7 flex items-center gap-4 sm:gap-5 flex-wrap">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 flex-shrink-0">
              <ArrowLeft size={20} />
            </button>
            {person.profilePhotoUrl ? (
              <img
                src={person.profilePhotoUrl}
                alt={person.name}
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border-2 border-white/10"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/10 text-white flex items-center justify-center flex-shrink-0 font-black text-2xl">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${STATUS_STYLES[profile.status] || "bg-white/10 text-white"}`}>
                  <Sparkles size={11} /> {profile.status || "Active"}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide bg-white/10 text-white px-2.5 py-1 rounded-full">
                  {profile.employmentType}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">{person.name || "Unnamed"}</h1>
              <p className="text-sm text-white/60 font-medium mt-0.5">
                {profile.designation} {profile.departmentId?.name ? `· ${profile.departmentId.name}` : ""}
              </p>
              <p className="text-xs text-white/40 font-semibold mt-1">Employee ID: {profile.employeeId}</p>
            </div>
          </div>
        </div>

        {/* Quick stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wide">
              <Briefcase size={13} /> Teaching Exp.
            </div>
            <p className="mt-1 text-xl font-black text-slate-800">{profile.experienceYears ?? 0} yrs</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wide">
              <GraduationCap size={13} /> Highest Degree
            </div>
            <p className="mt-1 text-xl font-black text-slate-800">{profile.highestDegree || "—"}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wide">
              <Calendar size={13} /> Joined
            </div>
            <p className="mt-1 text-xl font-black text-slate-800">{formatDate(profile.joiningDate).split(",")[1]?.trim() || formatDate(profile.joiningDate)}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wide">
              <FileText size={13} /> Documents
            </div>
            <p className="mt-1 text-xl font-black text-slate-800">{documents.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SectionCard icon={IdCard} title="Contact & Personal">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem icon={Mail} label="Official Email" value={profile.officialEmail} />
              <InfoItem icon={Phone} label="Phone" value={profile.phone || person.contact?.phone} />
              <InfoItem icon={Calendar} label="Date of Birth" value={formatDate(person.dob)} />
              <InfoItem icon={Users} label="Gender" value={person.gender} />
              <InfoItem icon={HeartPulse} label="Blood Group" value={profile.bloodGroup} />
              <InfoItem icon={Users} label="Marital Status" value={profile.maritalStatus} />
              <InfoItem icon={IdCard} label="National ID" value={person.nationalId} />
              <InfoItem
                icon={MapPin}
                label="Current Address"
                value={
                  profile.currentAddress?.address
                    ? `${profile.currentAddress.address}, ${profile.currentAddress.city || ""}`
                    : person.contact?.address
                }
              />
            </div>

            {emergencyContacts.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Emergency Contacts</p>
                <div className="space-y-2">
                  {emergencyContacts.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                      <span className="font-semibold text-slate-700">{c.name} {c.relation ? `(${c.relation})` : ""}</span>
                      <span className="text-slate-500 font-medium">{c.phone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard icon={Briefcase} title="Employment & Contract">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem icon={Calendar} label="Joining Date" value={formatDate(profile.joiningDate)} />
              <InfoItem icon={Briefcase} label="Employment Type" value={profile.employmentType} />
              <InfoItem icon={Clock4} label="Shift" value={profile.shift} />
              <InfoItem icon={Calendar} label="Working Days" value={(profile.workingDays || []).join(", ") || undefined} />
              {profile.contractStartDate && (
                <InfoItem icon={Calendar} label="Contract Start" value={formatDate(profile.contractStartDate)} />
              )}
              {profile.contractEndDate && (
                <InfoItem icon={Calendar} label="Contract End" value={formatDate(profile.contractEndDate)} />
              )}
              {profile.tenureTrack?.isTenureTrack && (
                <InfoItem icon={Award} label="Tenure Status" value={profile.tenureTrack.tenureStatus} />
              )}
              {profile.probation?.status && profile.probation.status !== "not_applicable" && (
                <InfoItem icon={Clock4} label="Probation" value={profile.probation.status} />
              )}
            </div>

            {(profile.roleAssignments || []).length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Role Assignments</p>
                <div className="space-y-2">
                  {profile.roleAssignments.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                      <span className="font-semibold text-slate-700">{r.title}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${r.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard icon={GraduationCap} title="Academic & Professional Credentials">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <InfoItem icon={BookMarked} label="Specialization" value={profile.specialization} />
            <InfoItem icon={Briefcase} label="Industry Experience" value={profile.industryExperienceYears ? `${profile.industryExperienceYears} yrs` : undefined} />
            <InfoItem icon={FlaskConical} label="Publications" value={profile.researchProfile?.publicationsCount || undefined} />
          </div>

          {(profile.teachingSpecializations || []).length > 0 && (
            <div className="mb-5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Teaching Specializations</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.teachingSpecializations.map((s, idx) => (
                  <span key={idx} className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">{s}</span>
                ))}
              </div>
            </div>
          )}

          {(profile.qualifications || []).length > 0 ? (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">Qualifications</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profile.qualifications.map((q, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-800">{q.degree}</p>
                      {q.isVerified && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
                          <CheckCircle2 size={11} /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {q.institution} {q.yearCompleted ? `· ${q.yearCompleted}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No qualifications on record.</p>
          )}
        </SectionCard>

        {documents.length > 0 && (
          <SectionCard icon={FileText} title={`Documents (${documents.length})`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div key={doc._id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500 flex-shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{doc.docType}</p>
                    <p className="text-xs text-slate-400 font-medium">
                      {doc.category}
                      {doc.verified && <span className="text-emerald-600 font-bold"> · Verified</span>}
                    </p>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
                    title="View / download"
                  >
                    <Download size={16} />
                  </a>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
};

export default TeacherProfileView;
