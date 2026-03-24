import React from "react";
import { useSelector } from "react-redux";
import {
  CalendarDays,
  Clock,
  Hourglass,
  BookOpen,
  Loader2,
  AlertCircle,
  Printer,
  Download,
} from "lucide-react";
import { useGetMyDateSheetQuery } from "./academicApi";

const DatesheetView = () => {
  // Fetch user data from Redux for the slip details
  const user = useSelector((state) => state.auth.user);

  const { data: datesheetRes, isLoading, isError } = useGetMyDateSheetQuery();
  const exams = datesheetRes?.data || [];

  // =========================================================
  // PRINT / DOWNLOAD EXAM SLIP LOGIC
  // =========================================================
  const handlePrintSlip = () => {
    if (!exams || exams.length === 0) return;

    // 1. Assets & Formatting
    const logoUrl = window.location.origin + "/nei - Edited.png"; // Adjust to your actual logo path

    const formatDate = (dateString) => {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    // 2. Generate Exam Rows
    let examRowsHTML = "";
    exams.forEach((exam, index) => {
      examRowsHTML += `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td><strong>${exam.courseId?.code || "-"}</strong></td>
          <td>${exam.courseId?.title || "-"}</td>
          <td>${formatDate(exam.date)}</td>
          <td>${exam.startTime || "TBA"}</td>
          <td>${exam.type}</td>
          <td></td> </tr>
      `;
    });

    // 3. HTML Construction for the Official Slip
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Exam Slip - ${user?.rollNumber || "Student"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
          
          @media print {
            @page { size: A4 portrait; margin: 15mm; }
            body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
          }
          
          body { padding: 20px; background: #f0f0f0; }
          .slip-container { max-w-4xl; margin: 0 auto; background: white; padding: 30px; border: 1px solid #ccc; }
          
          .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
          .logo-box { width: 80px; height: 80px; }
          .logo-box img { width: 100%; height: 100%; object-fit: contain; }
          .uni-titles { text-align: center; flex: 1; }
          .uni-name { font-size: 24px; font-weight: 900; color: #1e3a8a; letter-spacing: 1px; text-transform: uppercase; }
          .doc-title { font-size: 16px; font-weight: bold; margin-top: 5px; background: #1e3a8a; color: white; display: inline-block; padding: 4px 15px; border-radius: 4px; }
          
          .student-info { display: flex; justify-content: space-between; margin-bottom: 25px; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; background: #f8fafc; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 40px; width: 100%; }
          .info-item { font-size: 13px; }
          .info-label { font-weight: bold; color: #64748b; text-transform: uppercase; font-size: 11px; }
          .info-value { font-weight: bold; color: #0f172a; font-size: 14px; margin-top: 2px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 2px;}
          
          .photo-box { width: 100px; height: 120px; border: 2px solid #cbd5e1; margin-left: 20px; display: flex; align-items: center; justify-content: center; background: white; flex-shrink: 0;}
          .photo-box img { width: 100%; height: 100%; object-fit: cover; }
          .photo-placeholder { font-size: 10px; color: #94a3b8; text-align: center; }

          .table-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #1e3a8a; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background-color: #f1f5f9; color: #334155; font-weight: bold; text-transform: uppercase; font-size: 11px; }
          .text-center { text-align: center; }
          
          .instructions { border: 1px solid #f87171; background: #fef2f2; padding: 15px; border-radius: 8px; font-size: 11px; color: #991b1b; }
          .instructions h4 { font-size: 13px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; }
          .instructions ul { padding-left: 20px; }
          .instructions li { margin-bottom: 4px; }

          .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; }
          .sig-line { text-align: center; width: 200px; }
          .line { border-top: 1px solid #000; margin-bottom: 5px; }
          .sig-title { font-size: 11px; font-weight: bold; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="slip-container">
          <div class="header">
            <div class="logo-box">
              <img src="${logoUrl}" alt="NEI Logo" onerror="this.style.display='none'"/>
            </div>
            <div class="uni-titles">
              <div class="uni-name">National Excellence Institute</div>
              <div class="doc-title">EXAMINATION ROLL NUMBER SLIP</div>
            </div>
            <div class="logo-box"></div> </div>

          <div class="student-info">
            <div class="info-grid">
              <div class="info-item"><div class="info-label">Student Name</div><div class="info-value">${user?.name || "N/A"}</div></div>
              <div class="info-item"><div class="info-label">Roll Number</div><div class="info-value">${user?.rollNumber || "N/A"}</div></div>
              <div class="info-item"><div class="info-label">Program</div><div class="info-value">${user?.program || "N/A"}</div></div>
              <div class="info-item"><div class="info-label">Term / Session</div><div class="info-value">Current Academic Term</div></div>
            </div>
            <div class="photo-box">
              ${user?.profilePhoto ? `<img src="${user.profilePhoto}" alt="Photo" />` : `<div class="photo-placeholder">Paste<br/>Photograph<br/>Here</div>`}
            </div>
          </div>

          <div class="table-title">Scheduled Examinations</div>
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 40px;">Sr</th>
                <th style="width: 90px;">Course Code</th>
                <th>Course Title</th>
                <th style="width: 90px;">Date</th>
                <th style="width: 80px;">Time</th>
                <th style="width: 90px;">Type</th>
                <th style="width: 80px;">Invigilator Sign</th>
              </tr>
            </thead>
            <tbody>
              ${examRowsHTML}
            </tbody>
          </table>

          <div class="instructions">
            <h4>Important Instructions for Candidates</h4>
            <ul>
              <li>Students must bring this Roll Number Slip and their original University ID Card to the examination hall.</li>
              <li>Mobile phones, smartwatches, and programmable calculators are strictly prohibited inside the examination center.</li>
              <li>Candidates must report to the examination hall at least 15 minutes before the scheduled start time.</li>
              <li>No student will be allowed to enter the hall 30 minutes after the commencement of the exam.</li>
              <li>Any candidate found using unfair means (UFM) will face strict disciplinary action.</li>
            </ul>
          </div>

          <div class="signatures">
            <div class="sig-line">
              <div class="line"></div>
              <div class="sig-title">Candidate's Signature</div>
            </div>
            <div class="sig-line">
              <div class="line"></div>
              <div class="sig-title">Controller of Examinations</div>
            </div>
          </div>
        </div>
        
        <script>
          // Auto trigger print when loaded
          setTimeout(function() { window.print(); }, 800);
        </script>
      </body>
      </html>
    `;

    // 4. Open and Print
    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // =========================================================
  // MAIN COMPONENT UI
  // =========================================================

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Loader2 className="animate-spin mb-4 text-blue-600" size={40} />
        <p className="font-medium text-lg">Loading your exam schedule...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10 text-center text-red-500 font-bold">
        Failed to load date sheet. Please try again later.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header with Download Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Date Sheet
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Your upcoming quizzes, mid-terms, and final exams.
          </p>
        </div>

        {/* ✅ NEW: Print/Download Button */}
        {exams.length > 0 && (
          <button
            onClick={handlePrintSlip}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm transition-colors"
          >
            <Printer size={18} />
            <span className="hidden sm:inline">Print Roll No Slip</span>
            <span className="sm:hidden">Print Slip</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      {exams.length === 0 ? (
        <div className="bg-white border border-slate-200 p-16 rounded-3xl text-center shadow-sm">
          <CalendarDays
            className="mx-auto mb-4 text-slate-300"
            size={64}
            strokeWidth={1.5}
          />
          <h3 className="text-xl font-bold text-slate-900">
            No Exams Scheduled
          </h3>
          <p className="text-slate-500 mt-2 font-medium">
            Your date sheet has not been published yet for this term.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => {
            const examDate = new Date(exam.date);
            const isPast = examDate < new Date();

            return (
              <div
                key={exam._id}
                className={`flex flex-col md:flex-row bg-white rounded-2xl border ${isPast ? "border-slate-200 opacity-70" : "border-blue-100 shadow-sm hover:shadow-md"} transition-all overflow-hidden`}
              >
                {/* Date Block (Left Side) */}
                <div
                  className={`md:w-48 p-6 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-slate-100 ${isPast ? "bg-slate-50 text-slate-500" : "bg-blue-50/50 text-blue-700"}`}
                >
                  <span className="text-sm font-bold uppercase tracking-widest">
                    {examDate.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className="text-4xl font-black my-1">
                    {examDate.getDate()}
                  </span>
                  <span className="text-sm font-bold uppercase tracking-widest">
                    {examDate.toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Exam Details (Right Side) */}
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md mb-2 inline-block ${
                          exam.type === "Final Exam"
                            ? "bg-red-100 text-red-700"
                            : exam.type === "Mid Term"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {exam.type}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900">
                        {exam.courseId?.title}
                      </h3>
                      <p className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                        <BookOpen size={16} /> {exam.courseId?.code}
                      </p>
                    </div>

                    {isPast && (
                      <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <AlertCircle size={14} /> Conducted
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-6 text-sm font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="text-blue-500" size={18} />
                      {exam.startTime || "TBA"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Hourglass className="text-blue-500" size={18} />
                      {exam.duration} mins
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 border border-slate-300">
                        #
                      </div>
                      {exam.totalMarks} Marks
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DatesheetView;
