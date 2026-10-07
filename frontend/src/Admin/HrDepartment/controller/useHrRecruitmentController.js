import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useGetDepartmentsQuery } from "../../../components/catalog/api/catalogApi";
import {
  useGetJobPostingsQuery,
  useCreateJobPostingMutation,
  useUpdateJobPostingStatusMutation,
  useGetJobApplicationsQuery,
  useAddJobApplicationMutation,
  useUpdateApplicationStatusMutation,
} from "../api/HrApi";

const extractArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (obj.data && Array.isArray(obj.data)) return obj.data;
  return [];
};

const initialPostingForm = {
  title: "",
  departmentId: "",
  employmentType: "Full-Time",
  description: "",
  requirements: "",
  applicationDeadline: "",
};

const initialApplicationForm = {
  applicantName: "",
  email: "",
  phone: "",
  resumeUrl: "",
  coverLetter: "",
};

const useHrRecruitmentController = () => {
  const { openAlert } = useGlobalAlert();
  const navigate = useNavigate();

  const { data: deptsRes } = useGetDepartmentsQuery();
  const departments = useMemo(() => extractArray(deptsRes), [deptsRes]);

  const { data: postingsRes, isFetching: isFetchingPostings } = useGetJobPostingsQuery();
  const postings = useMemo(() => extractArray(postingsRes), [postingsRes]);

  const [createPosting, { isLoading: isCreatingPosting }] = useCreateJobPostingMutation();
  const [updatePostingStatus] = useUpdateJobPostingStatusMutation();

  const [selectedPostingId, setSelectedPostingId] = useState(null);
  const selectedPosting = useMemo(
    () => postings.find((p) => p._id === selectedPostingId) || null,
    [postings, selectedPostingId],
  );

  const { data: applicationsRes, isFetching: isFetchingApplications } = useGetJobApplicationsQuery(
    selectedPostingId,
    { skip: !selectedPostingId },
  );
  const applications = useMemo(() => extractArray(applicationsRes), [applicationsRes]);

  const [addApplication, { isLoading: isAddingApplication }] = useAddJobApplicationMutation();
  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  const [showPostingModal, setShowPostingModal] = useState(false);
  const [postingForm, setPostingForm] = useState(initialPostingForm);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationForm, setApplicationForm] = useState(initialApplicationForm);

  const openPostingModal = () => {
    setPostingForm(initialPostingForm);
    setShowPostingModal(true);
  };
  const closePostingModal = () => setShowPostingModal(false);
  const handlePostingFormChange = (field, value) =>
    setPostingForm((prev) => ({ ...prev, [field]: value }));

  const handleCreatePosting = async (e) => {
    e.preventDefault();
    if (!postingForm.title || !postingForm.description || !postingForm.applicationDeadline) {
      return openAlert({ message: "Please fill all required fields.", severity: "warning" });
    }
    try {
      await createPosting({
        ...postingForm,
        requirements: postingForm.requirements
          .split("\n")
          .map((r) => r.trim())
          .filter(Boolean),
      }).unwrap();
      openAlert({ message: "Job posting created.", severity: "success" });
      setShowPostingModal(false);
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to create posting.", severity: "error" });
    }
  };

  const handleTogglePublish = async (posting) => {
    const nextStatus = posting.status === "Published" ? "Closed" : "Published";
    try {
      await updatePostingStatus({ id: posting._id, status: nextStatus }).unwrap();
      openAlert({ message: `Posting ${nextStatus.toLowerCase()}.`, severity: "success" });
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to update posting.", severity: "error" });
    }
  };

  const openApplicationModal = () => {
    setApplicationForm(initialApplicationForm);
    setShowApplicationModal(true);
  };
  const closeApplicationModal = () => setShowApplicationModal(false);
  const handleApplicationFormChange = (field, value) =>
    setApplicationForm((prev) => ({ ...prev, [field]: value }));

  const handleAddApplication = async (e) => {
    e.preventDefault();
    if (!applicationForm.applicantName || !applicationForm.email || !applicationForm.resumeUrl) {
      return openAlert({ message: "Name, email and resume link are required.", severity: "warning" });
    }
    try {
      await addApplication({ jobId: selectedPostingId, ...applicationForm }).unwrap();
      openAlert({ message: "Application recorded.", severity: "success" });
      setShowApplicationModal(false);
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to record application.", severity: "error" });
    }
  };

  const handleApplicationStatusChange = async (application, status) => {
    try {
      await updateApplicationStatus({ id: application._id, status }).unwrap();
      openAlert({ message: "Application updated.", severity: "success" });
    } catch (error) {
      openAlert({ message: error.data?.message || "Failed to update application.", severity: "error" });
    }
  };

  // Bridges "Hired" straight into the Onboarding wizard instead of leaving
  // it as a dead-end status HR would otherwise have to re-key by hand.
  const handleStartOnboarding = (application) => {
    navigate("/hr/onboard", {
      state: {
        prefillFromApplication: {
          applicantName: application.applicantName,
          email: application.email,
          phone: application.phone,
        },
      },
    });
  };

  return {
    departments,
    postings,
    isFetchingPostings,
    selectedPosting,
    setSelectedPostingId,
    applications,
    isFetchingApplications,

    showPostingModal,
    openPostingModal,
    closePostingModal,
    postingForm,
    handlePostingFormChange,
    handleCreatePosting,
    isCreatingPosting,
    handleTogglePublish,

    showApplicationModal,
    openApplicationModal,
    closeApplicationModal,
    applicationForm,
    handleApplicationFormChange,
    handleAddApplication,
    isAddingApplication,
    handleApplicationStatusChange,
    handleStartOnboarding,
  };
};

export default useHrRecruitmentController;
