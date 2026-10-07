import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetAdmissionsByStatusQuery, useUpdateAdmissionRemarkMutation } from "../services/admissionListApi";
import { useDeleteAdmissionAction } from "../common/useDeleteAdmissionAction";
import { useEditRemarkAction } from "../common/useEditRemarkAction";
import { exportRowsToPDF, exportRowsToExcel } from "../common/pipelineExport";

const EXPORT_COLUMNS = [
  { header: "Name", value: (a) => a.name },
  { header: "Father Name", value: (a) => a.fatherName },
  { header: "CNIC", value: (a) => a.cnic },
  { header: "Phone", value: (a) => a.phone },
  { header: "Guardian Phone", value: (a) => a.guardianPhone },
  { header: "Program", value: (a) => a.program },
  { header: "Submitted On", value: (a) => new Date(a.appliedDate).toLocaleDateString() },
  { header: "Remark", value: (a) => a.remark || "" },
];

export const useCompleteAdmissionsController = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isFetching, refetch } = useGetAdmissionsByStatusQuery({
    status: "submitted",
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
    exportRowsToPDF({
      title: "Complete Admissions (Submitted)",
      columns: EXPORT_COLUMNS,
      rows: admissions,
      filename: "Complete_Admissions.pdf",
    });
  };

  const exportExcel = () => {
    exportRowsToExcel({
      columns: EXPORT_COLUMNS,
      rows: admissions,
      filename: `Complete_Admissions_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "Complete",
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
    exportExcel,
    ...deleteAction,
    ...remarkAction,
  };
};
