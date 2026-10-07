// container/ScholarshipManagementContainer.js
import React, { useState } from "react";

// --- 1. IMPORTS: Logic & Views ---
import ScholarshipPlanController from "../controller/ScholarshipPlanController";
import StudentScholarshipController from "../controller/StudentScholarshipController";
import ScholarshipPlanListView from "../view/Scholarship/ScholarshipPlanListView";
import StudentScholarshipListView from "../view/Scholarship/StudentScholarshipListView";
import {
  useLazyGetScholarshipPlansQuery,
  useLazyGetStudentScholarshipsQuery,
} from "../api/scholarshipApi";

// --- 2. IMPORTS: Modals ---
import CreateScholarshipPlanModal from "../view/Scholarship/CreateScholarshipPlanModal";
import EditScholarshipPlanModal from "../view/Scholarship/EditScholarshipPlanModal";
import ScholarshipPlanDetailsModal from "../view/Scholarship/ScholarshipPlanDetailsModal";
import ScholarshipApplicationModal from "../view/Scholarship/ScholarshipApplicationModal";
import ScholarshipApprovalModal from "../view/Scholarship/ScholarshipApprovalModal";
import ScholarshipRejectionModal from "../view/Scholarship/ScholarshipRejectionModal";
import ScholarshipRevokeModal from "../view/Scholarship/ScholarshipRevokeModal";
import ScholarshipDetailsModal from "../view/Scholarship/ScholarshipDetailsModal";
import ConfirmationModal from "../view/Scholarship/ConfirmationModal";
import Notification from "../view/Scholarship/Notification";
import ExportModal from "../view/Scholarship/ExportModal";

// --- 3. IMPORTS: Icons ---
import {
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Activity,
  DollarSign,
  LayoutDashboard,
  GraduationCap,
} from "lucide-react";

const TAB_ICONS = {
  dashboard: LayoutDashboard,
  plans: FileText,
  applications: Users,
};

const ScholarshipManagementContainer = () => {
  // ... (State definitions remain exactly the same) ...
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notifications, setNotifications] = useState([]);
  const [planFilters, setPlanFilters] = useState({
    search: "",
    isActive: "",
    type: "",
    departmentId: "",
    programId: "",
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [applicationFilters, setApplicationFilters] = useState({
    search: "",
    status: "",
    termId: "",
    studentId: "",
    departmentId: "",
    programId: "",
    planId: "",
    page: 1,
    limit: 10,
    sortBy: "applicationDate",
    sortOrder: "desc",
  });
  const [modalState, setModalState] = useState({
    createPlan: false,
    editPlan: false,
    planDetails: false,
    applyScholarship: false,
    approveScholarship: false,
    rejectScholarship: false,
    revokeScholarship: false,
    scholarshipDetails: false,
    confirmation: false,
    exportData: false,
  });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Lazy triggers used only by the Export modal — fetch every matching
  // record (ignoring on-screen pagination) at export time.
  const [fetchAllPlans] = useLazyGetScholarshipPlansQuery();
  const [fetchAllApplications] = useLazyGetStudentScholarshipsQuery();
  const [confirmationConfig, setConfirmationConfig] = useState(null);
  const [exportConfig, setExportConfig] = useState(null);

  // ... (Helper functions remain exactly the same) ...
  const addNotification = (type, message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      5000
    );
  };
  const updatePlanFilters = (newFilters) =>
    setPlanFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  const updateApplicationFilters = (newFilters) =>
    setApplicationFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  const handlePlanPageChange = (page) =>
    setPlanFilters((prev) => ({ ...prev, page }));
  const handleApplicationPageChange = (page) =>
    setApplicationFilters((prev) => ({ ...prev, page }));
  const clearPlanFilters = () => {
    setPlanFilters({
      search: "",
      isActive: "",
      type: "",
      departmentId: "",
      programId: "",
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    addNotification("info", "Filters reset");
  };
  const clearApplicationFilters = () => {
    setApplicationFilters({
      search: "",
      status: "",
      termId: "",
      studentId: "",
      departmentId: "",
      programId: "",
      planId: "",
      page: 1,
      limit: 10,
      sortBy: "applicationDate",
      sortOrder: "desc",
    });
    addNotification("info", "Filters reset");
  };
  const closeAllModals = () => {
    setModalState({
      createPlan: false,
      editPlan: false,
      planDetails: false,
      applyScholarship: false,
      approveScholarship: false,
      rejectScholarship: false,
      revokeScholarship: false,
      scholarshipDetails: false,
      confirmation: false,
      exportData: false,
    });
    setSelectedPlan(null);
    setSelectedApplication(null);
    setSelectedStudent(null);
    setConfirmationConfig(null);
    setExportConfig(null);
  };
  const openConfirmationModal = (config) => {
    setConfirmationConfig(config);
    setModalState((prev) => ({ ...prev, confirmation: true }));
  };
  const handleConfirm = async () => {
    if (confirmationConfig && confirmationConfig.onConfirm) {
      try {
        await confirmationConfig.onConfirm();
        addNotification(
          "success",
          confirmationConfig.successMessage || "Success"
        );
      } catch (error) {
        addNotification("error", confirmationConfig.errorMessage || "Failed");
      }
    }
    closeAllModals();
  };

  const StatCard = ({ title, value, icon: Icon, tint }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${tint}`}>
        <Icon size={22} strokeWidth={1.75} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* 3.1: Global Notifications */}
      <div className="fixed top-4 right-4 z-[60] space-y-2 pointer-events-none">
        {notifications.map((n) => (
          <div key={n.id} className="pointer-events-auto">
            <Notification
              type={n.type}
              message={n.message}
              onClose={() =>
                setNotifications((p) => p.filter((x) => x.id !== n.id))
              }
            />
          </div>
        ))}
      </div>

      {/* 3.2: Top Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <GraduationCap size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">
              Scholarship &amp; Aid
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Plans, applications, and grant assignments
            </p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {["dashboard", "plans", "applications"].map((tab) => {
            const TabIcon = TAB_ICONS[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
                  activeTab === tab
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <TabIcon size={15} strokeWidth={2} />
                {tab}
              </button>
            );
          })}
        </div>
        <div className="flex items-center space-x-3"></div>
      </header>

      {/* 3.3: Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <ScholarshipPlanController
          filters={planFilters}
          onFilterChange={updatePlanFilters}
        >
          {(planData) => (
            <StudentScholarshipController
              filters={applicationFilters}
              onFilterChange={updateApplicationFilters}
            >
              {(appData) => (
                <>
                  {/* --- UPDATED DASHBOARD SECTION --- */}
                  {activeTab === "dashboard" && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      {/* SECTION 1: APPLICANT STATISTICS (The missing part) */}
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Users className="text-indigo-500" size={20} />{" "}
                          Applicant Statistics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <StatCard
                            title="Total Applications"
                            value={appData.applicationStats?.total || 0}
                            icon={Users}
                            tint="bg-slate-100 text-slate-600"
                          />
                          <StatCard
                            title="Pending Review"
                            value={appData.applicationStats?.pending || 0}
                            icon={Activity}
                            tint="bg-amber-50 text-amber-600"
                          />
                          <StatCard
                            title="Assigned / Approved"
                            value={appData.applicationStats?.approved || 0}
                            icon={CheckCircle}
                            tint="bg-emerald-50 text-emerald-600"
                          />
                          <StatCard
                            title="Rejected"
                            value={appData.applicationStats?.rejected || 0}
                            icon={XCircle}
                            tint="bg-rose-50 text-rose-600"
                          />
                        </div>
                      </div>

                      {/* SECTION 2: SCHOLARSHIP PLAN OVERVIEW */}
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <FileText className="text-blue-500" size={20} /> Plan
                          Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <StatCard
                            title="Total Plans"
                            value={planData.stats?.total || 0}
                            icon={FileText}
                            tint="bg-blue-50 text-blue-600"
                          />
                          <StatCard
                            title="Active Plans"
                            value={planData.stats?.active || 0}
                            icon={CheckCircle}
                            tint="bg-emerald-50 text-emerald-600"
                          />
                          <StatCard
                            title="Fixed Amount Plans"
                            value={planData.stats?.fixedType || 0}
                            icon={DollarSign}
                            tint="bg-indigo-50 text-indigo-600"
                          />
                          <StatCard
                            title="Percentage Plans"
                            value={planData.stats?.percentageType || 0}
                            icon={Activity}
                            tint="bg-purple-50 text-purple-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {/* --- END DASHBOARD --- */}

                  {/* PLANS TAB (Kept as is) */}
                  {activeTab === "plans" && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <ScholarshipPlanListView
                        controllerData={planData}
                        filters={planFilters}
                        updateFilters={updatePlanFilters}
                        clearFilters={clearPlanFilters}
                        onPageChange={handlePlanPageChange}
                        onOpenCreate={() =>
                          setModalState((p) => ({ ...p, createPlan: true }))
                        }
                        onOpenEdit={(p) => {
                          setSelectedPlan(p);
                          setModalState((s) => ({ ...s, editPlan: true }));
                        }}
                        onOpenDetails={(p) => {
                          setSelectedPlan(p);
                          setModalState((s) => ({ ...s, planDetails: true }));
                        }}
                        onOpenConfirmation={openConfirmationModal}
                        onOpenExport={() => {
                          setExportConfig({
                            title: "Export Plans",
                            dataType: "plans",
                            filters: planFilters,
                          });
                          setModalState((prev) => ({
                            ...prev,
                            exportData: true,
                          }));
                        }}
                      />
                    </div>
                  )}

                  {/* APPLICATIONS TAB (Kept as is) */}
                  {activeTab === "applications" && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <StudentScholarshipListView
                        controllerData={appData}
                        filters={applicationFilters}
                        updateFilters={updateApplicationFilters}
                        clearFilters={clearApplicationFilters}
                        onPageChange={handleApplicationPageChange}
                        onOpenAssign={(s) => {
                          setSelectedStudent(s);
                          setModalState((prev) => ({
                            ...prev,
                            applyScholarship: true,
                          }));
                        }}
                        onOpenApply={(s) => {
                          setSelectedStudent(s);
                          setModalState((prev) => ({
                            ...prev,
                            applyScholarship: true,
                          }));
                        }}
                        onOpenApprove={(a) => {
                          setSelectedApplication(a);
                          setModalState((prev) => ({
                            ...prev,
                            approveScholarship: true,
                          }));
                        }}
                        onOpenReject={(a) => {
                          setSelectedApplication(a);
                          setModalState((prev) => ({
                            ...prev,
                            rejectScholarship: true,
                          }));
                        }}
                        onOpenRevoke={(a) => {
                          setSelectedApplication(a);
                          setModalState((prev) => ({
                            ...prev,
                            revokeScholarship: true,
                          }));
                        }}
                        onOpenDetails={(a) => {
                          setSelectedApplication(a);
                          setModalState((prev) => ({
                            ...prev,
                            scholarshipDetails: true,
                          }));
                        }}
                        onOpenExport={() => {
                          setExportConfig({
                            title: "Export Applications",
                            dataType: "applications",
                            filters: applicationFilters,
                          });
                          setModalState((prev) => ({
                            ...prev,
                            exportData: true,
                          }));
                        }}
                      />
                    </div>
                  )}

                  {/* MODALS */}
                  {modalState.createPlan && (
                    <CreateScholarshipPlanModal
                      isOpen={true}
                      onClose={closeAllModals}
                      onSuccess={(msg) => addNotification("success", msg)}
                      onError={(msg) => addNotification("error", msg)}
                      handleCreatePlan={planData.handleCreatePlan}
                      terms={appData.terms}
                    />
                  )}
                  {modalState.editPlan && selectedPlan && (
                    <EditScholarshipPlanModal
                      isOpen={true}
                      onClose={closeAllModals}
                      plan={selectedPlan}
                      handleUpdatePlan={planData.handleUpdatePlan}
                      onSuccess={(msg) => addNotification("success", msg)}
                      onError={(msg) => addNotification("error", msg)}
                      terms={appData.terms}
                    />
                  )}
                  {modalState.planDetails && selectedPlan && (
                    <ScholarshipPlanDetailsModal
                      isOpen={true}
                      onClose={closeAllModals}
                      plan={selectedPlan}
                    />
                  )}
                  {modalState.applyScholarship && (
                    <ScholarshipApplicationModal
                      isOpen={true}
                      onClose={closeAllModals}
                      student={selectedStudent}
                      students={appData.students}
                      scholarshipPlans={appData.scholarshipPlans}
                      terms={appData.terms}
                      departments={appData.departments}
                      programs={appData.programs}
                      studentListFilters={appData.studentListFilters}
                      setStudentListFilters={appData.setStudentListFilters}
                      isLoadingStudents={appData.isFetchingStudents}
                      semesters={appData.semesters}
                      handleApplyForScholarship={appData.handleApplyScholarship}
                      handleCheckEligibility={appData.handleCheckEligibility}
                      handleFetchFeeContext={appData.handleFetchFeeContext}
                      handleUpsertStudentFee={appData.handleUpsertStudentFee}
                      isSavingFee={appData.isSavingFee}
                      onSuccess={(msg) => addNotification("success", msg)}
                      onError={(msg) => addNotification("error", msg)}
                    />
                  )}
                  {modalState.approveScholarship && selectedApplication && (
                    <ScholarshipApprovalModal
                      isOpen={true}
                      onClose={closeAllModals}
                      application={selectedApplication}
                      handleApproveScholarship={
                        appData.handleApproveScholarship
                      }
                      handleFetchFeeContext={appData.handleFetchFeeContext}
                      onSuccess={(msg) => addNotification("success", msg)}
                      onError={(msg) => addNotification("error", msg)}
                    />
                  )}
                  {modalState.rejectScholarship && selectedApplication && (
                    <ScholarshipRejectionModal
                      isOpen={true}
                      onClose={closeAllModals}
                      application={selectedApplication}
                      handleRejectScholarship={appData.handleRejectScholarship}
                      onSuccess={(msg) => addNotification("success", msg)}
                      onError={(msg) => addNotification("error", msg)}
                    />
                  )}
                  {modalState.revokeScholarship && selectedApplication && (
                    <ScholarshipRevokeModal
                      isOpen={true}
                      onClose={closeAllModals}
                      application={selectedApplication}
                      handleRevokeScholarship={appData.handleRevokeScholarship}
                      onSuccess={(msg) => addNotification("success", msg)}
                      onError={(msg) => addNotification("error", msg)}
                    />
                  )}
                  {modalState.scholarshipDetails && selectedApplication && (
                    <ScholarshipDetailsModal
                      isOpen={true}
                      onClose={closeAllModals}
                      application={selectedApplication}
                      handleFetchFeeContext={appData.handleFetchFeeContext}
                      onOpenRevoke={(a) => {
                        setSelectedApplication(a);
                        setModalState((prev) => ({
                          ...prev,
                          scholarshipDetails: false,
                          revokeScholarship: true,
                        }));
                      }}
                    />
                  )}
                </>
              )}
            </StudentScholarshipController>
          )}
        </ScholarshipPlanController>
      </main>

      {/* Global Modals */}
      {modalState.confirmation && confirmationConfig && (
        <ConfirmationModal
          isOpen={true}
          onClose={closeAllModals}
          onConfirm={handleConfirm}
          title={confirmationConfig.title}
          message={confirmationConfig.message}
          confirmText={confirmationConfig.confirmText}
          type={confirmationConfig.type}
        />
      )}
      {modalState.exportData && exportConfig && (
        <ExportModal
          isOpen={true}
          onClose={closeAllModals}
          title={exportConfig.title}
          dataType={exportConfig.dataType}
          filters={exportConfig.filters}
          fetchAllPlans={fetchAllPlans}
          fetchAllApplications={fetchAllApplications}
          onSuccess={(msg) => addNotification("success", msg)}
          onError={(msg) => addNotification("error", msg)}
        />
      )}
    </div>
  );
};

export default ScholarshipManagementContainer;
