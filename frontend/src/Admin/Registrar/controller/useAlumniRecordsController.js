import { useMemo, useState } from "react";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import {
  useGetAlumniProfilesQuery,
  useCreateAlumniProfileMutation,
  useUpdateAlumniProfileMutation,
} from "../api/alumniRecordsApi";
import { useGetAllStudentsQuery } from "../api/registrarStudentApi";

const mapProfile = (p) => ({
  id: p._id,
  name: p.studentId?.personalInfo?.fullName || "Unknown",
  regId: p.studentId?.studentId || "—",
  program: p.studentId?.programId?.name || "—",
  gradYear: p.graduationYear,
  employer: p.employer || "—",
  designation: p.designation || "—",
  email: p.contactEmail || "—",
  phone: p.contactPhone || "—",
  status: p.status,
});

export const useAlumniRecordsController = () => {
  const { openAlert } = useGlobalAlert();
  const { data, isFetching, error, refetch } = useGetAlumniProfilesQuery();
  const alumni = useMemo(() => (data?.data || []).map(mapProfile), [data]);

  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const years = useMemo(() => {
    const u = [...new Set(alumni.map((a) => String(a.gradYear)))].sort((a, b) => b - a);
    return ["All", ...u];
  }, [alumni]);

  const filtered = useMemo(
    () =>
      alumni.filter((a) => {
        const q = searchQuery.toLowerCase();
        return (
          (q === "" ||
            a.name.toLowerCase().includes(q) ||
            a.regId.toLowerCase().includes(q) ||
            a.program.toLowerCase().includes(q)) &&
          (yearFilter === "All" || String(a.gradYear) === yearFilter) &&
          (statusFilter === "All" || a.status === statusFilter)
        );
      }),
    [alumni, searchQuery, yearFilter, statusFilter],
  );

  const stats = useMemo(
    () => ({
      total: alumni.length,
      employed: alumni.filter((a) => a.status === "Employed").length,
      higherEd: alumni.filter((a) => a.status === "Higher Ed").length,
      seeking: alumni.filter((a) => a.status === "Seeking").length,
    }),
    [alumni],
  );

  const [selectedAlumnus, setSelectedAlumnus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ employer: "", designation: "", contactEmail: "", contactPhone: "", status: "Seeking" });

  const handleViewAlumnus = (alumnus) => {
    setSelectedAlumnus(alumnus);
    setEditForm({
      employer: alumnus.employer === "—" ? "" : alumnus.employer,
      designation: alumnus.designation === "—" ? "" : alumnus.designation,
      contactEmail: alumnus.email === "—" ? "" : alumnus.email,
      contactPhone: alumnus.phone === "—" ? "" : alumnus.phone,
      status: alumnus.status,
    });
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAlumnus(null);
  };

  const [updateProfile, { isLoading: isUpdating }] = useUpdateAlumniProfileMutation();
  const handleSaveEdit = async () => {
    try {
      await updateProfile({ id: selectedAlumnus.id, ...editForm }).unwrap();
      openAlert({ message: "Alumni record updated.", severity: "success" });
      handleCloseModal();
    } catch (err) {
      openAlert({ message: err.data?.message || "Failed to update record.", severity: "error" });
    }
  };

  // New alumni record
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [createForm, setCreateForm] = useState({ graduationYear: new Date().getFullYear(), employer: "", designation: "", contactEmail: "", contactPhone: "", status: "Seeking" });

  const { data: studentsRes, isFetching: isSearchingStudents } = useGetAllStudentsQuery(
    { search: studentSearch, status: "graduated", limit: 8 },
    { skip: !studentSearch },
  );
  const studentResults = useMemo(() => studentsRes?.data?.students || [], [studentsRes]);

  const openCreateModal = () => {
    setStudentSearch("");
    setSelectedStudent(null);
    setCreateForm({ graduationYear: new Date().getFullYear(), employer: "", designation: "", contactEmail: "", contactPhone: "", status: "Seeking" });
    setIsCreateOpen(true);
  };
  const closeCreateModal = () => setIsCreateOpen(false);
  const selectStudent = (student) => {
    setSelectedStudent(student);
    setStudentSearch("");
  };

  const [createProfile, { isLoading: isCreating }] = useCreateAlumniProfileMutation();
  const handleCreateProfile = async () => {
    if (!selectedStudent || !createForm.graduationYear) {
      return openAlert({ message: "Please select a graduated student and a graduation year.", severity: "warning" });
    }
    try {
      await createProfile({ studentId: selectedStudent._id, ...createForm }).unwrap();
      openAlert({ message: "Alumni record created.", severity: "success" });
      closeCreateModal();
    } catch (err) {
      openAlert({ message: err.data?.message || "Failed to create alumni record.", severity: "error" });
    }
  };

  return {
    alumni: filtered,
    isLoading: isFetching,
    error: error ? error.data?.message || "Failed to load alumni records." : null,
    searchQuery,
    setSearchQuery,
    yearFilter,
    setYearFilter,
    statusFilter,
    setStatusFilter,
    years,
    stats,
    refetch,

    selectedAlumnus,
    isModalOpen,
    handleViewAlumnus,
    handleCloseModal,
    editForm,
    setEditForm,
    handleSaveEdit,
    isUpdating,

    isCreateOpen,
    openCreateModal,
    closeCreateModal,
    studentSearch,
    setStudentSearch,
    studentResults,
    isSearchingStudents,
    selectedStudent,
    selectStudent,
    createForm,
    setCreateForm,
    handleCreateProfile,
    isCreating,
  };
};
