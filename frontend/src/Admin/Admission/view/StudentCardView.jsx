import React from "react";
import {
  Search,
  Loader2,
  IdCard,
  Camera,
  CalendarDays,
  Download,
  Printer,
  X,
  CircleCheck,
  CircleAlert,
  Ban,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UserSearch,
} from "lucide-react";
import { StudentAvatar } from "../../HeadofDepartment/view/HodStudentBits";
import { ReasonDialog, ErrorBox, EmptyState, ToastView } from "../../Graduation/common/graduationUi";
import { fmtDate } from "../../Graduation/common/graduationHelpers";
import { CardFront, CardBack, CARD_W, CARD_H } from "../common/StudentCardFaces";
import CardExporter from "../common/CardExporter";
import PhotoCaptureModal from "../common/PhotoCaptureModal";
import StudentPicker from "./StudentPicker";

const SCALE = 0.86;

const Panel = ({ title, icon, children, right }) => {
  const Icon = icon;
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2.5 text-sm font-extrabold text-slate-900">
          <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Icon size={16} />
          </span>
          {title}
        </h3>
        {right}
      </div>
      {children}
    </section>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{label}</span>
    {children}
  </label>
);

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400";

const CardShell = ({ label, children }) => (
  <div className="flex flex-col items-center gap-3">
    <div
      className="rounded-[18px] overflow-hidden shadow-xl shadow-slate-900/15 ring-1 ring-black/5 bg-white"
      style={{ width: CARD_W * SCALE, height: CARD_H * SCALE }}
    >
      <div style={{ width: CARD_W, height: CARD_H, transform: `scale(${SCALE})`, transformOrigin: "top left" }}>{children}</div>
    </div>
    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</span>
  </div>
);

const STATUS_STYLE = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  replaced: "bg-slate-100 text-slate-500 ring-slate-200",
  revoked: "bg-rose-50 text-rose-700 ring-rose-200",
};

const IssuePanel = ({ c }) => {
  const s = c.student;
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start">
      <div className="space-y-5">
        <Panel title="Student" icon={UserSearch}>
          <StudentPicker c={c} />
        </Panel>

        {s && (
          <>
            <Panel title="Card photo" icon={Camera}>
              <div className="flex items-center gap-4">
                <div
                  className="w-[84px] h-[112px] rounded-xl shrink-0 ring-1 ring-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden"
                  style={c.photo ? { background: `url(${c.photo}) center/cover no-repeat` } : undefined}
                >
                  {!c.photo && <Camera size={22} className="text-slate-300" />}
                </div>
                <div className="min-w-0">
                  {c.hasPhoto ? (
                    <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <CircleCheck size={14} /> Official photo on file
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                      <CircleAlert size={14} /> No photo yet — required for the card
                    </p>
                  )}
                  <p className="text-[11px] font-medium text-slate-400 mt-1">
                    Select a picture or take one now. It becomes the student's official picture in the system.
                  </p>
                  <button
                    onClick={c.openPhoto}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 ring-1 ring-indigo-200"
                  >
                    <Camera size={14} /> {c.hasPhoto ? "Change photo" : "Add photo"}
                  </button>
                </div>
              </div>
            </Panel>

            <Panel title="Validity" icon={CalendarDays}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Issue date">
                  <input type="date" value={c.form.issueDate} onChange={(e) => c.setField("issueDate", e.target.value)} className={inputCls} />
                </Field>
                <Field label="End date">
                  <input type="date" value={c.form.expiryDate} onChange={(e) => c.setField("expiryDate", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Issue session">
                  <select value={c.form.issueTermId} onChange={(e) => c.setField("issueTermId", e.target.value)} className={inputCls}>
                    <option value="">Select…</option>
                    {c.sessions.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="End session">
                  <select value={c.form.endTermId} onChange={(e) => c.setField("endTermId", e.target.value)} className={inputCls}>
                    <option value="">Select…</option>
                    {c.sessions.map((t) => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-3">
                Suggested from the student's program and current semester — change anything that differs.
              </p>
            </Panel>

            <div className="space-y-3">
              {c.validation && (
                <p className="text-xs font-semibold rounded-xl px-3.5 py-2.5 bg-amber-50 text-amber-700">{c.validation}</p>
              )}
              <button
                onClick={c.generate}
                disabled={!!c.validation || c.isBusy}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-black text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 transition-colors"
              >
                {c.isBusy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {c.active ? "Re-issue card & download PDF" : "Generate card & download PDF"}
              </button>
              {c.active && (
                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <p className="text-xs font-bold text-slate-700">
                    Current card <span className="font-mono text-indigo-700">{c.active.cardNumber}</span>
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    Valid {fmtDate(c.active.issueDate)} → {fmtDate(c.active.expiryDate)} · printed {c.active.printCount}×
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => c.exportActive("download")}
                      disabled={c.isBusy}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
                    >
                      <Download size={14} /> Download
                    </button>
                    <button
                      onClick={() => c.exportActive("print")}
                      disabled={c.isBusy}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
                    >
                      <Printer size={14} /> Print
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div
        className="rounded-3xl border border-slate-200 p-8 min-h-[560px] flex items-center justify-center"
        style={{ backgroundColor: "#eef1f5", backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "18px 18px" }}
      >
        {c.isLoadingStudent && !c.previewModel ? (
          <Loader2 className="animate-spin text-slate-400" />
        ) : c.previewModel ? (
          <div className="flex flex-wrap justify-center gap-10">
            <CardShell label="Front">
              <CardFront model={{ ...c.previewModel }} />
            </CardShell>
            <CardShell label="Back">
              <CardBack model={{ ...c.previewModel }} />
            </CardShell>
          </div>
        ) : (
          <EmptyState icon={IdCard} title="Your card preview appears here" hint="Search for a student on the left — the card fills in from their profile as you go." />
        )}
      </div>
    </div>
  );
};

const CardsPanel = ({ c }) => (
  <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-80">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={c.cardSearch}
          onChange={(e) => c.setCardSearch(e.target.value)}
          placeholder="Search name, reg. no. or card number"
          className={`${inputCls} pl-10`}
        />
      </div>
      <select value={c.cardStatus} onChange={(e) => c.setCardStatus(e.target.value)} className={`${inputCls} w-auto`}>
        <option value="">All cards</option>
        <option value="active">Active</option>
        <option value="replaced">Replaced</option>
        <option value="revoked">Revoked</option>
      </select>
    </div>
    {c.cardsErrorMessage && <ErrorBox message={c.cardsErrorMessage} />}
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {c.isLoadingCards && !c.cards.length ? (
        <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /></div>
      ) : c.cards.length === 0 ? (
        <EmptyState icon={IdCard} title="No cards issued yet" hint="Cards you generate appear here with their full history." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="text-left font-bold px-4 py-3">Student</th>
                <th className="text-left font-bold px-4 py-3">Card no.</th>
                <th className="text-left font-bold px-4 py-3 hidden md:table-cell">Validity</th>
                <th className="text-left font-bold px-4 py-3 hidden lg:table-cell">Sessions</th>
                <th className="text-left font-bold px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {c.cards.map((card) => (
                <tr key={card._id} className="hover:bg-indigo-50/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <StudentAvatar name={card.snapshot.fullName} size="sm" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{card.snapshot.fullName}</p>
                        <p className="text-[11px] font-mono font-semibold text-slate-400">{card.snapshot.regNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-700">{card.cardNumber}</td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">
                    {fmtDate(card.issueDate)} → {fmtDate(card.expiryDate)}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-500 hidden lg:table-cell">
                    {card.issueTerm} → {card.endTerm}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ring-1 ${STATUS_STYLE[card.status]}`}>
                      {card.status}
                    </span>
                    {card.status === "revoked" && card.revokedReason && (
                      <p className="text-[10px] font-medium text-slate-400 mt-1 max-w-[160px] truncate">{card.revokedReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button
                        title="Download PDF"
                        disabled={c.isBusy}
                        onClick={() => c.downloadIssued(card, "download")}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center disabled:opacity-40"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        title="Print"
                        disabled={c.isBusy}
                        onClick={() => c.downloadIssued(card, "print")}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center disabled:opacity-40"
                      >
                        <Printer size={14} />
                      </button>
                      {card.status === "active" && (
                        <button
                          title="Revoke"
                          onClick={() => c.openRevoke(card)}
                          className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center"
                        >
                          <Ban size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    {c.pagination.pages > 1 && (
      <div className="flex items-center justify-end gap-3 text-xs font-bold text-slate-500">
        <span>
          Page {c.pagination.page} of {c.pagination.pages} · {c.pagination.total} cards
        </span>
        <button disabled={c.page <= 1} onClick={() => c.setPage(c.page - 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center disabled:opacity-40">
          <ChevronLeft size={15} />
        </button>
        <button disabled={c.page >= c.pagination.pages} onClick={() => c.setPage(c.page + 1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center disabled:opacity-40">
          <ChevronRight size={15} />
        </button>
      </div>
    )}
  </div>
);

const StudentCardView = ({ c }) => (
  <div className="min-h-screen bg-slate-50" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <IdCard size={19} />
          </span>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">Student Cards</h1>
            <p className="text-xs font-medium text-slate-500">Set the photo and validity, then generate a print-ready ID card.</p>
          </div>
        </div>
        <div className="ml-auto inline-flex gap-1 rounded-xl bg-slate-100 p-1">
          {[
            ["issue", "Issue a card"],
            ["issued", "Issued cards"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => c.setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                c.tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-6 py-6 pb-16">
      {c.tab === "issue" ? <IssuePanel c={c} /> : <CardsPanel c={c} />}
    </div>

    {c.photoOpen && c.student && (
      <PhotoCaptureModal
        studentName={c.student.fullName}
        saving={c.isSavingPhoto}
        onSave={c.savePhoto}
        onClose={c.closePhoto}
      />
    )}
    {c.revokeTarget && (
      <ReasonDialog
        title="Revoke this card"
        label="Reason (lost, damaged, student left…)"
        confirmLabel="Revoke card"
        busy={c.isRevoking}
        onConfirm={c.confirmRevoke}
        onClose={c.closeRevoke}
      />
    )}
    <CardExporter ref={c.exporterRef} />
    <ToastView toast={c.toast} />
  </div>
);

export default StudentCardView;
