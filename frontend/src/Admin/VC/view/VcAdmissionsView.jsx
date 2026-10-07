import React from "react";
import {
  ClipboardList,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  MapPin,
  Users,
  GraduationCap,
  Paperclip,
  ExternalLink,
  FileClock,
  Send,
  ClipboardCheck,
  BadgeCheck,
  FileX2,
  SlidersHorizontal,
  Eye,
  RotateCcw,
} from "lucide-react";
import { EmptyState, ErrorBox } from "../../Graduation/common/graduationUi";
import { fmtDate } from "../../Graduation/common/graduationHelpers";
import { STATUS_TABS } from "../controller/useVcAdmissionsController";

const STATUS_META = {
  draft: { label: "Draft", badge: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400" },
  submitted: { label: "Submitted", badge: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  under_review: { label: "Under review", badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  accepted: { label: "Accepted", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", badge: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${meta.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

const Avatar = ({ name, photo }) => {
  if (photo) return <img src={photo} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />;
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
      {initials(name) || "?"}
    </div>
  );
};

const AdmissionStatCard = ({ label, value, icon, tone, active, onClick }) => {
  const Icon = icon;
  const tones = {
    indigo: "bg-blue-50 text-blue-700 ring-blue-100",
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    sky: "bg-blue-50 text-blue-700 ring-blue-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[84px] items-center gap-3 rounded-xl border bg-white p-3.5 text-left transition-colors ${
        active ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-100" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
      }`}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${tones[tone]}`}><Icon size={18} /></span>
      <span className="min-w-0">
        <span className="block text-2xl font-bold tabular-nums tracking-tight text-slate-900">{Number(value || 0).toLocaleString()}</span>
        <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-500">{label}</span>
      </span>
    </button>
  );
};

const Field = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="text-sm font-semibold text-slate-800 mt-0.5">{value || "—"}</p>
  </div>
);

const DetailSection = ({ title, icon, children }) => {
  const Icon = icon;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        <Icon size={14} /> {title}
      </h4>
      {children}
    </div>
  );
};

const DOC_LABELS = {
  profilePhoto: "Profile Photo",
  cnicDoc_front: "CNIC (Front)",
  cnicDoc_back: "CNIC (Back)",
  domicileDoc: "Domicile",
  matricCertificate: "Matric Certificate",
  fscCertificate: "FSc Certificate",
};

const DetailDrawer = ({ c }) => {
  const d = c.detail;
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={c.closeApplication} />
      <aside className="relative h-full w-full max-w-2xl overflow-y-auto bg-slate-50 shadow-2xl" aria-label="Application details">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
          {d ? (
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={d.student.name} photo={d.documents?.profilePhoto} />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-900">{d.student.name}</p>
                <p className="text-[11px] font-mono font-semibold text-slate-400 truncate">
                  {d.student.registrationNumber !== "N/A" ? d.student.registrationNumber : d.student.email}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm font-bold text-slate-400">Loading…</p>
          )}
          <div className="flex items-center gap-3 shrink-0">
            {d && <StatusBadge status={d.application.status} />}
            <button onClick={c.closeApplication} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Close application details">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          {c.detailErrorMessage && <ErrorBox message={c.detailErrorMessage} />}
          {c.isLoadingDetail && !d ? (
            <div className="flex justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin" />
            </div>
          ) : d ? (
            <>
              <DetailSection title="Application" icon={ClipboardList}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Status" value={<StatusBadge status={d.application.status} />} />
                  <Field label="Applied" value={fmtDate(d.application.appliedDate)} />
                  <Field label="Wizard Step" value={d.application.step} />
                  <Field label="Declaration Agreed" value={d.application.agreeDeclaration ? "Yes" : "No"} />
                </div>
              </DetailSection>

              <DetailSection title="Student" icon={Phone}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Full Name" value={d.student.name} />
                  <Field label="Father's Name" value={d.student.fatherName} />
                  <Field label="CNIC" value={d.student.cnic} />
                  <Field label="Gender" value={d.student.gender} />
                  <Field label="Date of Birth" value={fmtDate(d.student.dob)} />
                  <Field label="Registration No." value={d.student.registrationNumber} />
                  <Field label="Phone" value={d.student.phone} />
                  <Field label="Email" value={d.student.email} />
                </div>
              </DetailSection>

              <DetailSection title="Academic Program Applied For" icon={GraduationCap}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Class" value={d.academic.department?.name} />
                  <Field label="Program" value={d.academic.program?.name} />
                  <Field label="Session" value={d.academic.session?.name} />
                </div>
              </DetailSection>

              <DetailSection title="Address" icon={MapPin}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600">Current</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {[d.address?.current?.address, d.address?.current?.district, d.address?.current?.province, d.address?.current?.country]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600">Permanent</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {[d.address?.permanent?.address, d.address?.permanent?.district, d.address?.permanent?.province, d.address?.permanent?.country]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </p>
                  </div>
                </div>
              </DetailSection>

              <DetailSection title="Family" icon={Users}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Father's Name" value={d.family?.fatherName} />
                  <Field label="Father's CNIC" value={d.family?.fatherCnic} />
                  <Field label="Mother's Name" value={d.family?.motherName} />
                  <Field label="Guardian Status" value={d.family?.guardianStatus} />
                  <Field label="Guardian Phone" value={d.family?.guardianPhone} />
                  <Field label="Father's Profession" value={d.family?.fathersProfession} />
                  <Field label="Income Bracket" value={d.family?.incomeBracket} />
                </div>
              </DetailSection>

              {d.education?.length > 0 && (
                <DetailSection title="Education History" icon={GraduationCap}>
                  <div className="space-y-2">
                    {d.education.map((e, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 p-3 text-xs">
                        <p className="font-bold text-slate-800">
                          {e.educationProgram} — {e.institution}
                        </p>
                        <p className="text-slate-500 mt-0.5">
                          {e.board ? `${e.board} · ` : ""}
                          {e.percentage != null ? `${e.percentage}%` : e.obtainedMarks != null ? `${e.obtainedMarks}/${e.totalMarks}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              <DetailSection title="Documents" icon={Paperclip}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {Object.entries(DOC_LABELS).map(([key, label]) => {
                    const url = d.documents?.[key];
                    return (
                      <div key={key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold">
                        <span className="text-slate-600">{label}</span>
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800">
                            View <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </DetailSection>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
};

const VcAdmissionsView = (c) => {
  const statCards = [
    { key: "", label: "All applications", value: c.stats.total, icon: ClipboardList, tone: "indigo" },
    { key: "draft", label: "Draft", value: c.stats.draft, icon: FileClock, tone: "slate" },
    { key: "submitted", label: "Submitted", value: c.stats.submitted, icon: Send, tone: "sky" },
    { key: "under_review", label: "Under review", value: c.stats.underReview, icon: ClipboardCheck, tone: "amber" },
    { key: "accepted", label: "Accepted", value: c.stats.accepted, icon: BadgeCheck, tone: "emerald" },
    { key: "rejected", label: "Rejected", value: c.stats.rejected, icon: FileX2, tone: "rose" },
  ];
  const hasFilters = Boolean(c.search || c.status);
  const firstResult = c.pagination.total ? (c.page - 1) * c.pageSize + 1 : 0;
  const lastResult = Math.min(c.page * c.pageSize, c.pagination.total);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6">
        <section aria-label="Admission status summary" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {statCards.map((item) => (
            <AdmissionStatCard
              key={item.key || "all"}
              {...item}
              active={c.status === item.key}
              onClick={() => c.setStatus(item.key)}
            />
          ))}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4" aria-label="Application filters">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 lg:mr-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><SlidersHorizontal size={16} /></span>
              Find applications
            </div>
            <div className="relative min-w-0 flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={c.search}
                onChange={(e) => c.setSearch(e.target.value)}
                placeholder="Search applicant, father’s name, CNIC or registration number"
                aria-label="Search applications"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select
              value={c.status}
              onChange={(e) => c.setStatus(e.target.value)}
              aria-label="Filter by application status"
              className="min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {STATUS_TABS.map((item) => <option key={item.key || "all"} value={item.key}>{item.label === "All" ? "All statuses" : item.label}</option>)}
            </select>
            {hasFilters && (
              <button type="button" onClick={() => { c.setSearch(""); c.setStatus(""); }} className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                <RotateCcw size={14} /> Clear
              </button>
            )}
          </div>
        </section>

        {c.errorMessage && <ErrorBox message={c.errorMessage} />}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-labelledby="application-list-heading">
          <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 id="application-list-heading" className="text-sm font-semibold text-slate-900">
                {STATUS_META[c.status]?.label || "All applications"}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {c.isFetching && !c.isLoading ? "Updating results…" : `${c.pagination.total.toLocaleString()} matching record${c.pagination.total === 1 ? "" : "s"}`}
              </p>
            </div>
            {hasFilters && <p className="text-xs font-semibold text-blue-600">Filtered view</p>}
          </div>

          {c.isLoading ? (
            <div className="space-y-3 p-5" role="status" aria-label="Loading applications">
              {[1, 2, 3, 4, 5, 6].map((row) => <div key={row} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : c.applications.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No applications found" hint={hasFilters ? "Clear the filters or try a different search." : "Applications will appear here when candidates begin applying."} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.1em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Applicant</th>
                    <th className="px-4 py-3 text-left font-semibold">Academic choice</th>
                    <th className="px-4 py-3 text-left font-semibold">Contact</th>
                    <th className="px-4 py-3 text-left font-semibold">Applied</th>
                    <th className="px-4 py-3 text-left font-semibold">Progress</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {c.applications.map((a) => (
                    <tr key={a.id} className="group transition-colors hover:bg-blue-50/40">
                      <td className="px-5 py-3.5">
                        <button type="button" onClick={() => c.openApplication(a.id)} className="flex max-w-[250px] items-center gap-3 text-left">
                          <Avatar name={a.name} photo={a.avatar} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-900 group-hover:text-blue-700">{a.name}</span>
                            <span className="mt-0.5 block truncate font-mono text-[10px] font-semibold text-slate-400">{a.registrationNumber !== "N/A" ? a.registrationNumber : a.cnic || "No identifier"}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="max-w-[210px] truncate text-xs font-semibold text-slate-700">{a.program !== "N/A" ? a.program : "Program not selected"}</p>
                        <p className="mt-0.5 max-w-[210px] truncate text-[11px] font-medium text-slate-400">{a.department !== "N/A" ? a.department : "Department not selected"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="max-w-[210px] truncate text-xs font-semibold text-slate-600">{a.email !== "N/A" ? a.email : a.phone || "Not provided"}</p>
                        {a.email !== "N/A" && a.phone && <p className="mt-0.5 text-[11px] font-medium text-slate-400">{a.phone}</p>}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-slate-500">{fmtDate(a.appliedDate)}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex min-w-[62px] justify-center rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">Step {a.currentStep || 1}</span>
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={a.status} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <button type="button" onClick={() => c.openApplication(a.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700" aria-label={`View ${a.name}'s application`}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {c.pagination.total > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <span>Showing {firstResult.toLocaleString()}–{lastResult.toLocaleString()} of {c.pagination.total.toLocaleString()}</span>
              <div className="flex items-center gap-2">
                <span className="mr-1">Page {c.pagination.currentPage} of {c.pagination.totalPages}</span>
                <button disabled={c.page <= 1} onClick={() => c.setPage(c.page - 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={15} /></button>
                <button disabled={c.page >= c.pagination.totalPages} onClick={() => c.setPage(c.page + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page"><ChevronRight size={15} /></button>
              </div>
            </div>
          )}
        </section>
      </div>

      {c.selectedId && <DetailDrawer c={c} />}
    </div>
  );
};

export default VcAdmissionsView;
