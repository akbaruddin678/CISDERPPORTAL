import { Users, RefreshCw, LogOut, Circle } from "lucide-react";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const fmtRelative = (d) => {
  if (!d) return "—";
  const diffMs = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

function parseUserAgent(ua = "") {
  let browser = "Unknown";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  let os = "Unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  return `${browser} · ${os}`;
}

const ActiveSessionsView = ({
  sessions,
  total,
  onlineCount,
  isLoading,
  isFetching,
  onRefresh,
  onRevoke,
  revokingId,
}) => {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
            <Users size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Currently Logged In
            </h1>
            <p className="text-xs text-slate-400">
              {total} active session{total === 1 ? "" : "s"} · {onlineCount}{" "}
              online right now
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[10px] font-bold tracking-wide">
                <th className="text-left px-3 py-2.5">Status</th>
                <th className="text-left px-3 py-2.5">User</th>
                <th className="text-left px-3 py-2.5">IP Address</th>
                <th className="text-left px-3 py-2.5">Device</th>
                <th className="text-left px-3 py-2.5">Logged In</th>
                <th className="text-left px-3 py-2.5">Last Seen</th>
                <th className="text-right px-3 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No one is currently logged in.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr
                    key={s._id}
                    className="border-b border-slate-50 hover:bg-slate-50/70"
                  >
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 font-bold text-[11px] ${s.online ? "text-emerald-600" : "text-slate-400"}`}
                      >
                        <Circle
                          size={8}
                          className={s.online ? "fill-emerald-500" : "fill-slate-300"}
                          strokeWidth={0}
                        />
                        {s.online ? "Online" : "Idle"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-slate-700">
                        {s.user?.email || "—"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {(s.user?.roles || []).join(", ") || "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 font-mono">
                      {s.ipAddress || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {parseUserAgent(s.userAgent)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                      {fmtDateTime(s.loginAt)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                      {fmtRelative(s.lastSeenAt)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => onRevoke(s._id)}
                        disabled={revokingId === s._id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 text-[11px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <LogOut size={12} />
                        {revokingId === s._id ? "Logging out..." : "Force Logout"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActiveSessionsView;
