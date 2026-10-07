import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  useGetAllStudentsQuery,
  useGetStudentDetailsQuery,
} from "../api/registrarStudentApi";

export const useStudentDirectoryController = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const { data, isFetching, refetch } = useGetAllStudentsQuery({
    page,
    limit: 20,
    search: searchQuery,
  });
  const students = useMemo(() => data?.data?.students || [], [data]);
  const pagination = data?.data?.pagination || { page: 1, pages: 1, total: 0 };

  const { data: detailsRes, isFetching: isFetchingDetails } = useGetStudentDetailsQuery(
    selectedId,
    { skip: !selectedId },
  );
  const selectedStudent = detailsRes?.data?.student || null;

  const handleViewStudent = (student) => setSelectedId(student._id);
  const handleCloseModal = () => setSelectedId(null);

  const printDirectory = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.text("Student Master Directory", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [["Reg. ID", "Name", "Program", "Semester", "Session", "Status"]],
      body: students.map((s) => [
        s.studentId,
        s.personalInfo?.fullName || "N/A",
        s.program?.name || "N/A",
        s.semester?.number ? `Semester ${s.semester.number}` : "N/A",
        s.session?.name || "N/A",
        s.status,
      ]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    });
    doc.save(`Student_Directory_Page${page}.pdf`);
  };

  const printStudentDetail = (student) => {
    if (!student) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.text("Student Record", 14, 18);
    doc.setFontSize(11);
    const rows = [
      ["Registration ID", student.studentId],
      ["Name", student.personalInfo?.fullName || "N/A"],
      ["Email", student.personalInfo?.email || "N/A"],
      ["Phone", student.personalInfo?.phone || "N/A"],
      ["Department", student.department?.name || "N/A"],
      ["Program", student.program?.name || "N/A"],
      ["Semester", student.semester?.number ? `Semester ${student.semester.number}` : "N/A"],
      ["Session", student.session?.name || "N/A"],
      ["Status", student.status],
    ];
    autoTable(doc, {
      startY: 26,
      body: rows,
      theme: "plain",
      styles: { fontSize: 11 },
    });
    doc.save(`${student.studentId}_Record.pdf`);
  };

  return {
    students,
    isLoading: isFetching,
    searchQuery,
    setSearchQuery: (q) => {
      setSearchQuery(q);
      setPage(1);
    },
    refetch,
    page,
    setPage,
    pagination,

    selectedStudent,
    isFetchingDetails,
    isModalOpen: Boolean(selectedId),
    handleViewStudent,
    handleCloseModal,

    printDirectory,
    printStudentDetail,
  };
};
