import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExamLinks } from "../services/ExamLinks.jsx";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import "../common/examWorkspace.css";

const WORKFLOWS = [
  {
    key: "plan",
    title: "Plan & schedule",
    description: "Prepare exams, publish dates, and confirm student access.",
    paths: ["/exam/create", "/exam/schedule", "/exam/timetable", "/exam/admit-cards"],
  },
  {
    key: "conduct",
    title: "Conduct & assess",
    description: "Capture attendance and marks, then resolve academic cases.",
    paths: ["/exam/attendance", "/exam/marks-upload", "/exam/results", "/exam/appeals", "/exam/ufm"],
  },
  {
    key: "records",
    title: "Student records",
    description: "Review academic history and issue official documents.",
    paths: ["/exam/student/history", "/exam/certification"],
  },
  {
    key: "graduate",
    title: "Progress & graduate",
    description: "Move students forward and verify completion requirements.",
    paths: ["/exam/student/promotion", "/exam/degree-audit", "/exam/graduation-clearance"],
  },
];

const StatCard = ({ icon: Icon, label, value, note, tone = "blue", loading }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    teal: "bg-teal-50 text-teal-700 border-teal-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
          {loading ? (
            <div className="mt-3 h-8 w-16 animate-pulse rounded-md bg-slate-100" />
          ) : (
            <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
          )}
          <p className="mt-1 text-xs text-slate-500">{note}</p>
        </div>
        <span className={`inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg border ${tones[tone]}`}>
          {React.createElement(Icon, { size: 19, strokeWidth: 2.1, "aria-hidden": true })}
        </span>
      </div>
    </article>
  );
};

const LoadingLines = () => (
  <div className="space-y-3" aria-label="Loading examination data">
    {[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}
  </div>
);

const ExamHomeView = ({ stats, upcomingExamsList, actionItems, isLoading, isError, refetch }) => {
  const links = useMemo(() => ExamLinks(), []);
  const [moduleSearch, setModuleSearch] = useState("");
  const query = moduleSearch.trim().toLowerCase();

  const workflowGroups = useMemo(
    () => WORKFLOWS.map((workflow) => ({
      ...workflow,
      modules: workflow.paths
        .map((path) => links.find((link) => link.path === path))
        .filter(Boolean)
        .filter((link) => !query || `${link.title} ${link.description}`.toLowerCase().includes(query)),
    })).filter((workflow) => workflow.modules.length > 0),
    [links, query],
  );

  const attentionCount = stats.openUfmCount + stats.pendingReEvaluationCount + stats.draftExams;

  return (
    <main className="exam-workspace min-h-screen bg-[#f6f8fb] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1440px] space-y-6">
        <header className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-blue-700">Academic operations</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl" style={{ fontFamily: "'Aleo', serif" }}>
              Examinations
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Plan examinations, monitor completion, publish results, and maintain trusted academic records.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refetch}
              disabled={isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Refresh
            </button>
            <Link to="/exam/create" className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800">
              <Plus size={16} /> Create exam
            </Link>
          </div>
        </header>

        {isError && (
          <section className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 flex-none text-rose-700" />
              <div>
                <p className="text-sm font-extrabold text-rose-900">Dashboard data could not be loaded</p>
                <p className="mt-0.5 text-xs text-rose-700">Your exam modules remain available. Retry to refresh the summary.</p>
              </div>
            </div>
            <button type="button" onClick={refetch} className="self-start rounded-lg bg-rose-700 px-3 py-2 text-xs font-bold text-white hover:bg-rose-800">Retry</button>
          </section>
        )}

        <section aria-labelledby="exam-overview-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="exam-overview-title" className="text-sm font-extrabold text-slate-900">Current overview</h2>
            <p className="text-xs text-slate-500">Live examination data</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={ClipboardList} label="All exams" value={stats.totalExams} note={`${stats.publishedExams} published`} tone="blue" loading={isLoading} />
            <StatCard icon={CalendarDays} label="Next 7 days" value={stats.upcomingExams} note="Published examinations" tone="teal" loading={isLoading} />
            <StatCard icon={Users} label="Active students" value={stats.totalStudents} note={`${stats.activeAdmitCards} admit cards issued`} tone="blue" loading={isLoading} />
            <StatCard icon={AlertCircle} label="Needs attention" value={attentionCount} note={`${stats.draftExams} exams still in draft`} tone={attentionCount ? "amber" : "teal"} loading={isLoading} />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <article className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-3">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Upcoming examinations</h2>
                <p className="mt-1 text-xs text-slate-500">Published exams scheduled during the next seven days</p>
              </div>
              <Ticket size={19} className="text-blue-700" aria-hidden="true" />
            </div>
            {isLoading ? <LoadingLines /> : upcomingExamsList.length === 0 ? (
              <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
                <CalendarDays size={24} className="text-slate-400" />
                <p className="mt-3 text-sm font-bold text-slate-700">No exams scheduled this week</p>
                <p className="mt-1 text-xs text-slate-500">Published examinations will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingExamsList.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-800">{exam.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{[exam.type, exam.department, exam.program].filter(Boolean).join(" · ")}</p>
                    </div>
                    <span className="flex-none rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-800">{exam.dateLabel}</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Attention queue</h2>
                <p className="mt-1 text-xs text-slate-500">Items that may block exam completion</p>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-extrabold text-amber-800">{attentionCount}</span>
            </div>
            {isLoading ? <LoadingLines /> : actionItems.length === 0 ? (
              <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 px-4 text-center">
                <ShieldCheck size={25} className="text-emerald-700" />
                <p className="mt-3 text-sm font-extrabold text-emerald-900">All queues are clear</p>
                <p className="mt-1 text-xs text-emerald-700">No unresolved academic actions require attention.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {actionItems.map((item) => (
                  <Link key={item.key} to={item.path} className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-3 transition hover:border-amber-300 hover:bg-amber-50/60">
                    <span className="text-sm font-bold leading-5 text-slate-700">{item.label}</span>
                    <ArrowRight size={16} className="flex-none text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-amber-700" />
                  </Link>
                ))}
              </div>
            )}
          </article>
        </section>

        <section aria-labelledby="exam-modules-title" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="exam-modules-title" className="text-lg font-extrabold text-slate-950">Exam modules</h2>
              <p className="mt-1 text-sm text-slate-500">Organized around the academic examination lifecycle.</p>
            </div>
            <label className="relative block w-full md:w-72">
              <span className="sr-only">Find an exam module</span>
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={moduleSearch}
                onChange={(event) => setModuleSearch(event.target.value)}
                placeholder="Find a module"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {workflowGroups.length === 0 ? (
            <div className="py-14 text-center">
              <Search size={24} className="mx-auto text-slate-400" />
              <p className="mt-3 text-sm font-bold text-slate-700">No matching module</p>
              <button type="button" onClick={() => setModuleSearch("")} className="mt-2 text-xs font-bold text-blue-700 hover:underline">Clear search</button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {workflowGroups.map((workflow) => (
                <div key={workflow.key} className="grid gap-4 py-6 first:pt-5 last:pb-0 lg:grid-cols-[230px_1fr]">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{workflow.title}</h3>
                    <p className="mt-1.5 text-xs leading-5 text-slate-500">{workflow.description}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {workflow.modules.map((module) => (
                      <Link key={module.path} to={module.path} className="group flex min-h-28 items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-200">
                        <span className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-blue-100 group-hover:text-blue-700">
                          {React.cloneElement(module.icon, { color: "currentColor", className: "" })}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2 text-sm font-extrabold text-slate-800">
                            {module.title}<ArrowRight size={15} className="flex-none text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-700" />
                          </span>
                          <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-slate-500">{module.description}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-600" /> {stats.publishedExams} published</span>
          <span className="inline-flex items-center gap-1.5"><GraduationCap size={14} className="text-blue-600" /> Academic records synchronized</span>
        </footer>
      </div>
    </main>
  );
};

export default ExamHomeView;
