import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Megaphone } from "lucide-react";
import { baseUrl } from "../base/baseurl";

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : "";

// Public, unauthenticated check — shows a one-time announcement modal on
// the landing page whenever the Registrar has an admission session open.
const AdmissionAnnouncementModal = () => {
  const [campaign, setCampaign] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${baseUrl}/api/public/admission-campaign/active`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json?.data) setCampaign(json.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!campaign || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-900 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0">
            <Megaphone size={20} className="text-blue-900" />
          </div>
          <h2 className="text-white font-bold text-lg">Admissions Now Open</h2>
          <button
            onClick={() => setDismissed(true)}
            className="ml-auto text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xl font-extrabold text-blue-900">{campaign.title}</p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Applications are now being accepted for <strong>{campaign.title}</strong>. Apply before the
            window closes to secure your seat.
          </p>
          <div className="flex justify-between text-sm bg-slate-50 rounded-lg p-3">
            <span className="text-slate-500">Opened</span>
            <span className="font-semibold text-slate-800">{formatDate(campaign.startDate)}</span>
          </div>
          <div className="flex justify-between text-sm bg-slate-50 rounded-lg p-3">
            <span className="text-slate-500">Closes</span>
            <span className="font-semibold text-slate-800">{formatDate(campaign.endDate)}</span>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              Maybe Later
            </button>
            <Link
              to="/login"
              className="flex-1 px-4 py-2.5 bg-yellow-500 text-blue-900 rounded-lg font-semibold text-center hover:brightness-110 transition-all"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionAnnouncementModal;
