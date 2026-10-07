import { useState, useMemo } from "react";
import { useGetChallansPaginatedQuery } from "../api/studentChallanApi";
import { useGetTermsQuery, useGetDepartmentsQuery } from "../api/depsemtermpro";
import * as XLSX from "xlsx";

export const useDepartmentChallanController = () => {
  const [filters, setFilters] = useState({
    termId: "",
    search: "",
    status: "",
  });

  const [expandedDept, setExpandedDept] = useState(null);

  // 1. FETCH ALL DATA (✅ Instruct backend to drop hostel records)
  const { data: challansRes, isLoading: isChallansLoading } =
    useGetChallansPaginatedQuery({
      limit: 50000,
      termId: filters.termId,
      search: filters.search,
      status: filters.status,
      excludeType: "hostel", // ✅ Backend filter
      // Hide students who haven't paid a single fee yet (new admissions
      // still sitting as Not Generated/Generated/Overdue) — this is a
      // department-wise report, not an action screen, so it shouldn't
      // show challans for students who aren't "active" yet.
      excludeUnactivated: true,
    });

  const { data: termsRes } = useGetTermsQuery();
  const { data: deptRes } = useGetDepartmentsQuery();

  const rawChallans = challansRes?.data?.challans || [];
  const terms = termsRes?.data || [];
  const departments = deptRes?.data || [];

  const deptMap = useMemo(
    () => new Map(departments.map((d) => [d._id.toString(), d.name])),
    [departments],
  );

  // 2. GROUP AND AGGREGATE
  const groupedData = useMemo(() => {
    if (!rawChallans.length) return [];

    const groups = {};

    // ✅ Double security: Strictly filter out any hostel challans on the frontend
    const validChallans = rawChallans.filter(
      (c) =>
        c.status !== "cancelled" &&
        !c.isDeleted &&
        !(c.challanType || "").toLowerCase().includes("hostel"),
    );

    validChallans.forEach((c) => {
      const deptIdRaw = c.departmentId?._id || c.departmentId;
      const deptId = deptIdRaw ? deptIdRaw.toString() : "unknown";

      const deptName =
        deptMap.get(deptId) || c.departmentId?.name || "Unknown Department";

      const sIdRaw = c.studentId?._id || c.studentId;
      const studentName = c.studentId?.personalInfo?.fullName || "Unknown";

      const fatherName =
        c.studentId?.familyInfo?.fatherName ||
        c.studentId?.personalInfo?.fatherName ||
        "N/A";

      const studentRollNo = c.studentId?.studentId || "N/A";
      const programName = c.programId?.name || "N/A";

      if (!groups[deptId]) {
        groups[deptId] = {
          departmentId: deptId,
          departmentName: deptName,
          totalChallans: 0,
          totalAmount: 0,
          collectedAmount: 0,
          pendingAmount: 0,
          uniqueStudents: new Set(),
          challansList: [],
        };
      }

      groups[deptId].totalChallans += 1;
      groups[deptId].totalAmount += c.netAmount || 0;
      groups[deptId].collectedAmount += c.paidAmount || 0;
      groups[deptId].pendingAmount += c.remainingAmount || 0;

      if (sIdRaw) groups[deptId].uniqueStudents.add(sIdRaw.toString());

      groups[deptId].challansList.push({
        ...c,
        studentName,
        fatherName,
        studentRollNo,
        programName,
        departmentName: deptName,
      });
    });

    return Object.values(groups)
      .map((dept) => ({
        ...dept,
        totalEnrolledStudents: dept.uniqueStudents.size,
        challansList: dept.challansList.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        ),
      }))
      .sort((a, b) => b.totalChallans - a.totalChallans);
  }, [rawChallans, deptMap]);

  const toggleDepartment = (deptId) => {
    setExpandedDept((prev) => (prev === deptId ? null : deptId));
  };

  const handleDownloadChallan = (challanId) => {
    window.open(`/print-challan/${challanId}`, "_blank");
  };

  // ✅ EXCEL EXPORT LOGIC
  const handleExportExcel = (deptId = null) => {
    let dataToExport = [];

    if (deptId) {
      const dept = groupedData.find((d) => d.departmentId === deptId);
      if (dept) dataToExport = dept.challansList;
    } else {
      groupedData.forEach((dept) => {
        dataToExport = [...dataToExport, ...dept.challansList];
      });
    }

    if (dataToExport.length === 0) {
      alert("No data available to export.");
      return;
    }

    const excelData = dataToExport.map((c) => ({
      "Challan No": c.challanNo,
      "Challan Type": c.challanType?.replace(/_/g, " ").toUpperCase(),
      "Student Name": c.studentName,
      "Father Name": c.fatherName,
      "Roll No": c.studentRollNo,
      Program: c.programName,
      Department: c.departmentName,
      "Issue Date": new Date(c.createdAt).toLocaleDateString("en-GB"),
      "Due Date": new Date(c.dueDate).toLocaleDateString("en-GB"),
      "Net Amount (PKR)": c.netAmount,
      "Paid Amount (PKR)": c.paidAmount || 0,
      "Pending Balance (PKR)": c.remainingAmount,
      Status: c.status.toUpperCase(),
      Remarks: c.remarks || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();

    const wscols = Object.keys(excelData[0]).map(() => ({ wch: 18 }));
    ws["!cols"] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Challan_Records");

    const prefix = deptId ? "Department_Challans" : "All_Challans";
    XLSX.writeFile(
      wb,
      `${prefix}_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  return {
    groupedData,
    terms,
    filters,
    setFilters,
    expandedDept,
    toggleDepartment,
    isLoading: isChallansLoading,
    handleDownloadChallan,
    handleExportExcel,
  };
};

export default useDepartmentChallanController;
