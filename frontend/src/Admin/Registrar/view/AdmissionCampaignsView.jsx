import React from "react";
import { Megaphone, CheckCircle, RefreshCw, Calendar } from "lucide-react";

const StatusBadge = ({ isActive }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
      isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
    }`}
  >
    {isActive ? "Active" : "Ended"}
  </span>
);

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "");

const AdmissionCampaignsView = ({
  campaigns = [],
  isFetching,
  refetch,
  stats = { total: 0, active: 0 },
  title,
  setTitle,
  handleCreate,
  isCreating,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admission Campaigns</h1>
            <p className="text-sm text-slate-500 mt-1">
              Open a new admission session — it announces itself on the public site for 10 days.
            </p>
          </div>
          <button onClick={refetch} disabled={isFetching} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 disabled:opacity-50 transition-colors">
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Megaphone} label="Total Sessions" value={stats.total} color="bg-violet-500" />
          <StatCard icon={CheckCircle} label="Currently Active" value={stats.active} color="bg-emerald-500" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Open a New Session</h2>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. Fall 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none text-sm"
            />
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors font-medium text-sm"
            >
              {isCreating ? "Creating..." : "Open Session"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-semibold">Session</th>
                  <th className="px-6 py-4 font-semibold">Opened</th>
                  <th className="px-6 py-4 font-semibold">Closes</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isFetching ? (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
                ) : campaigns.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">No admission sessions yet.</td></tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{c.title}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" /> {formatDate(c.startDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(c.endDate)}</td>
                      <td className="px-6 py-4"><StatusBadge isActive={c.isActive} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionCampaignsView;
