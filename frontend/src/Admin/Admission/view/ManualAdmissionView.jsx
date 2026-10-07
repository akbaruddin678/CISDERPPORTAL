import React from "react";
import {
  UserPlus,
  User,
  MapPin,
  Users,
  GraduationCap,
  BookOpen,
  StickyNote,
  CheckCircle2,
  Check,
  Copy,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

const FONT = { fontFamily: "Inter, system-ui, sans-serif" };

const inputCls =
  "w-full h-10 px-3.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-shadow";

const Field = ({ label, required, hint, children, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="block text-[13px] font-semibold text-slate-700 mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </span>
    {children}
    {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
  </label>
);

const Section = ({ id, number, icon, title, description, children }) => {
  const Icon = icon;
  return (
    <section id={id} className="bg-white rounded-2xl border border-slate-200 scroll-mt-24">
      <div className="flex items-start gap-3.5 px-6 pt-5 pb-4 border-b border-slate-100">
        <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Icon size={17} />
        </span>
        <div>
          <h2 className="text-[15px] font-extrabold text-slate-900 leading-tight">
            <span className="text-slate-300 mr-1.5">{number}</span>
            {title}
          </h2>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </section>
  );
};

// Required fields per section — drives the live "x of y" in the navigator.
const REQUIRED = {
  personal: ["fullName", "email", "phone", "cnic", "dob", "gender"],
  address: ["currentAddress", "currentDistrict", "currentProvince"],
  family: ["fatherName", "guardianStatus"],
  program: ["academicDepartment", "applyingForProgram", "applyingSession"],
};

const SECTIONS = [
  { id: "personal", label: "Personal", icon: User },
  { id: "address", label: "Address", icon: MapPin },
  { id: "family", label: "Family / Guardian", icon: Users },
  { id: "program", label: "Program & session", icon: GraduationCap },
  { id: "education", label: "Education history", icon: BookOpen },
  { id: "remark", label: "Remark", icon: StickyNote },
];

const ManualAdmissionView = ({
  formData,
  handleChange,
  departments,
  programs,
  terms,

  educationDetails,
  addEducationRow,
  removeEducationRow,
  updateEducationRow,

  handleSubmit,
  isLoading,
  result,
  resetForm,
  goToAdmissionDetail,
}) => {
  if (result) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center bg-slate-50" style={FONT}>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-9 max-w-lg w-full space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-4">Student registered</h2>
            <p className="text-sm text-slate-500 mt-1">
              {result.student?.fullName} is now an enrolled student.
            </p>
          </div>

          {result.studentProfile?.studentId && (
            <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Student ID</p>
              <p className="text-xl font-extrabold text-slate-900 tracking-wide mt-0.5 font-mono">
                {result.studentProfile.studentId}
              </p>
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 px-5 py-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Temporary login</p>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">Email</span>
              <span className="font-semibold text-slate-800 truncate">{result.student?.email || formData.email}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">Password</span>
              <span className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-800">{result.tempPassword}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(result.tempPassword)}
                  title="Copy password"
                  className="w-7 h-7 rounded-md bg-white ring-1 ring-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center"
                >
                  <Copy size={13} />
                </button>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              A welcome email with a set-password link was also sent — this temporary password works either way.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Register another
            </button>
            <button
              onClick={goToAdmissionDetail}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800"
            >
              Open students
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = (id) => {
    const keys = REQUIRED[id];
    if (!keys) return null;
    const done = keys.filter((k) => String(formData[k] || "").trim() !== "").length;
    return { done, total: keys.length };
  };
  const totals = Object.keys(REQUIRED).reduce(
    (acc, id) => {
      const p = progress(id);
      return { done: acc.done + p.done, total: acc.total + p.total };
    },
    { done: 0, total: 0 },
  );
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-slate-50" style={FONT}>
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <UserPlus size={19} />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600 leading-none">Admission Office</p>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight mt-1">Manual Admission</h1>
          </div>
          <p className="hidden md:block ml-auto text-sm text-slate-500 max-w-sm text-right">
            Register a walk-in student directly — no email verification required.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6 pb-28">
        <aside className="hidden lg:block">
          <div className="sticky top-6 bg-white rounded-2xl border border-slate-200 p-3">
            <p className="px-2 pt-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Sections</p>
            <nav className="space-y-0.5">
              {SECTIONS.map((sec) => {
                const p = progress(sec.id);
                const complete = p && p.done === p.total;
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => jump(sec.id)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        complete ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {complete ? <Check size={13} strokeWidth={3} /> : <Icon size={12} />}
                    </span>
                    <span className="flex-1 truncate">{sec.label}</span>
                    {p && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {p.done}/{p.total}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="space-y-5 min-w-0">
          <Section id="personal" number="01" icon={User} title="Personal information" description="As printed on the student's CNIC / B-Form.">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Full name" required>
                <input name="fullName" value={formData.fullName} onChange={handleChange} className={inputCls} required />
              </Field>
              <Field label="Email" required>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputCls} required />
              </Field>
              <Field label="Phone" required>
                <input name="phone" value={formData.phone} onChange={handleChange} className={inputCls} placeholder="03001234567" maxLength={11} required />
              </Field>
              <Field label="CNIC / B-Form" required hint="13 digits, no dashes">
                <input name="cnic" value={formData.cnic} onChange={handleChange} className={inputCls} placeholder="3520212345671" maxLength={13} required />
              </Field>
              <Field label="Date of birth" required>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputCls} required />
              </Field>
              <Field label="Gender" required>
                <select name="gender" value={formData.gender} onChange={handleChange} className={inputCls} required>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section id="address" number="02" icon={MapPin} title="Address">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Current address" required className="md:col-span-3">
                <input name="currentAddress" value={formData.currentAddress} onChange={handleChange} className={inputCls} required />
              </Field>
              <Field label="District" required>
                <input name="currentDistrict" value={formData.currentDistrict} onChange={handleChange} className={inputCls} required />
              </Field>
              <Field label="Province" required>
                <input name="currentProvince" value={formData.currentProvince} onChange={handleChange} className={inputCls} required />
              </Field>
              <Field label="Country">
                <input name="currentCountry" value={formData.currentCountry} onChange={handleChange} className={inputCls} />
              </Field>
            </div>
            <label className="inline-flex items-center gap-2.5 text-[13px] font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" name="sameAsCurrent" checked={formData.sameAsCurrent} onChange={handleChange} className="w-4 h-4 accent-indigo-600" />
              Permanent address is the same as current
            </label>
            {!formData.sameAsCurrent && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <Field label="Permanent address" className="md:col-span-3">
                  <input name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className={inputCls} />
                </Field>
                <Field label="District">
                  <input name="permanentDistrict" value={formData.permanentDistrict} onChange={handleChange} className={inputCls} />
                </Field>
                <Field label="Province">
                  <input name="permanentProvince" value={formData.permanentProvince} onChange={handleChange} className={inputCls} />
                </Field>
                <Field label="Country">
                  <input name="permanentCountry" value={formData.permanentCountry} onChange={handleChange} className={inputCls} />
                </Field>
              </div>
            )}
          </Section>

          <Section id="family" number="03" icon={Users} title="Family / guardian">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Father's name" required>
                <input name="fatherName" value={formData.fatherName} onChange={handleChange} className={inputCls} required />
              </Field>
              <Field label="Father's CNIC">
                <input name="fathernic" value={formData.fathernic} onChange={handleChange} className={inputCls} maxLength={13} placeholder="13 digits, no dashes" />
              </Field>
              <Field label="Father's profession">
                <select name="fathersProfession" value={formData.fathersProfession} onChange={handleChange} className={inputCls}>
                  <option value="">Select profession</option>
                  <option value="self_employed">Self Employed</option>
                  <option value="serving_armed_forces">Serving Armed Forces</option>
                  <option value="serving_civil_government">Serving Civil Government</option>
                  <option value="retd_civil_government">Retd Civil Government</option>
                  <option value="retd_armed_forces">Retd Armed Forces</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Mother's name">
                <input name="motherName" value={formData.motherName} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="Mother's CNIC">
                <input name="motherCnic" value={formData.motherCnic} onChange={handleChange} className={inputCls} maxLength={13} placeholder="13 digits, no dashes" />
              </Field>
              <Field label="Guardian phone">
                <input name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} className={inputCls} maxLength={11} placeholder="11 digits" />
              </Field>
              <Field label="Guardian status" required>
                <select name="guardianStatus" value={formData.guardianStatus} onChange={handleChange} className={inputCls} required>
                  <option value="">Select status</option>
                  <option value="alive">Alive</option>
                  <option value="deceased">Deceased</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Guardian designation">
                <input name="guardianDesignation" value={formData.guardianDesignation} onChange={handleChange} className={inputCls} />
              </Field>
              <Field label="Income bracket">
                <select name="incomeBracket" value={formData.incomeBracket} onChange={handleChange} className={inputCls}>
                  <option value="">Select income bracket</option>
                  <option value="less_than_40000">Less than 40,000</option>
                  <option value="40000_to_100000">40,000 - 100,000</option>
                  <option value="above_100000">Above 100,000</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section id="program" number="04" icon={GraduationCap} title="Program & session">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Class" required>
                <select name="academicDepartment" value={formData.academicDepartment} onChange={handleChange} className={inputCls} required>
                  <option value="">Select class</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Program" required>
                <select name="applyingForProgram" value={formData.applyingForProgram} onChange={handleChange} className={inputCls} required>
                  <option value="">Select program</option>
                  {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Session" required>
                <select name="applyingSession" value={formData.applyingSession} onChange={handleChange} className={inputCls} required>
                  <option value="">Select session</option>
                  {terms.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          <Section
            id="education"
            number="05"
            icon={BookOpen}
            title="Education history"
            description="Optional. Leave a row empty to skip it — if you fill any field, Qualification and Start date are required."
          >
            <div className="space-y-3">
              {educationDetails.map((row, i) => (
                <div key={i} className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <Field label="Qualification" className="col-span-2 md:col-span-2">
                      <input placeholder="e.g. FSc Pre-Engineering" value={row.educationProgram} onChange={(e) => updateEducationRow(i, "educationProgram", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Institution" className="col-span-2 md:col-span-2">
                      <input value={row.institution} onChange={(e) => updateEducationRow(i, "institution", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Board" className="col-span-2 md:col-span-2">
                      <input value={row.board} onChange={(e) => updateEducationRow(i, "board", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Start date" className="md:col-span-2">
                      <input type="date" value={row.startDate} onChange={(e) => updateEducationRow(i, "startDate", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Obtained marks">
                      <input type="number" value={row.obtainedMarks} onChange={(e) => updateEducationRow(i, "obtainedMarks", e.target.value)} className={inputCls} />
                    </Field>
                    <Field label="Total marks">
                      <input type="number" value={row.totalMarks} onChange={(e) => updateEducationRow(i, "totalMarks", e.target.value)} className={inputCls} />
                    </Field>
                    <div className="col-span-2 md:col-span-6 flex justify-end -mb-1">
                      <button type="button" onClick={() => removeEducationRow(i)} className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700">
                        <Trash2 size={13} /> Remove row
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addEducationRow}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 ring-1 ring-indigo-200"
            >
              <Plus size={14} /> Add education row
            </button>
          </Section>

          <Section id="remark" number="06" icon={StickyNote} title="Admission remark" description="Shown and editable on every other Admission Process tab.">
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleChange}
              rows="3"
              placeholder="e.g. walk-in registration, documents verified in person"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
            />
          </Section>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 bg-white/90 backdrop-blur border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
                <span>Required fields</span>
                <span>
                  {totals.done} of {totals.total}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-md">
                <div
                  className={`h-full rounded-full transition-all ${totals.done === totals.total ? "bg-emerald-500" : "bg-indigo-500"}`}
                  style={{ width: `${(totals.done / totals.total) * 100}%` }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              {isLoading ? "Registering…" : "Register admission"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ManualAdmissionView;
