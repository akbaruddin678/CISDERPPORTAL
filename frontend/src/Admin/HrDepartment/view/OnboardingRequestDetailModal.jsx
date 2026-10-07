import React from "react";
import {
  X,
  User,
  Phone,
  Home,
  Users,
  GraduationCap,
  Briefcase,
  FileText,
  ShieldCheck,
  Edit3,
  XCircle,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

const formatDate = (date, opts) =>
  date ? new Date(date).toLocaleDateString(undefined, opts || { day: "2-digit", month: "short", year: "numeric" }) : "—";

const Field = ({ label, value }) => (
  <div>
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
    <p className="text-sm font-semibold text-slate-800 mt-0.5 break-words">{value || value === 0 ? value : "—"}</p>
  </div>
);

const Section = ({ icon: Icon, title, children, accent = "text-indigo-600 bg-indigo-50" }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5">
    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon size={16} />
      </div>
      <h3 className="text-sm font-black text-slate-800">{title}</h3>
    </div>
    {children}
  </div>
);

const STATUS_STYLES = {
  Applied: "bg-amber-100 text-amber-700",
  Hired: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-rose-100 text-rose-700",
};

const OnboardingRequestDetailModal = ({ request, onClose, onApprove, onReject }) => {
  if (!request) return null;
  const r = request;
  const fullName = [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ") || r.applicantName;
  const isPending = r.status === "Applied";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
      <div className="bg-slate-50 w-full sm:max-w-4xl sm:rounded-2xl min-h-screen sm:min-h-0 sm:max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 sm:rounded-t-2xl px-5 sm:px-7 py-5 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            {r.profilePhotoUrl ? (
              <img
                src={r.profilePhotoUrl}
                alt={fullName}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/20 flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center font-black text-lg flex-shrink-0">
                {fullName?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white truncate">{fullName}</h2>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[r.status] || "bg-white/10 text-white"}`}>
                  {r.status}
                </span>
              </div>
              <p className="text-sm text-white/60 font-medium truncate">
                {r.designation || r.role} {r.departmentId?.name ? `· ${r.departmentId.name}` : ""}
              </p>
              <p className="text-xs text-white/40 font-medium mt-0.5">Submitted {formatDate(r.createdAt, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-7 py-5 space-y-4">
          {r.status === "Rejected" && r.rejectionReason && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <p className="text-xs font-black text-rose-700 uppercase tracking-wide mb-1">Rejection Reason</p>
              <p className="text-sm text-rose-800 font-medium">{r.rejectionReason}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Section icon={User} title="Identity">
              <div className="grid grid-cols-2 gap-3">
                <Field label="CNIC" value={r.nationalId} />
                <Field label="Passport No." value={r.passportNumber} />
                <Field label="Date of Birth" value={formatDate(r.dob)} />
                <Field label="Gender" value={r.gender} />
                <Field label="Blood Group" value={r.bloodGroup} />
                <Field label="Marital Status" value={r.maritalStatus} />
              </div>
              {r.disabilityStatus?.hasDisability && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <Field label="Disability Details" value={r.disabilityStatus.details} />
                </div>
              )}
            </Section>

            <Section icon={Phone} title="Contact" accent="text-blue-600 bg-blue-50">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" value={r.email} />
                <Field label="Phone" value={r.phone} />
              </div>
            </Section>

            <Section icon={Home} title="Addresses" accent="text-cyan-600 bg-cyan-50">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Current</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {[r.currentAddress?.address, r.currentAddress?.city, r.currentAddress?.province, r.currentAddress?.country].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Permanent</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {[r.permanentAddress?.address, r.permanentAddress?.city, r.permanentAddress?.province, r.permanentAddress?.country].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
              </div>
            </Section>

            <Section icon={Users} title="Family & Emergency" accent="text-pink-600 bg-pink-50">
              {(r.dependents || []).length === 0 && (r.emergencyContacts || []).length === 0 ? (
                <p className="text-sm text-slate-400 italic">No family or emergency contacts provided.</p>
              ) : (
                <div className="space-y-3">
                  {(r.dependents || []).length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Dependents</p>
                      <div className="space-y-1.5">
                        {r.dependents.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                            <span className="font-semibold text-slate-700">{d.name} <span className="text-slate-400 font-medium">({d.relation})</span></span>
                            {d.isBeneficiary && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Beneficiary</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(r.emergencyContacts || []).length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Emergency Contacts</p>
                      <div className="space-y-1.5">
                        {r.emergencyContacts.map((c, i) => (
                          <div key={i} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                            <span className="font-semibold text-slate-700">{c.name} <span className="text-slate-400 font-medium">({c.relation})</span></span>
                            <span className="text-slate-500">{c.phone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Section>

            <Section icon={GraduationCap} title="Education & Experience" accent="text-purple-600 bg-purple-50">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="Highest Degree" value={r.highestDegree} />
                <Field label="Teaching Experience" value={r.experienceYears ? `${r.experienceYears} yrs` : "0 yrs"} />
                <Field label="Industry Experience" value={r.industryExperienceYears ? `${r.industryExperienceYears} yrs` : "0 yrs"} />
              </div>
              {(r.teachingSpecializations || []).length > 0 && (
                <div className="mb-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Specializations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.teachingSpecializations.map((s, i) => (
                      <span key={i} className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-1 rounded-md">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {(r.qualifications || []).length > 0 && (
                <div className="mb-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Qualifications</p>
                  <div className="space-y-1.5">
                    {r.qualifications.map((q, i) => (
                      <div key={i} className="text-sm bg-slate-50 rounded-lg px-3 py-2">
                        <span className="font-bold text-slate-800">{q.degree}</span>
                        <span className="text-slate-500"> · {q.institution} {q.yearCompleted ? `(${q.yearCompleted})` : ""}</span>
                        {q.specialization && <span className="text-slate-400"> · {q.specialization}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(r.researchProfile?.orcidId || r.researchProfile?.googleScholarUrl || r.researchProfile?.publicationsCount > 0) && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <Field label="ORCID" value={r.researchProfile?.orcidId} />
                  <Field label="Publications" value={r.researchProfile?.publicationsCount} />
                  {r.researchProfile?.googleScholarUrl && (
                    <a href={r.researchProfile.googleScholarUrl} target="_blank" rel="noreferrer" className="col-span-2 text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                      Google Scholar Profile <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}
            </Section>

            <Section icon={Briefcase} title="Employment Details" accent="text-emerald-600 bg-emerald-50">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Applying For" value={r.designation || r.role} />
                <Field label="Department" value={r.departmentId?.name} />
                <Field label="Employment Type" value={r.employmentType} />
                <Field label="Shift" value={r.shift} />
                <Field label="Contract Start" value={formatDate(r.contractStartDate)} />
                <Field label="Contract End" value={formatDate(r.contractEndDate)} />
                <Field label="Biometric ID" value={r.biometricId} />
              </div>
              {(r.workingDays || []).length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Working Days</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.workingDays.map((d, i) => (
                      <span key={i} className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {r.probation?.startDate && (
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
                  <Field label="Probation Start" value={formatDate(r.probation.startDate)} />
                  <Field label="Probation End" value={formatDate(r.probation.endDate)} />
                </div>
              )}
            </Section>
          </div>

          <Section icon={FileText} title={`Documents (${(r.documents || []).length})`} accent="text-orange-600 bg-orange-50">
            {(r.documents || []).length === 0 ? (
              <p className="text-sm text-slate-400 italic">No documents were attached.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {r.documents.map((d, i) => (
                  <a
                    key={i}
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all"
                  >
                    <div className="p-2 rounded-lg bg-orange-50 text-orange-600 flex-shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{d.docType || "Document"}</p>
                      <p className="text-xs text-slate-400 font-medium capitalize">{d.category || "general"}</p>
                    </div>
                    <ExternalLink size={14} className="text-slate-400 flex-shrink-0" />
                  </a>
                ))}
                {r.profilePhotoUrl && (
                  <a
                    href={r.profilePhotoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all"
                  >
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 flex-shrink-0">
                      <ImageIcon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">Profile Photo</p>
                      <p className="text-xs text-slate-400 font-medium">image</p>
                    </div>
                    <ExternalLink size={14} className="text-slate-400 flex-shrink-0" />
                  </a>
                )}
              </div>
            )}
          </Section>
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 px-4 sm:px-7 py-4 border-t border-slate-200 bg-white sm:rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
            Close
          </button>
          {isPending && (
            <>
              <button
                onClick={() => onReject(r)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 text-rose-700 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors"
              >
                <XCircle size={15} /> Reject
              </button>
              <button
                onClick={() => onApprove(r)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Edit3 size={15} /> Edit &amp; Approve
              </button>
            </>
          )}
          {r.status === "Hired" && (
            <span className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-emerald-700">
              <ShieldCheck size={15} /> Already onboarded
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingRequestDetailModal;
