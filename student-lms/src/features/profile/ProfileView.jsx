import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Mail,
  Hash,
  BookOpen,
  GraduationCap,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Pencil,
  Camera,
  Save,
  XCircle,
  User2,
  CreditCard,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";
import { BASE_URL } from "../../services/baseApi";

// ── PHOTO VALIDATION CONFIG ───────────────────────────────────────
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_MAGIC_BYTES = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png":  [[0x89, 0x50, 0x4E, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
};
const MIN_DIMENSION = 100;
const MAX_DIMENSION = 4000;

// ── MAGIC BYTE CHECK ─────────────────────────────────────────────
const checkMagicBytes = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target.result);
      const signatures = ALLOWED_MAGIC_BYTES[file.type];
      if (!signatures) return reject("Unsupported file type.");
      const matched = signatures.some((sig) =>
        sig.every((byte, i) => arr[i] === byte)
      );
      matched ? resolve() : reject("File content does not match its extension. Please use a real JPEG, PNG, or WebP.");
    };
    reader.onerror = () => reject("Could not read file.");
    reader.readAsArrayBuffer(file.slice(0, 8));
  });

// ── DIMENSION CHECK ──────────────────────────────────────────────
const checkImageDimensions = (objectUrl) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      if (width < MIN_DIMENSION || height < MIN_DIMENSION)
        return reject(`Image too small (${width}×${height}px). Minimum is ${MIN_DIMENSION}×${MIN_DIMENSION}px.`);
      if (width > MAX_DIMENSION || height > MAX_DIMENSION)
        return reject(`Image too large (${width}×${height}px). Maximum is ${MAX_DIMENSION}×${MAX_DIMENSION}px.`);
      resolve({ width, height });
    };
    img.onerror = () => reject("Could not load image for dimension check.");
    img.src = objectUrl;
  });

// ── CONTENT MODERATION (stub — swap for real API) ────────────────
const moderateImage = async (file) => {
  // Replace this block with a real call, e.g.:
  // const formData = new FormData();
  // formData.append("image", file);
  // const res = await fetch(`${BASE_URL}/lms/moderate-image`, {
  //   method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
  // });
  // const { safe, reason } = await res.json();
  // if (!safe) throw new Error(reason || "Image flagged by content moderation.");

  await new Promise((r) => setTimeout(r, 900)); // simulate network delay
  // Stub always passes — real API would reject inappropriate content
  return { safe: true };
};

// ── localStorage helpers (temporary until backend endpoint is ready) ──
const LS_KEY = "lms_student_profile_extra";

const loadLocalProfile = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveLocalProfile = (data) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
};
// ─────────────────────────────────────────────────────────────────────

const ProfileView = () => {
  const { user, token } = useSelector((state) => state.auth);

  // ── EDIT MODE STATE ───────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });

  // Merge Redux user with anything persisted locally
  const buildEditData = (u) => {
    const local = loadLocalProfile();
    return {
      fatherName:    local.fatherName    ?? u?.fatherName    ?? "",
      fatherCnic:    local.fatherCnic    ?? u?.fatherCnic    ?? "",
      studentCnic:   local.studentCnic   ?? u?.studentCnic   ?? "",
      contactNumber: local.contactNumber ?? u?.contactNumber ?? "",
    };
  };

  const [editData, setEditData] = useState(() => buildEditData(user));
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || null);
  const [photoFile, setPhotoFile] = useState(null);
  const fileInputRef = useRef(null);

  // Re-sync when Redux user loads / changes (e.g. after page reload)
  useEffect(() => {
    if (!user) return;
    setEditData(buildEditData(user));
    setPhotoPreview(user.profilePhoto || null);
  }, [user]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === "fatherCnic" || name === "studentCnic") {
      const digits = value.replace(/\D/g, "").slice(0, 13);
      let formatted = digits;
      if (digits.length > 5)  formatted = digits.slice(0, 5) + "-" + digits.slice(5);
      if (digits.length > 12) formatted = formatted.slice(0, 13) + "-" + formatted.slice(13);
      setEditData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setEditData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(buildEditData(user));
    setPhotoPreview(user?.profilePhoto || null);
    setPhotoFile(null);
    setProfileMessage({ text: "", type: "" });
  };

  // ── SAVE PROFILE ─────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMessage({ text: "", type: "" });
    try {

      // ── OPTION A: localStorage (active now — remove when backend is ready) ──
      saveLocalProfile(editData);
      await new Promise((r) => setTimeout(r, 600)); // brief UX delay

      // ── OPTION B: Real API call (uncomment when backend is ready) ──────────
      // const formData = new FormData();
      // if (photoFile) formData.append("profilePhoto", photoFile);
      // formData.append("fatherName",    editData.fatherName);
      // formData.append("fatherCnic",    editData.fatherCnic);
      // formData.append("studentCnic",   editData.studentCnic);
      // formData.append("contactNumber", editData.contactNumber);
      // const response = await fetch(`${BASE_URL}/lms/student/update-profile`, {
      //   method: "PUT",
      //   headers: { Authorization: `Bearer ${token}` },
      //   body: formData,
      // });
      // const result = await response.json();
      // if (!response.ok) throw new Error(result.message || "Failed to update profile");
      // dispatch(updateUser(result.data));
      // localStorage.removeItem(LS_KEY);
      // ─────────────────────────────────────────────────────────────────────────

      setProfileMessage({ text: "Profile updated successfully!", type: "success" });
      setTimeout(() => {
        setIsEditing(false);
        setProfileMessage({ text: "", type: "" });
      }, 1800);
    } catch (error) {
      setProfileMessage({ text: error.message, type: "error" });
    } finally {
      setIsSavingProfile(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────

  // ── PASSWORD STATE (backend untouched) ───────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const toggleShow = (field) =>
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));

  const passwordCriteria = {
    length:      passwordData.newPassword.length >= 8,
    uppercase:   /[A-Z]/.test(passwordData.newPassword),
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword),
  };
  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleInputChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setMessage({ text: "", type: "" });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setMessage({ text: "", type: "" });
    setShowPassword({ currentPassword: false, newPassword: false, confirmPassword: false });
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      return setMessage({ text: "Please ensure your new password meets all strength requirements.", type: "error" });
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setMessage({ text: "New passwords do not match.", type: "error" });
    }
    setIsLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const response = await fetch(`${BASE_URL}/lms/auth/update-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Failed to update password");
      setMessage({ text: "Password updated successfully!", type: "success" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => { handleCloseModal(); }, 2000);
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────

  const readOnlyCards = [
    { icon: <Hash size={20} />,        label: "Registration / Roll No", value: user?.rollNumber || "N/A" },
    { icon: <Mail size={20} />,        label: "Email Address",          value: user?.email      || "N/A" },
    { icon: <BookOpen size={20} />,    label: "Academic Program",       value: user?.program    || "N/A" },
    { icon: <ShieldCheck size={20} />, label: "Account Status",         value: "Active", badge: true },
  ];

  const editableFields = [
    {
      name: "fatherName", label: "Father's Name",
      icon: <User2 size={20} />,
      type: "text", placeholder: "Enter father's name", tracking: false,
    },
    {
      name: "fatherCnic", label: "Father's CNIC",
      icon: <CreditCard size={20} />,
      type: "text", placeholder: "XXXXX-XXXXXXX-X", maxLength: 15, tracking: true,
    },
    {
      name: "studentCnic", label: "Student's CNIC",
      icon: <CreditCard size={20} />,
      type: "text", placeholder: "XXXXX-XXXXXXX-X", maxLength: 15, tracking: true,
    },
    {
      name: "contactNumber", label: "Contact Number",
      icon: <Phone size={20} />,
      type: "tel", placeholder: "+92 3XX XXXXXXX", maxLength: 15, tracking: false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 relative">

      {/* ── PROFILE CARD ── */}
      <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">

        {/* Header Banner */}
        <div className="bg-red-900 px-8 py-10 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-10 left-1/4 w-32 h-32 rounded-full bg-black/10" />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          {/* Edit / Save / Cancel buttons */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-semibold transition-all duration-150"
                >
                  <XCircle size={14} /> Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 border border-white text-red-900 text-xs font-semibold transition-all duration-150 disabled:opacity-60"
                >
                  {isSavingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isSavingProfile ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-semibold transition-all duration-150"
              >
                <Pencil size={13} /> Edit Profile
              </button>
            )}
          </div>

          {/* Avatar with camera overlay in edit mode */}
          <div className="relative flex-shrink-0 z-10">
            <div className="w-24 h-24 rounded-2xl bg-white/15 border-2 border-white/40 shadow-lg overflow-hidden flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <svg viewBox="0 0 100 100" className="w-16 h-16" fill="none">
                  <circle cx="50" cy="38" r="18" fill="white" opacity="0.9" />
                  <path d="M14 95 Q14 62 50 62 Q86 62 86 95" fill="white" opacity="0.9" />
                </svg>
              )}
            </div>
            {isEditing && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 w-24 h-24 rounded-2xl bg-black/40 hover:bg-black/55 flex flex-col items-center justify-center gap-1 text-white transition-all duration-150"
                >
                  <Camera size={20} />
                  <span className="text-[10px] font-semibold">Change</span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </>
            )}
          </div>

          {/* Name & Program */}
          <div className="text-center sm:text-left flex-1 z-10">
            <h2 className="text-2xl font-bold text-white tracking-tight">{user?.name || "Student Name"}</h2>
            <p className="text-red-100 font-medium mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-sm">
              <GraduationCap size={16} /> {user?.program || "Unassigned Program"}
            </p>
            <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-white/15 border border-white/30 text-white text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" /> Active Student
            </span>
          </div>
        </div>

        {/* Profile save feedback */}
        {profileMessage.text && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm border ${
            profileMessage.type === "success" ? "bg-red-50 text-red-900 border-red-200" : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {profileMessage.type === "success"
              ? <CheckCircle2 size={16} className="text-red-900 shrink-0" />
              : <AlertCircle size={16} className="text-red-500 shrink-0" />}
            <span className="font-medium">{profileMessage.text}</span>
          </div>
        )}

        {/* Read-only info cards */}
        <div className="p-6 sm:p-8 pb-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">Account Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {readOnlyCards.map(({ icon, label, value, badge }) => (
              <div key={label} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-red-200 hover:bg-red-50/40 transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-900 border border-red-100 flex items-center justify-center flex-shrink-0">{icon}</div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                  {badge ? (
                    <span className="inline-flex items-center gap-1 mt-0.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> {value}
                    </span>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── EDITABLE PERSONAL INFO ── */}
        <div className="px-6 sm:px-8 pb-6">
          <div className="border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Personal Information</h3>
              {isEditing && (
                <span className="text-xs text-red-900 font-semibold bg-red-50 px-2.5 py-1 rounded-full border border-red-100">Editing</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {editableFields.map(({ name, label, icon, type, placeholder, maxLength, tracking }) => (
                <div
                  key={name}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                    isEditing ? "border-red-200 bg-white shadow-sm" : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-900 border border-red-100 flex items-center justify-center flex-shrink-0">{icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                    {isEditing ? (
                      <input
                        type={type}
                        name={name}
                        value={editData[name]}
                        onChange={handleEditChange}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        className={`w-full text-sm font-semibold text-slate-800 bg-transparent border-b border-red-300 focus:border-red-900 outline-none pb-0.5 placeholder:text-slate-300 placeholder:font-normal transition-colors ${tracking ? "tracking-wider" : ""}`}
                      />
                    ) : (
                      <p className={`text-sm font-semibold text-slate-800 truncate ${tracking ? "tracking-wider" : ""}`}>
                        {editData[name] || <span className="text-slate-300 font-normal tracking-normal">Not provided</span>}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom save bar */}
            {isEditing && (
              <div className="mt-5 flex gap-3 justify-end">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-900 hover:bg-red-950 active:scale-95 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingProfile
                    ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                    : <><Save size={15} /> Save Changes</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security section */}
        <div className="px-6 sm:px-8 py-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-900 text-white flex items-center justify-center flex-shrink-0">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Security & Password</h3>
              <p className="text-xs text-slate-500 mt-0.5">Keep your account secure by updating your password regularly.</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-white border border-slate-200 hover:border-red-900 hover:text-red-900 hover:bg-red-50 text-slate-700 font-semibold text-sm rounded-xl transition-all duration-150 shadow-sm flex items-center justify-center gap-2 flex-shrink-0"
          >
            <KeyRound size={15} /> Change Password
          </button>
        </div>
      </div>

      {/* ── PASSWORD UPDATE MODAL (backend completely untouched) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">

            <div className="h-1.5 w-full bg-red-900" />

            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-900 flex items-center justify-center">
                  <KeyRound size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 leading-tight">Update Password</h3>
                  <p className="text-xs text-red-900 font-medium mt-0.5">Keep your account secure</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-150">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5">
              {message.text && (
                <div className={`mb-5 px-4 py-3 rounded-xl flex items-start gap-3 text-sm border ${
                  message.type === "success" ? "bg-red-50 text-red-900 border-red-200" : "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {message.type === "success"
                    ? <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-red-900" />
                    : <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />}
                  <span className="font-medium">{message.text}</span>
                </div>
              )}

              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide uppercase">
                    Current Password <span className="text-red-900 normal-case tracking-normal">*</span>
                  </label>
                  <div className="relative">
                    <input type={showPassword.currentPassword ? "text" : "password"} name="currentPassword" value={passwordData.currentPassword} onChange={handleInputChange} required
                      className="w-full h-11 pl-4 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-red-200 focus:border-red-900 outline-none transition-all"
                      placeholder="Enter your current password" />
                    <button type="button" onClick={() => toggleShow("currentPassword")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-900 transition-colors">
                      {showPassword.currentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide uppercase">
                    New Password <span className="text-red-900 normal-case tracking-normal">*</span>
                  </label>
                  <div className="relative">
                    <input type={showPassword.newPassword ? "text" : "password"} name="newPassword" value={passwordData.newPassword} onChange={handleInputChange} required
                      className="w-full h-11 pl-4 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-red-200 focus:border-red-900 outline-none transition-all"
                      placeholder="Enter new password" />
                    <button type="button" onClick={() => toggleShow("newPassword")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-900 transition-colors">
                      {showPassword.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordData.newPassword.length > 0 && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Requirements</p>
                      {[
                        { met: passwordCriteria.length,      label: "At least 8 characters" },
                        { met: passwordCriteria.uppercase,   label: "One uppercase letter" },
                        { met: passwordCriteria.specialChar, label: "One special character (!@#$%^&*)" },
                      ].map(({ met, label }) => (
                        <div key={label} className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${met ? "bg-red-900" : "bg-slate-200"}`}>
                            <CheckCircle2 size={10} className={met ? "text-white" : "text-slate-400"} />
                          </div>
                          <span className={`text-xs font-medium transition-colors duration-200 ${met ? "text-red-900" : "text-slate-400"}`}>{label}</span>
                        </div>
                      ))}
                      <div className="pt-1 flex gap-1.5">
                        {[1, 2, 3].map((i) => {
                          const filled = [passwordCriteria.length, passwordCriteria.uppercase, passwordCriteria.specialChar].filter(Boolean).length;
                          const active = i <= filled;
                          const color = filled === 1 ? "bg-red-300" : filled === 2 ? "bg-red-500" : "bg-red-900";
                          return <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${active ? color : "bg-slate-200"}`} />;
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide uppercase">
                    Confirm New Password <span className="text-red-900 normal-case tracking-normal">*</span>
                  </label>
                  <div className="relative">
                    <input type={showPassword.confirmPassword ? "text" : "password"} name="confirmPassword" value={passwordData.confirmPassword} onChange={handleInputChange} required
                      className={`w-full h-11 pl-4 pr-11 bg-slate-50 border rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all ${
                        passwordData.confirmPassword.length > 0 && passwordData.newPassword !== passwordData.confirmPassword
                          ? "border-red-300 focus:ring-2 focus:ring-red-200"
                          : passwordData.confirmPassword.length > 0 && passwordData.newPassword === passwordData.confirmPassword
                          ? "border-red-900 focus:ring-2 focus:ring-red-200"
                          : "border-slate-200 focus:ring-2 focus:ring-red-200 focus:border-red-900"
                      }`}
                      placeholder="Repeat new password" />
                    <button type="button" onClick={() => toggleShow("confirmPassword")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-900 transition-colors">
                      {showPassword.confirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordData.confirmPassword.length > 0 && (
                    <p className={`mt-1.5 text-xs font-medium flex items-center gap-1.5 ${passwordData.newPassword === passwordData.confirmPassword ? "text-red-900" : "text-red-500"}`}>
                      {passwordData.newPassword === passwordData.confirmPassword
                        ? <><CheckCircle2 size={12} /> Passwords match</>
                        : <><AlertCircle size={12} /> Passwords do not match</>}
                    </p>
                  )}
                </div>

                <div className="pt-3 flex gap-3">
                  <button type="button" onClick={handleCloseModal}
                    className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-sm rounded-xl transition-all duration-150 border border-slate-200">
                    Cancel
                  </button>
                  <button type="submit"
                    disabled={isLoading || !passwordData.currentPassword || !isPasswordValid || passwordData.newPassword !== passwordData.confirmPassword}
                    className="flex-1 h-11 bg-red-900 hover:bg-red-950 active:scale-95 text-white font-semibold text-sm rounded-xl transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-900 disabled:active:scale-100">
                    {isLoading ? <><Loader2 className="animate-spin" size={16} /> Saving...</> : "Save Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;