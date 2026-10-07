import { useMemo, useState } from "react";
import { useGetWithdrawalRegisterQuery } from "../api/courseWithdrawalRegisterApi";

export const useCourseWithdrawalsController = () => {
  const { data, isFetching, error, refetch } = useGetWithdrawalRegisterQuery();
  const records = useMemo(() => data?.data || [], [data]);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredWithdrawals = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return records.filter((r) => {
      const reg = r.studentCourseRegistrationId;
      const studentName = reg?.studentId?.personalInfo?.fullName || "";
      const studentRegId = reg?.studentId?.studentId || "";
      const courseTitle = reg?.courseId?.title || "";
      const courseCode = reg?.courseId?.code || "";
      const matchesSearch =
        q === "" ||
        studentName.toLowerCase().includes(q) ||
        studentRegId.toLowerCase().includes(q) ||
        courseTitle.toLowerCase().includes(q) ||
        courseCode.toLowerCase().includes(q);
      const matchesType = typeFilter === "All" || r.withdrawalType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [records, searchQuery, typeFilter]);

  const stats = useMemo(
    () => ({
      total: records.length,
      drops: records.filter((r) => r.withdrawalType === "Drop").length,
      withdrawals: records.filter((r) => r.withdrawalType === "Withdrawal").length,
    }),
    [records],
  );

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  return {
    withdrawals: filteredWithdrawals,
    isLoading: isFetching,
    error: error ? error.data?.message || "Failed to load withdrawal register." : null,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    selectedRecord,
    isModalOpen,
    stats,
    refetch,
    handleViewRecord,
    handleCloseModal,
  };
};
