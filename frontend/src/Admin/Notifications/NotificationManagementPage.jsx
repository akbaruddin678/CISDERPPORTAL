import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Megaphone,
  Search,
  Send,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { notificationService } from "./notificationService";

const emptyForm = { title: "", body: "", type: "General", audienceRoles: [], expiresAt: "" };

const AudienceToggle = ({ role, checked, onChange }) => (
  <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${checked ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
    <input type="checkbox" checked={checked} onChange={onChange} className="mt-1 h-4 w-4 accent-blue-700" />
    <span>
      <span className="block text-sm font-extrabold capitalize text-slate-800">All {role}s</span>
      <span className="mt-0.5 block text-xs leading-5 text-slate-500">Deliver to every active {role} portal.</span>
    </span>
  </label>
);

const NotificationManagementPage = () => {
  const [form, setForm] = useState(emptyForm);
  const [recipientRole, setRecipientRole] = useState("student");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState({ totalPages: 1, total: 0 });
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(recipientSearch.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [recipientSearch]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await notificationService.list(historyPage);
      setHistory(response.data || []);
      setHistoryPagination(response.pagination || { totalPages: 1, total: 0 });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setLoadingHistory(false);
    }
  }, [historyPage]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    let active = true;
    setLoadingRecipients(true);
    notificationService.recipients({ role: recipientRole, search: debouncedSearch })
      .then((response) => { if (active) setRecipients(response.data || []); })
      .catch((error) => { if (active) setFeedback({ type: "error", message: error.message }); })
      .finally(() => { if (active) setLoadingRecipients(false); });
    return () => { active = false; };
  }, [recipientRole, debouncedSearch]);

  const selectedKeys = useMemo(() => new Set(selectedPeople.map((person) => `${person.role}:${person._id}`)), [selectedPeople]);

  const toggleRole = (role) => {
    setForm((current) => ({
      ...current,
      audienceRoles: current.audienceRoles.includes(role)
        ? current.audienceRoles.filter((item) => item !== role)
        : [...current.audienceRoles, role],
    }));
  };

  const togglePerson = (person) => {
    const key = `${person.role}:${person._id}`;
    setSelectedPeople((current) => current.some((item) => `${item.role}:${item._id}` === key)
      ? current.filter((item) => `${item.role}:${item._id}` !== key)
      : [...current, person]);
  };

  const publish = async (event) => {
    event.preventDefault();
    if (!form.audienceRoles.length && !selectedPeople.length) {
      setFeedback({ type: "error", message: "Select at least one audience role or individual person." });
      return;
    }
    setPublishing(true);
    try {
      await notificationService.create({
        ...form,
        recipientStudentIds: selectedPeople.filter((person) => person.role === "student").map((person) => person._id),
        recipientStaffIds: selectedPeople.filter((person) => person.role === "teacher").map((person) => person._id),
        expiresAt: form.expiresAt || null,
      });
      setForm(emptyForm);
      setSelectedPeople([]);
      if (historyPage === 1) await loadHistory();
      else setHistoryPage(1);
      setFeedback({ type: "success", message: "Notification published successfully." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setPublishing(false);
    }
  };

  const changeActive = async (notification) => {
    try {
      await notificationService.setActive(notification._id, !notification.active);
      await loadHistory();
      setFeedback({ type: "success", message: notification.active ? "Notification withdrawn." : "Notification restored." });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-blue-50 text-blue-700"><Megaphone size={21} /></span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950" style={{ fontFamily: "'Aleo', serif" }}>Notifications</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Publish clear notices to every student or teacher, or select specific people for a private targeted message.</p>
            </div>
          </div>
        </header>

        {feedback && (
          <div className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${feedback.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} role="status">
            <span className="flex items-center gap-2 text-sm font-bold">{feedback.type === "error" ? <AlertCircle size={18} /> : <Check size={18} />}{feedback.message}</span>
            <button type="button" onClick={() => setFeedback(null)} aria-label="Dismiss message"><X size={17} /></button>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
          <form onSubmit={publish} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Compose notification</h2>
              <p className="mt-1 text-xs text-slate-500">Role audiences and selected individuals are combined.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Title</span>
                <input required minLength={3} maxLength={140} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" placeholder="Important academic notice" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Category</span>
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                  {["General", "Academic", "Finance", "Urgent"].map((type) => <option key={type}>{type}</option>)}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">Message</span>
              <textarea required minLength={3} maxLength={4000} rows={5} value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" placeholder="Write a concise message with the action and deadline, if applicable." />
              <span className="mt-1 block text-right text-[11px] text-slate-400">{form.body.length}/4000</span>
            </label>

            <fieldset>
              <legend className="mb-2 text-xs font-bold text-slate-700">Send to a complete role</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <AudienceToggle role="student" checked={form.audienceRoles.includes("student")} onChange={() => toggleRole("student")} />
                <AudienceToggle role="teacher" checked={form.audienceRoles.includes("teacher")} onChange={() => toggleRole("teacher")} />
              </div>
            </fieldset>

            <section aria-labelledby="specific-recipients-title" className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 id="specific-recipients-title" className="text-sm font-extrabold text-slate-800">Specific people</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Optional: add individual students or teachers.</p>
                </div>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
                  {["student", "teacher"].map((role) => (
                    <button key={role} type="button" onClick={() => { setRecipientRole(role); setRecipientSearch(""); }} className={`rounded-md px-3 py-1.5 text-xs font-extrabold capitalize ${recipientRole === role ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{role}s</button>
                  ))}
                </div>
              </div>

              {selectedPeople.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedPeople.map((person) => (
                    <button key={`${person.role}:${person._id}`} type="button" onClick={() => togglePerson(person)} className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800">
                      {person.name}<X size={13} />
                    </button>
                  ))}
                </div>
              )}

              <label className="relative block">
                <span className="sr-only">Search recipients</span>
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={recipientSearch} onChange={(event) => setRecipientSearch(event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" placeholder={`Search ${recipientRole}s by name, ID, or email`} />
              </label>

              <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                {loadingRecipients ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin" /> Loading people…</div>
                ) : recipients.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">No matching {recipientRole}s found.</div>
                ) : recipients.map((person) => {
                  const selected = selectedKeys.has(`${person.role}:${person._id}`);
                  return (
                    <button key={person._id} type="button" onClick={() => togglePerson(person)} className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50">
                      <span className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${selected ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500"}`}>{selected ? <Check size={15} /> : <UserRound size={15} />}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{person.name}</span><span className="block truncate text-xs text-slate-500">{[person.identifier, person.email].filter(Boolean).join(" · ")}</span></span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-end sm:justify-between">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">Expires on <span className="font-normal text-slate-400">(optional)</span></span>
                <input type="datetime-local" value={form.expiresAt} onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600" />
              </label>
              <button disabled={publishing} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-extrabold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                {publishing ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />} Publish notification
              </button>
            </div>
          </form>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="text-base font-extrabold text-slate-900">Published notifications</h2><p className="mt-1 text-xs text-slate-500">{historyPagination.total} notification{historyPagination.total === 1 ? "" : "s"}</p></div>
              <Bell size={19} className="text-blue-700" />
            </div>
            {loadingHistory ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500"><LoaderCircle size={18} className="animate-spin" /> Loading history…</div>
            ) : history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center"><UsersRound size={24} className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-bold text-slate-700">No notifications published yet</p></div>
            ) : (
              <div className="space-y-3">
                {history.map((notification) => (
                  <article key={notification._id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-600">{notification.type}</span><span className={`text-[11px] font-bold ${notification.active ? "text-emerald-700" : "text-slate-400"}`}>{notification.active ? "Active" : "Withdrawn"}</span></div><h3 className="mt-2 text-sm font-extrabold text-slate-900">{notification.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{notification.body || notification.summary}</p></div>
                      <button type="button" onClick={() => changeActive(notification)} className="flex-none rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">{notification.active ? "Withdraw" : "Restore"}</button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-500">
                      {(notification.audienceRoles || []).map((role) => <span key={role} className="rounded-full bg-blue-50 px-2 py-1 capitalize text-blue-700">All {role}s</span>)}
                      {notification.recipientStudentIds?.length > 0 && <span className="rounded-full bg-slate-100 px-2 py-1">{notification.recipientStudentIds.length} selected student(s)</span>}
                      {notification.recipientStaffIds?.length > 0 && <span className="rounded-full bg-slate-100 px-2 py-1">{notification.recipientStaffIds.length} selected teacher(s)</span>}
                    </div>
                    <p className="mt-3 text-[11px] text-slate-400">Published {new Date(notification.createdAt).toLocaleString()} by {notification.createdBy?.email || "authorized office"}</p>
                  </article>
                ))}
              </div>
            )}
            {historyPagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4"><button type="button" disabled={historyPage <= 1} onClick={() => setHistoryPage((page) => page - 1)} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={16} /></button><span className="text-xs font-bold text-slate-500">Page {historyPage} of {historyPagination.totalPages}</span><button type="button" disabled={historyPage >= historyPagination.totalPages} onClick={() => setHistoryPage((page) => page + 1)} className="rounded-lg border border-slate-300 p-2 disabled:opacity-40" aria-label="Next page"><ChevronRight size={16} /></button></div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default NotificationManagementPage;
