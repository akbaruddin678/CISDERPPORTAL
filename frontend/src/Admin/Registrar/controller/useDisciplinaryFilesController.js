import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetDisciplinaryFilesQuery,
  useCreateDisciplinaryFileMutation,
  useUpdateDisciplinaryFileMutation,
} from "../api/disciplinaryFilesApi";
import { useGetAllStudentsQuery } from "../api/registrarStudentApi";

export const useDisciplinaryFilesController = () => {
  const { openAlert } = useGlobalAlert();
  const { data, isFetching, error, refetch } = useGetDisciplinaryFilesQuery();
  const files = useMemo(() => data?.data || [], [data]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionNote, setActionNote] = useState("");

  const filtered = useMemo(
    () =>
      files.filter((f) => {
        const q = searchQuery.toLowerCase();
        const studentName = f.studentId?.personalInfo?.fullName || "";
        const regId = f.studentId?.studentId || "";
        return (
          (q === "" ||
            studentName.toLowerCase().includes(q) ||
            regId.toLowerCase().includes(q) ||
            f.incident.toLowerCase().includes(q)) &&
          (statusFilter === "All" || f.status === statusFilter) &&
          (severityFilter === "All" || f.severity === severityFilter)
        );
      }),
    [files, searchQuery, statusFilter, severityFilter],
  );

  const stats = useMemo(
    () => ({
      total: files.length,
      underReview: files.filter((f) => f.status === "Under Review").length,
      critical: files.filter((f) => f.severity === "Critical").length,
      resolved: files.filter((f) => f.status === "Resolved").length,
    }),
    [files],
  );

  const handleViewFile = (file) => {
    setSelectedFile(file);
    setActionNote("");
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    setActionNote("");
  };

  const [updateFile, { isLoading: isUpdating }] = useUpdateDisciplinaryFileMutation();

  const handleTakeAction = async (id) => {
    if (!actionNote.trim()) return;
    try {
      await updateFile({ id, status: "Action Taken", action: actionNote.trim() }).unwrap();
      openAlert({ message: "Action recorded.", severity: "success" });
      handleCloseModal();
    } catch (err) {
      openAlert({ message: err.data?.message || "Failed to record action.", severity: "error" });
    }
  };

  const handleResolve = async (id) => {
    try {
      await updateFile({ id, status: "Resolved" }).unwrap();
      openAlert({ message: "File marked resolved.", severity: "success" });
      handleCloseModal();
    } catch (err) {
      openAlert({ message: err.data?.message || "Failed to resolve.", severity: "error" });
    }
  };

  const handleSuspend = async (id) => {
    try {
      await updateFile({ id, status: "Suspended" }).unwrap();
      openAlert({ message: "Student suspended.", severity: "success" });
      handleCloseModal();
    } catch (err) {
      openAlert({ message: err.data?.message || "Failed to suspend.", severity: "error" });
    }
  };

  // New-file form
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [form, setForm] = useState({
    studentId: "",
    studentLabel: "",
    incident: "",
    incidentDate: "",
    reportedBy: "",
    severity: "Medium",
  });

  const { data: studentsRes, isFetching: isSearchingStudents } = useGetAllStudentsQuery(
    { search: studentSearch, limit: 8 },
    { skip: !studentSearch },
  );
  const studentResults = useMemo(
    () => studentsRes?.data?.students || [],
    [studentsRes],
  );

  const openCreateModal = () => {
    setForm({ studentId: "", studentLabel: "", incident: "", incidentDate: "", reportedBy: "", severity: "Medium" });
    setStudentSearch("");
    setIsCreateOpen(true);
  };
  const closeCreateModal = () => setIsCreateOpen(false);

  const selectStudent = (student) => {
    setForm((f) => ({
      ...f,
      studentId: student._id,
      studentLabel: `${student.personalInfo?.fullName || "Unknown"} (${student.studentId})`,
    }));
    setStudentSearch("");
  };

  const [createFile, { isLoading: isCreating }] = useCreateDisciplinaryFileMutation();

  const handleCreateFile = async () => {
    if (!form.studentId || !form.incident.trim() || !form.incidentDate || !form.reportedBy.trim()) {
      return openAlert({ message: "Please fill in all fields and select a student.", severity: "warning" });
    }
    try {
      await createFile({
        studentId: form.studentId,
        incident: form.incident.trim(),
        incidentDate: form.incidentDate,
        reportedBy: form.reportedBy.trim(),
        severity: form.severity,
      }).unwrap();
      openAlert({ message: "Disciplinary file created.", severity: "success" });
      closeCreateModal();
    } catch (err) {
      openAlert({ message: err.data?.message || "Failed to create file.", severity: "error" });
    }
  };

  return {
    files: filtered,
    isLoading: isFetching,
    error: error ? error.data?.message || "Failed to load disciplinary files." : null,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    severityFilter,
    setSeverityFilter,
    selectedFile,
    isModalOpen,
    actionNote,
    setActionNote,
    stats,
    refetch,
    handleViewFile,
    handleCloseModal,
    handleTakeAction,
    handleResolve,
    handleSuspend,
    isUpdating,

    isCreateOpen,
    openCreateModal,
    closeCreateModal,
    form,
    setForm,
    studentSearch,
    setStudentSearch,
    studentResults,
    isSearchingStudents,
    selectStudent,
    handleCreateFile,
    isCreating,
  };
};
