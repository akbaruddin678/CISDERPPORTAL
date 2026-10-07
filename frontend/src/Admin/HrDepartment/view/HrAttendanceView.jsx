import React from "react";
import { CalendarCheck, Users, Fingerprint, UserCog, Cpu } from "lucide-react";

const STATUS_OPTIONS = ["Present", "Absent", "Late", "Half-Day", "On Leave"];

const STATUS_COLORS = {
  Present: "bg-green-100 text-green-800",
  Absent: "bg-red-100 text-red-800",
  Late: "bg-yellow-100 text-yellow-800",
  "Half-Day": "bg-orange-100 text-orange-800",
  "On Leave": "bg-blue-100 text-blue-800",
};

const SOURCE_META = {
  Biometric: { icon: Fingerprint, label: "Biometric", classes: "text-emerald-700" },
  Manual: { icon: UserCog, label: "Manual", classes: "text-slate-500" },
  System: { icon: Cpu, label: "System", classes: "text-slate-400" },
};

const formatTime = (t) =>
  t ? new Date(t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

const SourceBadge = ({ markedBy }) => {
  if (!markedBy) return <span className="text-xs text-gray-400">—</span>;
  const meta = SOURCE_META[markedBy] || { icon: UserCog, label: markedBy, classes: "text-slate-500" };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${meta.classes}`}>
      <Icon size={12} /> {meta.label}
    </span>
  );
};

// More than 2 taps in a day (i.e. beyond one check-in + one check-out) is
// the signal worth flagging to HR — everything else about deriving
// attendance from punches already lives in StaffAttendance.
const PunchCountBadge = ({ punchCount = 0, punches = [] }) => {
  if (punchCount === 0) return <span className="text-xs text-gray-400">—</span>;
  const isMultiple = punchCount > 2;
  const tooltip = punches
    .map((p) => `${p.action} at ${new Date(p.time).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} (${p.source})`)
    .join("\n");
  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full cursor-help ${
        isMultiple ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
      }`}
    >
      {punchCount} punch{punchCount === 1 ? "" : "es"}
      {isMultiple && " ⚠"}
    </span>
  );
};

const StatTile = ({ label, value, classes }) => (
  <div className={`rounded-xl p-4 text-center ${classes}`}>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs font-semibold uppercase tracking-wide mt-1">{label}</p>
  </div>
);

const HrAttendanceView = ({
  date,
  setDate,
  roster = [],
  isFetching,
  statistics = { total: 0, Present: 0, Absent: 0, Late: 0, "Half-Day": 0, "On Leave": 0 },
  handleStatusChange,
  handleSave,
  isSaving,
}) => {
  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Staff Attendance</h1>
            <p className="text-gray-600 mt-1">Mark and review daily attendance for all active staff.</p>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <StatTile label="Total" value={statistics.total} classes="bg-slate-100 text-slate-700" />
          <StatTile label="Present" value={statistics.Present} classes="bg-green-50 text-green-800" />
          <StatTile label="Absent" value={statistics.Absent} classes="bg-red-50 text-red-800" />
          <StatTile label="Late" value={statistics.Late} classes="bg-yellow-50 text-yellow-800" />
          <StatTile label="Half-Day" value={statistics["Half-Day"]} classes="bg-orange-50 text-orange-800" />
          <StatTile label="On Leave" value={statistics["On Leave"]} classes="bg-blue-50 text-blue-800" />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CalendarCheck size={18} /> Roster
            </h2>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Saving..." : "Save Attendance"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In / Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punches</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isFetching ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : roster.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      No active staff found.
                    </td>
                  </tr>
                ) : (
                  roster.map((r) => (
                    <tr key={r.staffId} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {r.name}
                        <div className="text-xs text-gray-400">{r.employeeId}</div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">{r.departmentName}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {formatTime(r.checkInTime)} — {formatTime(r.checkOutTime)}
                      </td>
                      <td className="px-6 py-3">
                        <SourceBadge markedBy={r.markedBy} />
                      </td>
                      <td className="px-6 py-3">
                        <PunchCountBadge punchCount={r.punchCount} punches={r.punches} />
                      </td>
                      <td className="px-6 py-3">
                        <select
                          value={r.status || ""}
                          onChange={(e) => handleStatusChange(r.staffId, e.target.value)}
                          className={`px-2 py-1 text-xs font-medium rounded-md border-0 ${r.status ? STATUS_COLORS[r.status] : "bg-gray-200 text-gray-500"}`}
                        >
                          <option value="" disabled>— Not Marked —</option>
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
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

export default HrAttendanceView;
