import React, { useState, useMemo } from "react";
import {
  Modal,
  FormField,
  PrimaryBtn,
  SecondaryBtn,
  inputStyle,
  selectStyle,
  fmt,
} from "../../../common/Hostelshared";
import { Search, X, CheckCircle } from "lucide-react";

const HOSTELS = [
  "Boys Hostel Block A",
  "Boys Hostel Block B",
  "Girls Hostel Block A",
  "Girls Hostel Block B",
  "International Students Hostel",
];

// Calculate default due date (10 days from now)
const defaultDueDate = new Date();
defaultDueDate.setDate(defaultDueDate.getDate() + 10);

const INITIAL = {
  studentId: "",
  hostelName: "",
  roomNumber: "",
  monthlyRent: "",
  admissionFee: "",
  securityDeposit: "",
  admissionDate: new Date().toISOString().split("T")[0],
  dueDate: defaultDueDate.toISOString().split("T")[0], // ✅ Added Due Date State
  targetMonth: new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  }),
};

// Helper for Month Datalist
const generateMonthOptions = () => {
  const opts = [];
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  for (let i = 0; i < 12; i++) {
    opts.push(d.toLocaleString("default", { month: "long", year: "numeric" }));
    d.setMonth(d.getMonth() + 1);
  }
  return opts;
};

export default function AssignHostelModal({
  onClose,
  onSuccess,
  students,
  studentsLoading,
  onAssign,
  assignLoading,
}) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const [studentSearch, setStudentSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [progFilter, setProgFilter] = useState("");
  const [semFilter, setSemFilter] = useState("");
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const { departments, programs, semesters } = useMemo(() => {
    const deptMap = {},
      progMap = {},
      semMap = {};
    students.forEach((s) => {
      const d = s.departmentId;
      const p = s.programId;
      const sm = s.semesterId;
      if (d?._id) deptMap[d._id] = d.name || d._id;
      if (p?._id) progMap[p._id] = p.name || p._id;
      if (sm?._id) semMap[sm._id] = sm.name || sm.number || sm._id;
    });
    return {
      departments: Object.entries(deptMap),
      programs: Object.entries(progMap),
      semesters: Object.entries(semMap),
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const name = s.personalInfo?.fullName?.toLowerCase() ?? "";
      const id = (s.studentId ?? "").toLowerCase();
      const search = studentSearch.toLowerCase();
      if (search && !name.includes(search) && !id.includes(search))
        return false;
      if (deptFilter && s.departmentId?._id !== deptFilter) return false;
      if (progFilter && s.programId?._id !== progFilter) return false;
      if (semFilter && s.semesterId?._id !== semFilter) return false;
      return true;
    });
  }, [students, studentSearch, deptFilter, progFilter, semFilter]);

  const selectedStudent = useMemo(
    () => students.find((s) => s._id === form.studentId),
    [students, form.studentId],
  );

  const validate = () => {
    const e = {};
    if (!form.studentId) e.studentId = "Select a student";
    if (!form.hostelName) e.hostelName = "Select a hostel";
    if (!(form.roomNumber || "").trim()) e.roomNumber = "Enter room number";
    if (!form.monthlyRent || isNaN(form.monthlyRent) || +form.monthlyRent <= 0)
      e.monthlyRent = "Enter valid monthly rent";
    if (
      !form.admissionFee ||
      isNaN(form.admissionFee) ||
      +form.admissionFee < 0
    )
      e.admissionFee = "Enter valid admission fee";
    if (
      !form.securityDeposit ||
      isNaN(form.securityDeposit) ||
      +form.securityDeposit < 0
    )
      e.securityDeposit = "Enter valid security deposit";
    if (!form.admissionDate) e.admissionDate = "Select admission date";
    if (!form.dueDate) e.dueDate = "Select due date"; // ✅ Validate Due Date
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setApiError("");
    try {
      await onAssign({
        studentId: form.studentId,
        hostelName: form.hostelName,
        roomNumber: form.roomNumber.trim().toUpperCase(),
        monthlyRent: +form.monthlyRent,
        admissionFee: +form.admissionFee,
        securityDeposit: +form.securityDeposit,
        admissionDate: form.admissionDate,
        targetMonth: form.targetMonth,
        dueDate: form.dueDate, // ✅ Send Due Date
      }).unwrap();
      onSuccess();
    } catch (err) {
      setApiError(
        err?.data?.message ?? "Failed to assign hostel. Please try again.",
      );
    }
  };

  const preview =
    +form.monthlyRent + +form.admissionFee + +form.securityDeposit;

  return (
    <Modal title="Assign Hostel Seat" onClose={onClose} width={640}>
      <div
        style={{
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* ── Step 1: Student Selection ── */}
        <div
          style={{
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              background: "#F8FAFC",
              borderBottom: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#374151",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              1 — Select Student
            </span>
            {errors.studentId && (
              <span style={{ fontSize: 11, color: "#EF4444" }}>
                {errors.studentId}
              </span>
            )}
          </div>

          {selectedStudent ? (
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#F0FDF4",
                borderBottom: "1px solid #BBF7D0",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#DCFCE7",
                  color: "#166534",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {selectedStudent.personalInfo?.fullName?.charAt(0) ?? "?"}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontWeight: 700, fontSize: 13, color: "#166534" }}
                >
                  {selectedStudent.personalInfo?.fullName}
                </div>
                <div style={{ fontSize: 11, color: "#4ADE80" }}>
                  {selectedStudent.studentId} ·{" "}
                  {selectedStudent.programId?.name ?? "—"} ·{" "}
                  {selectedStudent.semesterId?.name ?? "—"}
                </div>
              </div>
              <button
                onClick={() => {
                  set("studentId", "");
                  setStudentPickerOpen(true);
                }}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid #86EFAC",
                  background: "#fff",
                  color: "#16A34A",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <div style={{ padding: "12px 16px" }}>
              <button
                onClick={() => setStudentPickerOpen((o) => !o)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: `1px solid ${errors.studentId ? "#EF4444" : "#E2E8F0"}`,
                  background: "#F8FAFC",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#94A3B8",
                  fontSize: 13,
                }}
              >
                <Search size={15} />
                {studentsLoading
                  ? "Loading students…"
                  : "Click to search and select a student…"}
              </button>
            </div>
          )}

          {studentPickerOpen && (
            <div style={{ borderTop: "1px solid #F1F5F9" }}>
              <div
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  background: "#FAFAFA",
                  borderBottom: "1px solid #F1F5F9",
                }}
              >
                <div style={{ position: "relative", flex: "1 1 180px" }}>
                  <Search
                    size={13}
                    style={{
                      position: "absolute",
                      left: 9,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94A3B8",
                    }}
                  />
                  <input
                    autoFocus
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search by name or ID…"
                    style={{
                      ...inputStyle,
                      height: 34,
                      paddingLeft: 30,
                      fontSize: 12,
                    }}
                  />
                </div>
                <select
                  value={deptFilter}
                  onChange={(e) => {
                    setDeptFilter(e.target.value);
                    setProgFilter("");
                    setSemFilter("");
                  }}
                  style={{
                    ...selectStyle,
                    height: 34,
                    fontSize: 12,
                    flex: "1 1 140px",
                  }}
                >
                  <option value="">All Depts</option>
                  {departments.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={progFilter}
                  onChange={(e) => {
                    setProgFilter(e.target.value);
                    setSemFilter("");
                  }}
                  style={{
                    ...selectStyle,
                    height: 34,
                    fontSize: 12,
                    flex: "1 1 140px",
                  }}
                  disabled={!deptFilter}
                >
                  <option value="">All Programs</option>
                  {programs.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={semFilter}
                  onChange={(e) => setSemFilter(e.target.value)}
                  style={{
                    ...selectStyle,
                    height: 34,
                    fontSize: 12,
                    flex: "1 1 120px",
                  }}
                  disabled={!progFilter}
                >
                  <option value="">All Sems</option>
                  {semesters.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                {(studentSearch || deptFilter || progFilter || semFilter) && (
                  <button
                    onClick={() => {
                      setStudentSearch("");
                      setDeptFilter("");
                      setProgFilter("");
                      setSemFilter("");
                    }}
                    style={{
                      height: 34,
                      padding: "0 10px",
                      borderRadius: 6,
                      border: "1px solid #E2E8F0",
                      background: "#fff",
                      cursor: "pointer",
                      color: "#64748B",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <X size={12} /> Clear
                  </button>
                )}
              </div>

              <div style={{ maxHeight: 220, overflowY: "auto" }}>
                {filteredStudents.length === 0 ? (
                  <div
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "#94A3B8",
                      fontSize: 13,
                    }}
                  >
                    No students found. Try adjusting your filters.
                  </div>
                ) : (
                  filteredStudents.map((s) => {
                    const name = s.personalInfo?.fullName ?? "Unknown";
                    const regNo = s.studentId ?? "—";
                    const prog = s.programId?.name ?? "—";
                    const sem =
                      s.semesterId?.name ?? s.semesterId?.number ?? "—";
                    const dept = s.departmentId?.name ?? "—";
                    return (
                      <label
                        key={s._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 16px",
                          cursor: "pointer",
                          borderBottom: "1px solid #F8FAFC",
                          background:
                            form.studentId === s._id
                              ? "#EEF2FF"
                              : "transparent",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          if (form.studentId !== s._id)
                            e.currentTarget.style.background = "#F8FAFC";
                        }}
                        onMouseLeave={(e) => {
                          if (form.studentId !== s._id)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#EEF2FF",
                            color: "#4338CA",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: "#0F172A",
                            }}
                          >
                            {name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#94A3B8",
                              marginTop: 1,
                            }}
                          >
                            {regNo} · {prog} · Section {sem} · {dept}
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="studentPick"
                          checked={form.studentId === s._id}
                          onChange={() => {
                            set("studentId", s._id);
                            setStudentPickerOpen(false);
                          }}
                          style={{ cursor: "pointer", accentColor: "#4F46E5" }}
                        />
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Step 2: Hostel & Room ── */}
        <div
          style={{
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              background: "#F8FAFC",
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#374151",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              2 — Hostel &amp; Room
            </span>
          </div>
          <div
            style={{
              padding: 16,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <FormField label="Hostel" required error={errors.hostelName}>
              <select
                value={form.hostelName}
                onChange={(e) => set("hostelName", e.target.value)}
                style={{
                  ...selectStyle,
                  borderColor: errors.hostelName ? "#EF4444" : "#E2E8F0",
                }}
              >
                <option value="">— Select hostel —</option>
                {HOSTELS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Room Number" required error={errors.roomNumber}>
              <input
                value={form.roomNumber}
                onChange={(e) => set("roomNumber", e.target.value)}
                placeholder="e.g. A-204"
                style={{
                  ...inputStyle,
                  borderColor: errors.roomNumber ? "#EF4444" : "#E2E8F0",
                }}
              />
            </FormField>
          </div>
        </div>

        {/* ── Step 3: Fee Details ── */}
        <div
          style={{
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              background: "#F8FAFC",
              borderBottom: "1px solid #F1F5F9",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#374151",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              3 — Fee Details
            </span>
          </div>
          <div style={{ padding: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 14,
              }}
            >
              <FormField
                label="Monthly Rent (PKR)"
                required
                error={errors.monthlyRent}
              >
                <input
                  type="number"
                  min="0"
                  value={form.monthlyRent}
                  onChange={(e) => set("monthlyRent", e.target.value)}
                  placeholder="0"
                  style={{
                    ...inputStyle,
                    borderColor: errors.monthlyRent ? "#EF4444" : "#E2E8F0",
                  }}
                />
              </FormField>
              <FormField
                label="Admission Fee (PKR)"
                required
                error={errors.admissionFee}
                hint="One-time"
              >
                <input
                  type="number"
                  min="0"
                  value={form.admissionFee}
                  onChange={(e) => set("admissionFee", e.target.value)}
                  placeholder="0"
                  style={{
                    ...inputStyle,
                    borderColor: errors.admissionFee ? "#EF4444" : "#E2E8F0",
                  }}
                />
              </FormField>
              <FormField
                label="Security Deposit (PKR)"
                required
                error={errors.securityDeposit}
                hint="Refundable"
              >
                <input
                  type="number"
                  min="0"
                  value={form.securityDeposit}
                  onChange={(e) => set("securityDeposit", e.target.value)}
                  placeholder="0"
                  style={{
                    ...inputStyle,
                    borderColor: errors.securityDeposit ? "#EF4444" : "#E2E8F0",
                  }}
                />
              </FormField>
            </div>
            {preview > 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  background: "#EEF2FF",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <span
                    style={{ fontSize: 12, color: "#4338CA", fontWeight: 600 }}
                  >
                    First Challan Total
                  </span>
                  <span
                    style={{ fontSize: 11, color: "#818CF8", marginLeft: 8 }}
                  >
                    Rent + Admission + Deposit
                  </span>
                </div>
                <span
                  style={{ fontSize: 16, fontWeight: 700, color: "#4338CA" }}
                >
                  {fmt(preview)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Step 4: Dates ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 14,
          }}
        >
          <FormField
            label="Admission Date"
            required
            error={errors.admissionDate}
          >
            <input
              type="date"
              value={form.admissionDate}
              onChange={(e) => set("admissionDate", e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.admissionDate ? "#EF4444" : "#E2E8F0",
              }}
            />
          </FormField>

          {/* ✅ Due Date Field added */}
          <FormField label="Due Date" required error={errors.dueDate}>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              style={{
                ...inputStyle,
                borderColor: errors.dueDate ? "#EF4444" : "#E2E8F0",
              }}
            />
          </FormField>

          <FormField label="For Month" hint="Ref in remarks">
            <input
              list="assign-month-opts"
              value={form.targetMonth}
              onChange={(e) => set("targetMonth", e.target.value)}
              placeholder="e.g. January 2025"
              style={inputStyle}
            />
            <datalist id="assign-month-opts">
              {generateMonthOptions().map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </FormField>
        </div>

        {apiError && (
          <div
            style={{
              background: "#FFF1F2",
              border: "1px solid #FECDD3",
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: "#E11D48",
            }}
          >
            ⚠ {apiError}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            paddingTop: 6,
            borderTop: "1px solid #F1F5F9",
          }}
        >
          <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
          <PrimaryBtn onClick={handleSubmit} loading={assignLoading}>
            Assign &amp; Generate Challan
          </PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}
