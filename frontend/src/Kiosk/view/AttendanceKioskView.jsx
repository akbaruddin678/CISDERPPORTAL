import React, { useEffect, useState } from "react";
import { Fingerprint, Delete, CheckCircle2, XCircle, Clock } from "lucide-react";
import { usePunchAttendanceMutation } from "../api/kioskApi";

const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

const RESULT_AUTO_CLEAR_MS = 5000;

const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2 text-slate-300">
      <Clock size={18} />
      <span className="text-lg font-semibold tabular-nums">
        {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
    </div>
  );
};

const AttendanceKioskView = () => {
  const [biometricId, setBiometricId] = useState("");
  const [result, setResult] = useState(null); // { ok, message, staffName, status, time }
  const [punch, { isLoading }] = usePunchAttendanceMutation();

  useEffect(() => {
    if (!result) return;
    const id = setTimeout(() => setResult(null), RESULT_AUTO_CLEAR_MS);
    return () => clearTimeout(id);
  }, [result]);

  const handleKey = (key) => {
    if (key === "clear") return setBiometricId("");
    if (key === "back") return setBiometricId((prev) => prev.slice(0, -1));
    setBiometricId((prev) => (prev + key).slice(0, 20));
  };

  const handleSubmit = async () => {
    if (!biometricId.trim()) return;
    try {
      const res = await punch(biometricId.trim()).unwrap();
      setResult({ ok: true, message: res.message, ...res.data });
    } catch (error) {
      setResult({ ok: false, message: error.data?.message || "Punch failed. Try again." });
    } finally {
      setBiometricId("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6 py-10 font-sans">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-white">
            <Fingerprint size={26} className="text-emerald-400" />
            <span className="text-xl font-black tracking-tight">Attendance Kiosk</span>
          </div>
          <LiveClock />
        </div>

        {result ? (
          <div
            className={`rounded-3xl p-8 text-center mb-6 border ${
              result.ok ? "bg-emerald-950/60 border-emerald-500/40" : "bg-red-950/60 border-red-500/40"
            }`}
          >
            {result.ok ? (
              <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-3" />
            ) : (
              <XCircle size={48} className="mx-auto text-red-400 mb-3" />
            )}
            <p className={`text-lg font-bold ${result.ok ? "text-emerald-100" : "text-red-100"}`}>
              {result.message}
            </p>
            {result.ok && result.time && (
              <p className="text-sm text-slate-300 mt-2">
                {new Date(result.time).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                {result.status ? ` · ${result.status}` : ""}
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-slate-400 mb-6">
            Enter your Biometric ID and press Punch to check in or out.
          </p>
        )}

        <div className="bg-slate-800 rounded-2xl px-5 py-4 mb-4 text-center">
          <span className="text-3xl font-black tracking-[0.3em] text-white tabular-nums">
            {biometricId || "— — — —"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {KEYPAD_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => handleKey(key)}
              className="h-16 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white text-xl font-bold flex items-center justify-center transition-colors"
            >
              {key === "back" ? <Delete size={22} /> : key === "clear" ? "C" : key}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !biometricId.trim()}
          className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-lg font-black tracking-wide transition-colors"
        >
          {isLoading ? "Verifying..." : "Punch"}
        </button>
      </div>
    </div>
  );
};

export default AttendanceKioskView;
