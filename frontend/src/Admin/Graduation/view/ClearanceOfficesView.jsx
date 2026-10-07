import React from "react";
import { Building2, Plus, UserPlus, X, Loader2, Search, ShieldCheck, Power } from "lucide-react";
import { EmptyState, ErrorBox, ToastView } from "../common/graduationUi";

const ROLE_LABEL = { library: "Library login", transport: "Transport login", hostel: "Hostel login", it_labs: "IT & Labs login" };

const OfficeCard = ({ o, c }) => {
  const picking = c.pickerOfficeId === o._id;
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 ${o.isActive ? "border-slate-200/80" : "border-slate-200 opacity-70"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-black text-slate-900 flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 size={17} />
            </span>
            {o.name}
          </p>
          {o.description && <p className="text-xs font-medium text-slate-500 mt-2">{o.description}</p>}
        </div>
        <button
          onClick={() => c.toggleActive(o)}
          disabled={c.isBusy}
          title={o.isActive ? "Deactivate" : "Activate"}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ring-1 transition-colors ${
            o.isActive
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-500 ring-slate-200 hover:bg-slate-200"
          }`}
        >
          <Power size={12} /> {o.isActive ? "Active" : "Inactive"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {o.roles.map((r) => (
          <span key={r} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
            <ShieldCheck size={11} /> {ROLE_LABEL[r] || r}
          </span>
        ))}
        {o.autoCheck !== "none" && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 ring-1 ring-sky-200">
            Auto-checks {o.autoCheck} allocation
          </span>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Assigned officers</p>
        {o.officers.length === 0 ? (
          <p className="text-xs font-medium text-slate-400">
            {o.roles.length ? "Anyone holding the office login can clear this office." : "No officer assigned yet."}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {o.officers.map((u) => (
              <li key={u._id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
                <span className="text-xs font-semibold text-slate-700 truncate">{u.email}</span>
                <button onClick={() => c.removeOfficer(o, u._id)} className="text-slate-400 hover:text-rose-600">
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {picking ? (
          <div className="mt-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={c.pickerQuery}
                onChange={(e) => c.setPickerQuery(e.target.value)}
                placeholder="Search a staff user by email"
                className="w-full rounded-xl border border-slate-300 pl-9 pr-8 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button onClick={c.closePicker} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
            <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden">
              {c.isSearching ? (
                <p className="p-3 text-xs font-medium text-slate-400 flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" /> Searching…
                </p>
              ) : c.pickerResults.length === 0 ? (
                <p className="p-3 text-xs font-medium text-slate-400">
                  {c.pickerQuery.trim().length < 2 ? "Type at least 2 characters." : "No matching staff user."}
                </p>
              ) : (
                c.pickerResults.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => c.addOfficer(o, u)}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 border-b border-slate-100 last:border-0"
                  >
                    <p className="text-xs font-bold text-slate-800">{u.email}</p>
                    <p className="text-[10px] font-medium text-slate-400">{u.roles.join(", ")}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={() => c.openPicker(o._id)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            <UserPlus size={14} /> Assign officer
          </button>
        )}
      </div>
    </div>
  );
};

const ClearanceOfficesView = ({ c }) => (
  <div className="min-h-screen bg-slate-50">
    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 text-white">
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-14 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
            <Building2 size={22} />
          </span>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Clearance Offices</h1>
            <p className="text-sm font-medium text-slate-300 mt-0.5 max-w-xl">
              The offices every graduating student must clear. Add more and assign the people who sign for them.
            </p>
          </div>
        </div>
        <button
          onClick={c.openForm}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-slate-900 bg-white hover:bg-indigo-50 shadow-lg"
        >
          <Plus size={16} /> Add office
        </button>
      </div>
    </div>

    <div className="max-w-6xl mx-auto px-6 -mt-6 pb-16 space-y-4">
      {c.errorMessage && <ErrorBox message={c.errorMessage} />}
      {c.isLoading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      ) : c.offices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState icon={Building2} title="No offices yet" hint="Add the first office a graduating student must clear." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {c.offices.map((o) => (
            <OfficeCard key={o._id} o={o} c={c} />
          ))}
        </div>
      )}
      <p className="text-xs font-medium text-slate-400 px-1">
        Changes apply to clearances started from now on; clearances already in progress keep the offices they began with.
      </p>
    </div>

    {c.showForm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6">
          <h4 className="text-lg font-black text-slate-900">Add clearance office</h4>
          <label className="block text-xs font-bold text-slate-500 mt-4 mb-1.5">Office name</label>
          <input
            autoFocus
            value={c.form.name}
            onChange={(e) => c.setFormField("name", e.target.value)}
            placeholder="e.g. Sports Office"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <label className="block text-xs font-bold text-slate-500 mt-4 mb-1.5">What does it confirm? (optional)</label>
          <textarea
            rows={3}
            value={c.form.description}
            onChange={(e) => c.setFormField("description", e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <div className="flex justify-end gap-2 mt-5">
            <button onClick={c.closeForm} className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button
              disabled={!c.form.name.trim() || c.isBusy}
              onClick={c.submitForm}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-2"
            >
              {c.isBusy && <Loader2 size={14} className="animate-spin" />} Add office
            </button>
          </div>
        </div>
      </div>
    )}
    <ToastView toast={c.toast} />
  </div>
);

export default ClearanceOfficesView;
