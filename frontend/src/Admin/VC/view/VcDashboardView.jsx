import React from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  GraduationCap,
  Briefcase,
  Building2,
  BookOpen,
  FileClock,
  FileCheck2,
  FileX2,
  Receipt,
  BadgeCheck,
  AlertTriangle,
  Wallet,
  TrendingUp,
  PiggyBank,
  ClipboardCheck,
  Megaphone,
  RefreshCw,
  Loader2,
  ArrowRight,
  CircleDollarSign,
  Inbox,
} from "lucide-react";
import { SectionCard, EmptyState, ErrorBox } from "../../Graduation/common/graduationUi";
import { fmtRs } from "../../Graduation/common/graduationHelpers";

const PIE_COLORS = ["#10b981", "#f59e0b", "#f43f5e"];
const BAR_COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e", "#8b5cf6"];

const KpiTile = ({ label, value, icon, tone = "indigo", loading }) => {
  const Icon = icon;
  const toneMap = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneMap[tone]}`}>
        <Icon size={19} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{label}</p>
        {loading ? (
          <div className="h-6 w-16 bg-slate-100 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-xl font-bold leading-tight text-slate-900">{value}</p>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    draft: "bg-slate-100 text-slate-500 ring-slate-200",
    submitted: "bg-sky-50 text-sky-700 ring-sky-200",
    under_review: "bg-amber-50 text-amber-700 ring-amber-200",
    accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ring-1 ${
        map[status] || map.draft
      }`}
    >
      {(status || "draft").replaceAll("_", " ")}
    </span>
  );
};

const AdmissionSummaryCard = ({ label, value, detail, icon, tone = "indigo", loading }) => {
  const Icon = icon;
  const toneMap = {
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };

  return (
    <div className="min-h-[116px] rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-950">{value.toLocaleString()}</p>
          )}
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ${toneMap[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-2 text-xs font-medium leading-5 text-slate-500">{detail}</p>
    </div>
  );
};

const AdmissionStage = ({ item, total, loading }) => {
  const Icon = item.icon;
  const toneMap = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    sky: "bg-sky-500",
    slate: "bg-slate-500",
  };
  const width = total > 0 ? Math.max((item.value / total) * 100, item.value > 0 ? 4 : 0) : 0;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
          <Icon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-xs font-bold text-slate-700">{item.label}</p>
            {loading ? (
              <span className="h-4 w-8 animate-pulse rounded bg-slate-200" />
            ) : (
              <span className="text-sm font-black tabular-nums text-slate-950">{item.value.toLocaleString()}</span>
            )}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80" aria-hidden="true">
            <div className={`h-full rounded-full ${toneMap[item.tone]}`} style={{ width: `${width}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ApplicantAvatar = ({ name = "" }) => {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "A";
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-xs font-black text-indigo-700 ring-1 ring-indigo-100">
      {initials}
    </span>
  );
};

const VcDashboardView = (c) => {
  const {
    isLoading,
    isFetching,
    errorMessage,
    refetch,
    university,
    studentsByDepartment,
    admissions,
    recentAdmissions,
    pendingActions,
    feeKpis,
    feeDepartmentData,
    feeMonthlyTrend,
  } = c;

  const admissionFunnel = [
    { label: "Draft", value: admissions.draft, icon: FileClock, tone: "slate" },
    { label: "Submitted", value: admissions.submitted, icon: FileCheck2, tone: "sky" },
    { label: "Under Review", value: admissions.underReview, icon: ClipboardCheck, tone: "amber" },
    { label: "Rejected", value: admissions.rejected, icon: FileX2, tone: "rose" },
    { label: "Accepted (No Challan Yet)", value: admissions.acceptedAwaitingChallan, icon: BadgeCheck, tone: "indigo" },
    { label: "Challan Generated", value: admissions.challanGenerated, icon: Receipt, tone: "sky" },
    { label: "Fee Paid", value: admissions.feePaid, icon: Wallet, tone: "emerald" },
    { label: "Fee Overdue", value: admissions.feeOverdue, icon: AlertTriangle, tone: "rose" },
  ];
  const applicationReviewStages = admissionFunnel.slice(0, 4);
  const enrollmentStages = admissionFunnel.slice(4);
  const applicationReviewTotal = applicationReviewStages.reduce((sum, item) => sum + item.value, 0);
  const enrollmentTotal = enrollmentStages.reduce((sum, item) => sum + item.value, 0);
  const totalAdmissionRecords = applicationReviewTotal + enrollmentTotal;
  const awaitingReview = admissions.submitted + admissions.underReview;
  const needsPaymentAttention = admissions.acceptedAwaitingChallan + admissions.feeOverdue;

  const statusPieData = [
    { name: "Collected", value: feeKpis.totalCollected },
    { name: "Pending", value: feeKpis.totalPending },
    { name: "Overdue", value: feeKpis.totalOverdue },
  ].filter((d) => d.value > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Institutional overview</p>
            <p className="mt-0.5 text-xs text-slate-500">Admissions, student records, approvals, and financial performance.</p>
          </div>
          <button onClick={refetch} disabled={isFetching} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-60">
            {isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh data
          </button>
        </div>
        {errorMessage && <ErrorBox message={errorMessage} />}

        {/* University headcounts */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiTile label="Active Students" value={university.totalActiveStudents.toLocaleString()} icon={Users} tone="indigo" loading={isLoading} />
          <KpiTile label="Graduated" value={university.totalGraduatedStudents.toLocaleString()} icon={GraduationCap} tone="emerald" loading={isLoading} />
          <KpiTile label="Staff" value={university.totalStaff.toLocaleString()} icon={Briefcase} tone="sky" loading={isLoading} />
          <KpiTile label="Departments" value={university.totalDepartments.toLocaleString()} icon={Building2} tone="slate" loading={isLoading} />
          <KpiTile label="Active Programs" value={university.totalPrograms.toLocaleString()} icon={BookOpen} tone="amber" loading={isLoading} />
        </div>

        {/* Pending actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/vc/approve-marks"
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-blue-300 hover:bg-blue-50/30"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <GraduationCap size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Marks Awaiting Your Approval</p>
                <p className="text-xs font-medium text-slate-500">Final sign-off declares the result official.</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-blue-700">{pendingActions.marksAwaitingVcApproval}</span>
          </Link>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BadgeCheck size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Graduation Clearances In Progress</p>
                <p className="text-xs font-medium text-slate-500">Moving through HOD, Exam, Offices, Accounts and Registrar.</p>
              </div>
            </div>
            <span className="text-2xl font-bold text-slate-800">{pendingActions.graduationClearancesInProgress}</span>
          </div>
        </div>

        {/* Admissions */}
        <SectionCard title="Admissions Overview" icon={FileCheck2}>
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-white">
                <Megaphone size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Current admission cycle</p>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {admissions.activeCampaign?.title || "No active campaign"}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">
                  {admissions.activeCampaign
                    ? "Live application and enrolment activity across the university."
                    : "Admission statistics below include all available records."}
                </p>
              </div>
            </div>
            <Link to="/vc/admissions" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50">
              View all applications <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdmissionSummaryCard label="Total pipeline" value={totalAdmissionRecords} detail="All application and enrolment stages" icon={GraduationCap} tone="indigo" loading={isLoading} />
            <AdmissionSummaryCard label="Awaiting review" value={awaitingReview} detail="Submitted and under-review applications" icon={Inbox} tone="sky" loading={isLoading} />
            <AdmissionSummaryCard label="Payment attention" value={needsPaymentAttention} detail="Awaiting challan or currently overdue" icon={CircleDollarSign} tone="amber" loading={isLoading} />
            <AdmissionSummaryCard label="Fee paid" value={admissions.feePaid} detail="Applicants who completed admission payment" icon={BadgeCheck} tone="emerald" loading={isLoading} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Application review</h3>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">Applications before an admission offer</p>
                </div>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black tabular-nums text-slate-700">{applicationReviewTotal.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                {applicationReviewStages.map((item) => <AdmissionStage key={item.label} item={item} total={applicationReviewTotal} loading={isLoading} />)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Offer to enrolment</h3>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">Payment progress after acceptance</p>
                </div>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black tabular-nums text-slate-700">{enrollmentTotal.toLocaleString()}</span>
              </div>
              <div className="space-y-2">
                {enrollmentStages.map((item) => <AdmissionStage key={item.label} item={item} total={enrollmentTotal} loading={isLoading} />)}
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Recent applications</h3>
                <p className="text-xs font-medium text-slate-500">Latest six records received by Admissions</p>
              </div>
              <Link to="/vc/admissions" className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-800">
                Open register <ArrowRight size={13} />
              </Link>
            </div>
            {recentAdmissions.length === 0 && !isLoading ? (
              <EmptyState icon={FileCheck2} title="No applications yet" hint="New admission applications will appear here." />
            ) : isLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4].map((row) => <div key={row} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-extrabold">Applicant</th>
                      <th className="hidden px-4 py-3 text-left font-extrabold md:table-cell">Department / Program</th>
                      <th className="hidden px-4 py-3 text-left font-extrabold sm:table-cell">Applied</th>
                      <th className="px-4 py-3 text-left font-extrabold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentAdmissions.map((a) => (
                      <tr key={a._id} className="transition-colors hover:bg-indigo-50/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ApplicantAvatar name={a.fullName} />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900">{a.fullName}</p>
                              <p className="truncate font-mono text-[11px] font-medium text-slate-400">{a.cnic || "CNIC not provided"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <p className="text-xs font-bold text-slate-700">{a.departmentName || "Department not assigned"}</p>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-400">{a.programName || "Program not assigned"}</p>
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-500 sm:table-cell">{a.appliedAtLabel}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Fee collection */}
        <SectionCard title="Fee Collection (All-Time, University-Wide)" icon={Wallet}>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
            <KpiTile label="Expected" value={fmtRs(feeKpis.totalExpected)} icon={PiggyBank} tone="slate" loading={isLoading} />
            <KpiTile label="Collected" value={fmtRs(feeKpis.totalCollected)} icon={Wallet} tone="emerald" loading={isLoading} />
            <KpiTile label="Pending" value={fmtRs(feeKpis.totalPending)} icon={FileClock} tone="amber" loading={isLoading} />
            <KpiTile label="Overdue" value={fmtRs(feeKpis.totalOverdue)} icon={AlertTriangle} tone="rose" loading={isLoading} />
            <KpiTile label="Collection Rate" value={`${feeKpis.collectionRate}%`} icon={TrendingUp} tone="indigo" loading={isLoading} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">Collected vs Pending by Department</p>
              {feeDepartmentData.length === 0 ? (
                <EmptyState icon={Building2} title="No department data yet" hint="Fee collection will appear here once challans are billed." />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={feeDepartmentData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="department"
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <RechartsTooltip formatter={(v) => fmtRs(v)} />
                    <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">Overall Status</p>
              {statusPieData.length === 0 ? (
                <EmptyState icon={Wallet} title="No fee data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                      {statusPieData.map((entry, i) => (
                        <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v) => fmtRs(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex flex-col gap-1.5 mt-2">
                {statusPieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {d.name}: {fmtRs(d.value)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {feeMonthlyTrend.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold text-slate-500 mb-2">Monthly Collection Trend</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={feeMonthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <RechartsTooltip formatter={(v) => fmtRs(v)} />
                  <Bar dataKey="amount" name="Collected" radius={[6, 6, 0, 0]}>
                    {feeMonthlyTrend.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        {/* Students by department */}
        <SectionCard title="Active Students by Department" icon={Building2}>
          {studentsByDepartment.length === 0 ? (
            <EmptyState icon={Users} title="No student data yet" />
          ) : (
            <div className="space-y-2.5">
              {studentsByDepartment.map((d) => {
                const max = Math.max(...studentsByDepartment.map((x) => x.count), 1);
                return (
                  <div key={d.departmentName} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-xs font-bold text-slate-600 truncate">{d.departmentName}</span>
                    <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${(d.count / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-black text-slate-800">{d.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default VcDashboardView;
