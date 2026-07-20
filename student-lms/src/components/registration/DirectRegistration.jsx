import React, { useState, useEffect } from "react";
import {
  UserPlus,
  FileSpreadsheet,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  DownloadCloud,
  Database,
} from "lucide-react";
import * as XLSX from "xlsx";
import { BASE_URL } from "../../services/baseApi";

const DirectRegistration = () => {
  const [activeTab, setActiveTab] = useState("single");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCatalogs, setIsFetchingCatalogs] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "", details: [] });

  // --- DYNAMIC DROPDOWN STATE ---
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [terms, setTerms] = useState([]);
  const [semesters, setSemesters] = useState([]);

  // --- FETCH CATALOGS FROM BACKEND ON LOAD ---
  useEffect(() => {
    const fetchCatalogs = async () => {
      setIsFetchingCatalogs(true);
      try {
        const [deptRes, progRes, termRes, semRes] = await Promise.all([
          fetch(`${BASE_URL}/catalog/departments`),
          fetch(`${BASE_URL}/catalog/programs`),
          fetch(`${BASE_URL}/catalog/terms`),
          fetch(`${BASE_URL}/catalog/semesters`),
        ]);

        if (deptRes.ok) {
          const deptData = await deptRes.json();
          setDepartments(deptData.data || deptData || []);
        }
        if (progRes.ok) {
          const progData = await progRes.json();
          setPrograms(progData.data || progData || []);
        }
        if (termRes.ok) {
          const termData = await termRes.json();
          setTerms(termData.data || termData || []);
        }
        if (semRes.ok) {
          const semData = await semRes.json();
          setSemesters(semData.data || semData || []);
        }
      } catch (error) {
        console.error("Failed to fetch catalogs from backend:", error);
      } finally {
        setIsFetchingCatalogs(false);
      }
    };

    fetchCatalogs();
  }, []);

  // --- SINGLE REGISTRATION STATE ---
  const [singleForm, setSingleForm] = useState({
    fullName: "",
    email: "",
    cnic: "",
    dob: "",
    phone: "",
    gender: "",
    fatherName: "",
    departmentCode: "",
    programCode: "",
    termName: "",
    semesterNumber: "",
  });

  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);

  // --- 1. DOWNLOAD EXCEL TEMPLATE HANDLER ---
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        FullName: "John Doe",
        Email: "john.doe@student.edu",
        Phone: "03001234567",
        Gender: "male",
        FatherName: "Richard Doe",
        CNIC: "1234512345671",
        DOB: "2000-01-01",
        DepartmentCode: departments.length > 0 ? departments[0].code : "CS",
        ProgramCode: programs.length > 0 ? programs[0].code : "BSCS",
        TermName: terms.length > 0 ? terms[0].name || terms[0] : "Fall 2024",
        SemesterNumber:
          semesters.length > 0 ? semesters[0].number || semesters[0] : 1,
      },
    ];
    const wsData = XLSX.utils.json_to_sheet(templateData);
    wsData["!cols"] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, "Student Data Entry");
    XLSX.writeFile(wb, "NEI_Bulk_Registration_Template.xlsx");
  };

  // --- 2. DOWNLOAD REFERENCE DATA HANDLER (NEW) ---
  const handleDownloadReferenceData = () => {
    const genders = ["male", "female", "other"];
    const maxLength = Math.max(
      departments.length,
      programs.length,
      terms.length,
      semesters.length,
      genders.length,
      8,
    ); // 8 is fallback for semesters

    const referenceData = [];

    for (let i = 0; i < maxLength; i++) {
      referenceData.push({
        "Valid Departments (Use Code)": departments[i]
          ? `${departments[i].name} (Code: ${departments[i].code})`
          : "",
        "Valid Programs (Use Code)": programs[i]
          ? `${programs[i].name} (Code: ${programs[i].code})`
          : "",
        "Valid Term / Session Names": terms[i] ? terms[i].name || terms[i] : "",
        "Valid Semesters": semesters[i]
          ? semesters[i].number || semesters[i]
          : semesters.length === 0 && i < 8
            ? i + 1
            : "",
        "Valid Genders": genders[i] || "",
      });
    }

    const wsRef = XLSX.utils.json_to_sheet(referenceData);
    wsRef["!cols"] = [
      { wch: 45 },
      { wch: 45 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsRef, "Reference Data & Codes");
    XLSX.writeFile(wb, "NEI_Reference_Data.xlsx");
  };

  // --- SINGLE HANDLER ---
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "", type: "", details: [] });

    const payload = {
      personalInfo: {
        fullName: singleForm.fullName,
        email: singleForm.email,
        cnic: singleForm.cnic,
        dob: singleForm.dob,
        phone: singleForm.phone,
        gender: singleForm.gender,
      },
      familyInfo: {
        fatherName: singleForm.fatherName,
      },
      departmentCode: singleForm.departmentCode,
      programCode: singleForm.programCode,
      termName: singleForm.termName,
      semesterNumber: parseInt(singleForm.semesterNumber, 10),
    };

    try {
      const response = await fetch(`${BASE_URL}/student/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Registration failed");
      }

      setMessage({
        text: `Student registered successfully! Roll No: ${result.data.studentId}`,
        type: "success",
      });

      setSingleForm({
        fullName: "",
        email: "",
        cnic: "",
        dob: "",
        phone: "",
        gender: "",
        fatherName: "",
        departmentCode: "",
        programCode: "",
        termName: "",
        semesterNumber: "",
      });
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // --- BULK EXCEL HANDLERS ---
  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setMessage({ text: "", type: "", details: [] });

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setParsedData(data);
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleBulkSubmit = async () => {
    if (parsedData.length === 0) return;

    setIsLoading(true);
    setMessage({
      text: "Processing bulk registration on server...",
      type: "info",
    });

    const studentsArray = parsedData.map((row) => ({
      personalInfo: {
        fullName: row.FullName || row.fullName,
        email: row.Email || row.email,
        cnic: String(row.CNIC || row.cnic || ""),
        dob: row.DOB || row.dob,
        phone: String(row.Phone || row.phone || ""),
        gender: row.Gender || row.gender || "Not Specified",
      },
      familyInfo: {
        fatherName: row.FatherName || row.fatherName || "Unknown",
      },
      departmentCode: row.DepartmentCode || row.departmentCode,
      programCode: row.ProgramCode || row.programCode,
      termName: row.TermName || row.termName,
      semesterNumber: parseInt(row.SemesterNumber || row.semesterNumber, 10),
    }));

    try {
      const response = await fetch(`${BASE_URL}/student/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: studentsArray }),
      });

      const result = await response.json();

      // Catch actual server errors first
      if (!response.ok || result.success === false) {
        throw new Error(result.error || "Server processing failed");
      }

      // Check if it's a multi-row response
      if (result.results) {
        setMessage({
          text: `Batch Complete: ${result.results.success} Created, ${result.results.failed} Failed.`,
          type: result.results.failed > 0 ? "error" : "success",
          details: result.results.details,
        });
      }
      // Check if it's a single-row response (Backend returns 'data' instead of 'results' for 1 item)
      else if (result.data) {
        setMessage({
          text: `Batch Complete: 1 Created, 0 Failed. (Roll No: ${result.data.studentId})`,
          type: "success",
        });
      }
    } catch (err) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 flex justify-center">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900">
            Student Enrolment Portal
          </h1>
          <p className="text-slate-500 mt-2">
            Register students to automatically generate Roll Numbers and LMS
            accounts.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => setActiveTab("single")}
              className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                activeTab === "single"
                  ? "text-blue-600 bg-white border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <UserPlus size={18} /> Single Registration
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                activeTab === "bulk"
                  ? "text-blue-600 bg-white border-b-2 border-blue-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FileSpreadsheet size={18} /> Bulk Excel Upload
            </button>
          </div>

          <div className="p-6 sm:p-10">
            {/* Global Message Alert */}
            {message.text && (
              <div
                className={`mb-6 p-4 rounded-xl text-sm font-bold border ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : message.type === "error"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.type === "success" ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  <span>{message.text}</span>
                </div>
                {message.details &&
                  message.details.filter((d) => d.status === "Failed").length >
                    0 && (
                    <ul className="mt-3 ml-8 list-disc text-xs space-y-1 opacity-80 font-medium">
                      {message.details
                        .filter((d) => d.status === "Failed")
                        .slice(0, 5)
                        .map((d, i) => (
                          <li key={i}>
                            {d.name || "Unknown"}: {d.error}
                          </li>
                        ))}
                      {message.details.filter((d) => d.status === "Failed")
                        .length > 5 && <li>...and more</li>}
                    </ul>
                  )}
              </div>
            )}

            {/* --- SINGLE TAB --- */}
            {activeTab === "single" && (
              <form
                onSubmit={handleSingleSubmit}
                className="space-y-6 animate-in fade-in"
              >
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={singleForm.fullName}
                      onChange={(e) =>
                        setSingleForm({
                          ...singleForm,
                          fullName: e.target.value,
                        })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={singleForm.email}
                      onChange={(e) =>
                        setSingleForm({ ...singleForm, email: e.target.value })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={singleForm.phone}
                      onChange={(e) =>
                        setSingleForm({ ...singleForm, phone: e.target.value })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Gender
                    </label>
                    <select
                      required
                      value={singleForm.gender}
                      onChange={(e) =>
                        setSingleForm({ ...singleForm, gender: e.target.value })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="" disabled>
                        Select Gender
                      </option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      CNIC (without dashes)
                    </label>
                    <input
                      type="text"
                      required
                      value={singleForm.cnic}
                      onChange={(e) =>
                        setSingleForm({ ...singleForm, cnic: e.target.value })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      required
                      value={singleForm.dob}
                      onChange={(e) =>
                        setSingleForm({ ...singleForm, dob: e.target.value })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mt-8">
                  Family Information
                </h3>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      required
                      value={singleForm.fatherName}
                      onChange={(e) =>
                        setSingleForm({
                          ...singleForm,
                          fatherName: e.target.value,
                        })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter Father's Full Name"
                    />
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mt-8 flex justify-between items-center">
                  Academic Placement
                  {isFetchingCatalogs && (
                    <Loader2 className="animate-spin text-blue-500" size={16} />
                  )}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Department
                    </label>
                    <select
                      required
                      disabled={isFetchingCatalogs}
                      value={singleForm.departmentCode}
                      onChange={(e) =>
                        setSingleForm({
                          ...singleForm,
                          departmentCode: e.target.value,
                        })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                    >
                      <option value="" disabled>
                        Select Department
                      </option>
                      {departments.map((d) => (
                        <option key={d._id || d.code} value={d.code}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Program
                    </label>
                    <select
                      required
                      disabled={isFetchingCatalogs}
                      value={singleForm.programCode}
                      onChange={(e) =>
                        setSingleForm({
                          ...singleForm,
                          programCode: e.target.value,
                        })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                    >
                      <option value="" disabled>
                        Select Program
                      </option>
                      {programs.map((p) => (
                        <option key={p._id || p.code} value={p.code}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Session / Term Name
                    </label>
                    <select
                      required
                      disabled={isFetchingCatalogs}
                      value={singleForm.termName}
                      onChange={(e) =>
                        setSingleForm({
                          ...singleForm,
                          termName: e.target.value,
                        })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                    >
                      <option value="" disabled>
                        Select Session
                      </option>
                      {terms.map((t) => (
                        <option key={t._id || t.name} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      Semester
                    </label>
                    <select
                      required
                      disabled={isFetchingCatalogs}
                      value={singleForm.semesterNumber}
                      onChange={(e) =>
                        setSingleForm({
                          ...singleForm,
                          semesterNumber: e.target.value,
                        })
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                    >
                      <option value="" disabled>
                        Select Semester
                      </option>
                      {semesters.map((s) => (
                        <option key={s._id || s.number} value={s.number}>
                          Semester {s.number}
                        </option>
                      ))}
                      {semesters.length === 0 &&
                        !isFetchingCatalogs &&
                        [1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <option key={num} value={num}>
                            Semester {num}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isFetchingCatalogs}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />{" "}
                      Processing...
                    </>
                  ) : (
                    <>
                      <UserPlus size={20} /> Register & Generate Roll No
                    </>
                  )}
                </button>
              </form>
            )}

            {/* --- BULK TAB --- */}
            {activeTab === "bulk" && (
              <div className="animate-in fade-in space-y-6">
                {/* ✅ TWO DOWNLOAD BUTTONS */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-blue-50 p-5 rounded-2xl border border-blue-100 gap-4">
                  <div>
                    <h4 className="font-bold text-blue-900 mb-1">
                      Need the required format?
                    </h4>
                    <p className="text-sm text-blue-700">
                      Download the template and the reference codes to ensure
                      error-free uploads.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button
                      onClick={handleDownloadTemplate}
                      disabled={isFetchingCatalogs}
                      className="flex-1 sm:flex-none bg-white border-2 border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white font-bold py-2 px-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isFetchingCatalogs ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <DownloadCloud size={18} />
                      )}
                      Template
                    </button>
                    <button
                      onClick={handleDownloadReferenceData}
                      disabled={isFetchingCatalogs}
                      className="flex-1 sm:flex-none bg-blue-100 border-2 border-blue-300 text-blue-800 hover:bg-blue-200 font-bold py-2 px-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isFetchingCatalogs ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Database size={18} />
                      )}
                      Reference Codes
                    </button>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto text-slate-400 mb-3" size={40} />
                  <p className="text-slate-700 font-bold text-lg">
                    {file ? file.name : "Click or drag Excel file to upload"}
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    {parsedData.length > 0
                      ? `${parsedData.length} valid rows found`
                      : "Supports .xlsx, .csv"}
                  </p>
                </div>

                <button
                  onClick={handleBulkSubmit}
                  disabled={isLoading || parsedData.length === 0}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} /> Registering
                      Batch on Server...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet size={20} /> Auto-Register{" "}
                      {parsedData.length} Students
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectRegistration;
