import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useGetAdmissionsByStatusQuery, useUpdateAdmissionRemarkMutation } from "../services/admissionListApi";
import { useDeleteAdmissionAction } from "../common/useDeleteAdmissionAction";
import { useEditRemarkAction } from "../common/useEditRemarkAction";
import { exportRowsToExcel } from "../common/pipelineExport";

const EXPORT_COLUMNS = [
  { header: "Name", value: (a) => a.name },
  { header: "Father Name", value: (a) => a.fatherName },
  { header: "CNIC", value: (a) => a.cnic },
  { header: "Phone", value: (a) => a.phone },
  { header: "Guardian Phone", value: (a) => a.guardianPhone },
  { header: "Program", value: (a) => a.program },
  { header: "Step", value: (a) => a.currentStep },
  { header: "Applied On", value: (a) => new Date(a.appliedDate).toLocaleDateString() },
  { header: "Remark", value: (a) => a.remark || "" },
];

export const useIncompleteAdmissionsController = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isFetching, refetch } = useGetAdmissionsByStatusQuery({
    status: "draft",
    page,
    limit: 20,
    search: searchQuery,
  });
  const admissions = useMemo(() => data?.data || [], [data]);
  const pagination = {
    page: data?.page || 1,
    hasMore: data?.hasMore || false,
    total: data?.total || 0,
  };

  const deleteAction = useDeleteAdmissionAction();
  const remarkAction = useEditRemarkAction(useUpdateAdmissionRemarkMutation, {
    getId: (a) => a.id,
    getName: (a) => a.name,
  });

  const viewApplication = (admission) => {
    navigate(`/admission-office/admission-detail/${admission.id}`);
  };

  const printList = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.text("Incomplete Admissions (Draft)", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [["Name", "Father Name", "CNIC", "Phone", "Guardian Phone", "Program", "Step", "Applied On"]],
      body: admissions.map((a) => [
        a.name || "N/A",
        a.fatherName || "N/A",
        a.cnic || "N/A",
        a.phone || "N/A",
        a.guardianPhone || "N/A",
        a.program || "N/A",
        a.currentStep,
        new Date(a.appliedDate).toLocaleDateString(),
      ]),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    });
    doc.save("Incomplete_Admissions.pdf");
  };

  const printSingle = (admission) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.text("Incomplete Admission — Current Progress", 14, 18);
    autoTable(doc, {
      startY: 26,
      body: [
        ["Name", admission.name || "N/A"],
        ["Father Name", admission.fatherName || "N/A"],
        ["CNIC", admission.cnic || "N/A"],
        ["Phone", admission.phone || "N/A"],
        ["Guardian Phone", admission.guardianPhone || "N/A"],
        ["Program", admission.program || "N/A"],
        ["Department", admission.department || "N/A"],
        ["Session", admission.session || "N/A"],
        ["Current Step", admission.currentStep],
        ["Applied On", new Date(admission.appliedDate).toLocaleDateString()],
        ["Remark", admission.remark || "N/A"],
      ],
      theme: "plain",
      styles: { fontSize: 11 },
    });
    doc.save(`${admission.name || "Draft"}_Progress.pdf`);
  };

  const exportExcel = () => {
    exportRowsToExcel({
      columns: EXPORT_COLUMNS,
      rows: admissions,
      filename: `Incomplete_Admissions_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "Incomplete",
    });
  };

  return {
    admissions,
    isLoading: isFetching,
    refetch,
    page,
    setPage,
    pagination,
    searchQuery,
    setSearchQuery: (q) => {
      setSearchQuery(q);
      setPage(1);
    },
    viewApplication,
    printList,
    printSingle,
    exportExcel,
    ...deleteAction,
    ...remarkAction,
  };
};
