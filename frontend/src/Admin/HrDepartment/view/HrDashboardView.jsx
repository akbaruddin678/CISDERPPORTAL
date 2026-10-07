import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis,
} from "recharts";
import {
  AlertCircle, ArrowRight, Briefcase, CalendarClock, CalendarDays,
  CheckCircle2, FileWarning, RefreshCw, Search, UserPlus, Users,
} from "lucide-react";
import { HrLink } from "../services/HrLink";
import "../common/hrWorkspace.css";

const COLORS = ["#2563eb", "#0f766e", "#d97706", "#7c3aed", "#475569", "#be123c"];

const WORKFLOWS = [
  { key: "people", title: "People & onboarding", description: "Maintain staff records and move new hires into active service.", paths: ["/hr/employees", "/hr/onboard", "/hr/onboarding-requests", "/communications/notifications"] },
  { key: "roles", title: "Role-based staff management", description: "Manage one role group at a time — Teacher, HOD, VC, Head of Academia, or everyone else.", paths: ["/hr/employees/role/teacher", "/hr/employees/role/hod", "/hr/employees/role/vc", "/hr/employees/role/head_of_academia", "/hr/employees/role/other"] },
  { key: "time", title: "Time, leave & payroll", description: "Manage attendance, absence decisions, and monthly compensation.", paths: ["/hr/attendance", "/attendance-kiosk", "/hr/leaves", "/hr/payroll"] },
  { key: "talent", title: "Talent lifecycle", description: "Recruit, develop, and complete employee exits with clear records.", paths: ["/hr/recruitment", "/hr/appraisals", "/hr/exits", "/hr/alumni"] },
  { key: "assets", title: "Workplace assets", description: "Track university rooms, equipment, supplies, and staff assignments.", paths: ["/hr/inventory"] },
];

const StatCard = ({ icon, label, value, note, tone = "blue", loading }) => {
  const tones = {
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    teal: "border-teal-100 bg-teal-50 text-teal-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
  };
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
          {loading ? <div className="mt-3 h-8 w-16 animate-pulse rounded-md bg-slate-100" /> : <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>}
          <p className="mt-1 text-xs text-slate-500">{note}</p>
        </div>
        <span className={`inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg border ${tones[tone]}`}>{React.createElement(icon, { size: 19, strokeWidth: 2.1, "aria-hidden": true })}</span>
      </div>
    </article>
  );
};

const ChartCard = ({ title, description, empty, children }) => (
  <article className="flex min-h-80 flex-col rounded-xl border border-slate-200 bg-white p-5">
    <div><h3 className="text-sm font-extrabold text-slate-900">{title}</h3><p className="mt-1 text-xs text-slate-500">{description}</p></div>
    {empty ? <div className="flex flex-1 flex-col items-center justify-center text-center"><Users size={24} className="text-slate-300" /><p className="mt-2 text-sm font-bold text-slate-600">No workforce data available</p></div> : <div className="mt-4 min-h-0 flex-1">{children}</div>}
  </article>
);

const HrDashboardView = ({ stats, departmentBreakdown, employmentTypeBreakdown, actionItems, isLoading, isError, refetch }) => {
  const links = useMemo(() => HrLink(), []);
  const [moduleSearch, setModuleSearch] = useState("");
  const query = moduleSearch.trim().toLowerCase();

  const workflowGroups = useMemo(
    () => WORKFLOWS.map((workflow) => ({
      ...workflow,
      modules: workflow.paths.map((path) => links.find((link) => link.path === path)).filter(Boolean)
        .filter((link) => !query || `${link.title} ${link.description}`.toLowerCase().includes(query)),
    })).filter((workflow) => workflow.modules.length > 0),
    [links, query],
  );

  return (
    <main className="hr-workspace min-h-screen bg-[#f6f8fb] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1440px] space-y-6">
        <header className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-700">People operations</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl" style={{ fontFamily: "'Aleo', serif" }}>Human resources</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Support the university workforce from recruitment and onboarding through attendance, development, payroll, and exit.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={refetch} disabled={isLoading} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh</button>
            <Link to="/hr/onboard" className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800"><UserPlus size={16} /> Onboard employee</Link>
          </div>
        </header>

        {isError && <section role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><AlertCircle size={20} className="mt-0.5 flex-none text-rose-700" /><div><p className="text-sm font-extrabold text-rose-900">Workforce summary could not be loaded</p><p className="mt-0.5 text-xs text-rose-700">HR modules remain available. Retry to refresh the dashboard.</p></div></div><button type="button" onClick={refetch} className="self-start rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold text-white">Retry</button></section>}

        <section aria-labelledby="hr-overview-title">
          <div className="mb-3 flex items-center justify-between"><h2 id="hr-overview-title" className="text-sm font-extrabold text-slate-900">Workforce overview</h2><p className="text-xs text-slate-500">Live HR data</p></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Active staff" value={stats.activeEmployees} note={`${stats.totalEmployeeRecords} total employee records`} loading={isLoading} />
            <StatCard icon={CalendarDays} label="On leave today" value={stats.onLeaveToday} note="Approved absences today" tone="teal" loading={isLoading} />
            <StatCard icon={CalendarClock} label="Pending leave reviews" value={stats.pendingLeaveReviews} note="Requests awaiting HR action" tone={stats.pendingLeaveReviews ? "amber" : "teal"} loading={isLoading} />
            <StatCard icon={Briefcase} label="Open positions" value={stats.openJobPostings} note="Active recruitment postings" tone="violet" loading={isLoading} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <article className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-3">
            <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-sm font-extrabold text-slate-900">Action queue</h2><p className="mt-1 text-xs text-slate-500">Reviews and deadlines that need HR attention</p></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-800">{actionItems.length}</span></div>
            {isLoading ? <div className="space-y-3">{[1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}</div> : actionItems.length === 0 ? <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 px-4 text-center"><CheckCircle2 size={25} className="text-emerald-700" /><p className="mt-3 text-sm font-extrabold text-emerald-900">HR queues are clear</p><p className="mt-1 text-xs text-emerald-700">There are no urgent reviews or contract deadlines.</p></div> : <div className="space-y-2">{actionItems.map((item) => <Link key={item.key} to={item.path} className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-3 transition hover:border-amber-300 hover:bg-amber-50/60"><span className="flex items-center gap-3 text-sm font-bold text-slate-700"><FileWarning size={17} className="text-amber-700" />{item.label}</span><ArrowRight size={16} className="flex-none text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-amber-700" /></Link>)}</div>}
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2">
            <h2 className="text-sm font-extrabold text-slate-900">Quick actions</h2><p className="mt-1 text-xs text-slate-500">Frequently used HR tasks</p>
            <div className="mt-4 space-y-2">{[
              ["Open staff directory", "/hr/employees", Users],
              ["Review onboarding requests", "/hr/onboarding-requests", UserPlus],
              ["Publish a notification", "/communications/notifications", AlertCircle],
            ].map(([label, path, icon]) => <Link key={path} to={path} className="group flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50">{React.createElement(icon, { size: 17, className: "text-blue-700" })}<span className="flex-1">{label}</span><ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-700" /></Link>)}</div>
          </article>
        </section>

        <section aria-labelledby="hr-modules-title" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between"><div><h2 id="hr-modules-title" className="text-lg font-extrabold text-slate-950">HR modules</h2><p className="mt-1 text-sm text-slate-500">Organized around the employee lifecycle.</p></div><label className="relative block w-full md:w-72"><span className="sr-only">Find an HR module</span><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={moduleSearch} onChange={(event) => setModuleSearch(event.target.value)} placeholder="Find a module" className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label></div>
          {workflowGroups.length === 0 ? <div className="py-14 text-center"><Search size={24} className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-bold text-slate-700">No matching module</p><button type="button" onClick={() => setModuleSearch("")} className="mt-2 text-xs font-bold text-blue-700 hover:underline">Clear search</button></div> : <div className="divide-y divide-slate-200">{workflowGroups.map((workflow) => <div key={workflow.key} className="grid gap-4 py-6 first:pt-5 last:pb-0 lg:grid-cols-[230px_1fr]"><div><h3 className="text-sm font-extrabold text-slate-900">{workflow.title}</h3><p className="mt-1.5 text-xs leading-5 text-slate-500">{workflow.description}</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{workflow.modules.map((module) => <Link key={module.path} to={module.path} className="group flex min-h-28 items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-200"><span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-blue-100 group-hover:text-blue-700">{React.cloneElement(module.icon, { color: "currentColor", className: "" })}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2 text-sm font-extrabold text-slate-800">{module.title}<ArrowRight size={15} className="flex-none text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-700" /></span><span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-slate-500">{module.description}</span></span></Link>)}</div></div>)}</div>}
        </section>

        <section aria-labelledby="workforce-insights-title">
          <div className="mb-3 flex items-center justify-between"><div><h2 id="workforce-insights-title" className="text-sm font-extrabold text-slate-900">Workforce distribution</h2><p className="mt-1 text-xs text-slate-500">Active staff by department and employment type</p></div><span className={`rounded-md px-2.5 py-1 text-xs font-bold ${stats.expiringSoonCount ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{stats.expiringSoonCount} expiring soon</span></div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Staff by department" description="Active employees across academic and administrative units" empty={!isLoading && departmentBreakdown.length === 0}><ResponsiveContainer width="100%" height="100%"><BarChart data={departmentBreakdown} margin={{ top: 6, right: 8, left: -12, bottom: 55 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf4" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} angle={-30} textAnchor="end" height={65} /><YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} /><RechartsTooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 8, border: "1px solid #dfe5ee", fontSize: 12 }} /><Bar dataKey="count" name="Active staff" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={34} isAnimationActive={false} /></BarChart></ResponsiveContainer></ChartCard>
            <ChartCard title="Employment types" description="Contract composition of the active workforce" empty={!isLoading && employmentTypeBreakdown.length === 0}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={employmentTypeBreakdown} innerRadius="52%" outerRadius="76%" paddingAngle={3} dataKey="count" nameKey="type" stroke="none" isAnimationActive={false}>{employmentTypeBreakdown.map((entry, index) => <Cell key={`${entry.type}-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><RechartsTooltip contentStyle={{ borderRadius: 8, border: "1px solid #dfe5ee", fontSize: 12 }} /><Legend verticalAlign="bottom" height={34} iconType="circle" wrapperStyle={{ fontSize: 11, color: "#64748b" }} /></PieChart></ResponsiveContainer></ChartCard>
          </div>
        </section>
      </div>
    </main>
  );
};

export default HrDashboardView;
