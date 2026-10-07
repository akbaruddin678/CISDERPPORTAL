import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../components/auth/context/AuthContext";
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  Activity,
  MessageCircle,
  LogOut,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const AdminProfile = ({ userData }) => {
  const { dispatchAuthLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatchAuthLogout();
    navigate("/");
  };

  // Prepare WhatsApp Link with Pre-filled Message
  const adminName = userData?.name || "Admin User";
  const waNumber = "923492649173"; // Formatted with Pakistan country code (+92)
  const waMessage = `Hello Technical Support,%0A%0AI am *${adminName}*, an Admin on the CISD Portal.%0A%0AI am reaching out regarding the following issue/improvement:%0A%0A`;
  const whatsappUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

  // Format Roles safely
  const displayRole = Array.isArray(userData?.roles)
    ? userData.roles[0].replace("_", " ")
    : userData?.roles || "Administrator";

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex justify-center items-start font-sans antialiased">
      <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* --- CARD HEADER (Original Admin Gray Theme) --- */}
        <div className="bg-gradient-to-r from-[#616161] to-[#757575] p-8 relative shadow-inner">
          {/* Custom Integrated Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 p-2 bg-[#424242]/40 hover:bg-[#424242]/80 text-white rounded-xl backdrop-blur-sm transition-all flex items-center justify-center group border border-white/10"
            title="Go Back"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
          </button>

          {/* Profile Avatar & Title */}
          <div className="flex flex-col items-center mt-4">
            <div className="w-24 h-24 rounded-full bg-[#424242] flex items-center justify-center text-white text-4xl font-black shadow-lg shadow-black/20 border-4 border-[#616161] relative">
              {userData?.name?.charAt(0).toUpperCase() || "A"}
              {userData?.emailVerified && (
                <div className="absolute bottom-0 right-0 bg-emerald-500 rounded-full p-1 border-2 border-[#616161]">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              )}
            </div>

            <h1 className="mt-4 text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              {userData?.name || "Admin Profile"}
            </h1>
            <span className="mt-1.5 px-3 py-1 bg-[#424242]/60 border border-white/20 text-gray-100 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm">
              {displayRole}
            </span>
          </div>
        </div>

        {/* --- CARD BODY (Content) --- */}
        <div className="p-8 space-y-8">
          {/* Account Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
              Account Details
            </h3>

            <div className="grid gap-3">
              {/* Email Row */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-700 shrink-0">
                  <Mail size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                    Email Address
                  </p>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {userData?.email || "No email provided"}
                  </p>
                </div>
              </div>

              {/* Role Row */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-700 shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                    Access Level
                  </p>
                  <p className="text-sm font-semibold text-slate-800 capitalize">
                    {displayRole}
                  </p>
                </div>
              </div>

              {/* Status Row */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${userData?.emailVerified ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                >
                  <Activity size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                    Account Status
                  </p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-800">
                      {userData?.emailVerified
                        ? "Verified & Active"
                        : "Pending Verification"}
                    </p>
                    {!userData?.emailVerified && (
                      <XCircle size={14} className="text-amber-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-slate-100"></div>

          {/* Support & Actions Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">
              Support & Actions
            </h3>

            {/* WhatsApp Technical Support Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-2xl transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center text-white shadow-lg shadow-[#25D366]/30 group-hover:scale-110 transition-transform">
                  <MessageCircle size={20} fill="currentColor" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">
                    Technical Support
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-700">
                    Chat with us on WhatsApp
                  </p>
                </div>
              </div>
              <span className="text-[#25D366] font-medium mr-2 group-hover:translate-x-1 transition-transform">
                →
              </span>
            </a>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-3.5 bg-white border-2 border-rose-100 hover:bg-rose-50 text-rose-600 font-bold rounded-2xl transition-colors shadow-sm"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
