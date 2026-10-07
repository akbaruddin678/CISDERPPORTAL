import { useEffect, useMemo, useState } from "react";
import { useGetTermsQuery } from "../../../components/catalog/api/catalogApi";
import { useGetExamScheduleForHodQuery } from "../api/examCoordinationApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "TBD";

const useExamCoordinationController = () => {
  const [termId, setTermId] = useState("");

  const { data: termsRes } = useGetTermsQuery();
  const terms = extractArray(termsRes);

  useEffect(() => {
    if (terms.length > 0 && !termId) {
      const active = terms.find((t) => t.status) || terms[0];
      if (active) setTermId(active._id);
    }
  }, [terms, termId]);

  const { data: examsRes, isFetching } = useGetExamScheduleForHodQuery(
    { termId },
    { skip: !termId, refetchOnMountOrArgChange: true },
  );
  const exams = useMemo(() => extractArray(examsRes), [examsRes]);

  const stats = useMemo(() => {
    const now = Date.now();
    const weekAhead = now + 7 * 24 * 60 * 60 * 1000;
    const programs = new Set(exams.map((e) => e.programId?.name).filter(Boolean));
    const thisWeek = exams.filter((e) => {
      const t = e.date ? new Date(e.date).getTime() : null;
      return t && t >= now && t <= weekAhead;
    });
    return {
      total: exams.length,
      thisWeek: thisWeek.length,
      programs: programs.size,
    };
  }, [exams]);

  const groupedByProgram = useMemo(() => {
    const groups = {};
    exams.forEach((e) => {
      const key = e.programId?.name || "Unassigned Program";
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([programName, list]) => ({ programName, exams: list }));
  }, [exams]);

  const sessionName = terms.find((t) => t._id === termId)?.name || "Session";

  const handlePrint = () => {
    if (exams.length === 0) return;
    const rows = exams
      .map(
        (e) => `
        <tr>
          <td>${e.courseId?.code || ""} - ${e.courseId?.title || ""}</td>
          <td>${e.programId?.name || ""}</td>
          <td>Semester ${e.semesterId?.number ?? "?"}</td>
          <td>${e.type}</td>
          <td>${formatDate(e.date)}</td>
          <td>${e.startTime || "TBD"}</td>
        </tr>`,
      )
      .join("");
    const html = `
      <html><head><title>Exam Schedule - ${sessionName}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;}
        h1{font-size:18px;margin-bottom:4px;}
        p{color:#555;margin-top:0;}
        table{width:100%;border-collapse:collapse;margin-top:16px;}
        th,td{border:1px solid #ccc;padding:6px 10px;font-size:12px;text-align:left;}
        th{background:#0f172a;color:#fff;}
      </style></head><body>
      <h1>Department Exam Schedule</h1>
      <p>Session: ${sessionName}</p>
      <table>
        <thead><tr><th>Course</th><th>Program</th><th>Semester</th><th>Type</th><th>Date</th><th>Time</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  };

  return {
    terms,
    termId,
    setTermId,
    isFetching,
    stats,
    groupedByProgram,
    totalExams: exams.length,
    handlePrint,
  };
};

export default useExamCoordinationController;
