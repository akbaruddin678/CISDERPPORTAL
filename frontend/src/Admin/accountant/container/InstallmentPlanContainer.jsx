import React, { useState } from "react";
import InstallmentPlanController from "../controller/InstallmentPlanController";
import InstallmentPlanListView from "../view/InstallmentPlan/InstallmentPlanListView";
import CreateInstallmentPlanModal from "../view/InstallmentPlan/CreateInstallmentPlanModal";
import EditInstallmentPlanModal from "../view/InstallmentPlan/EditInstallmentPlanModal";
import InstallmentPlanDetailsModal from "../view/InstallmentPlan/InstallmentPlanDetailsModal";
import AssignInstallmentModal from "../view/InstallmentPlan/AssignInstallmentModal";

const InstallmentPlanContainer = () => {
  const [filters, setFilters] = useState({
    search: "",
    isActive: "",
    page: 1,
    limit: 10,
  });
  const [modalState, setModalState] = useState({
    create: false,
    edit: false,
    details: false,
    assign: false,
  });
  const [selectedPlan, setSelectedPlan] = useState(null);

  const updateFilters = (newFilters) =>
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  const clearFilters = () =>
    setFilters({ search: "", isActive: "", page: 1, limit: 10 });

  const closeModals = () => {
    setModalState({
      create: false,
      edit: false,
      details: false,
      assign: false,
    });
    setSelectedPlan(null);
  };

  const openModal = (type, plan = null) => {
    setSelectedPlan(plan);
    setModalState((prev) => ({ ...prev, [type]: true }));
  };

  return (
    <InstallmentPlanController filters={filters}>
      {(controllerData) => (
        <div className="min-h-screen bg-slate-200 font-sans text-slate-900 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                Installment Plans
              </h1>
              <p className="mt-3 text-lg text-slate-500 ">
                Configure flexible fee payment schedules for students. Manage
                custom dates, intervals, and installment breakdowns.
              </p>
            </div>

            {/* List View */}
            <InstallmentPlanListView
              controllerData={controllerData}
              filters={filters}
              updateFilters={updateFilters}
              clearFilters={clearFilters}
              onOpenCreate={() => openModal("create")}
              onOpenEdit={(plan) => openModal("edit", plan)}
              onOpenDetails={(plan) => openModal("details", plan)}
              onOpenAssign={(plan) => openModal("assign", plan)}
            />

            {/* Modals */}
            {modalState.create && (
              <CreateInstallmentPlanModal
                isOpen={modalState.create}
                onClose={closeModals}
                controllerData={controllerData}
              />
            )}
            {modalState.edit && selectedPlan && (
              <EditInstallmentPlanModal
                isOpen={modalState.edit}
                onClose={closeModals}
                plan={selectedPlan}
                controllerData={controllerData}
              />
            )}
            {modalState.details && selectedPlan && (
              <InstallmentPlanDetailsModal
                isOpen={modalState.details}
                onClose={closeModals}
                plan={selectedPlan}
                controllerData={controllerData}
              />
            )}
            {modalState.assign && selectedPlan && (
              <AssignInstallmentModal
                isOpen={modalState.assign}
                onClose={closeModals}
                plan={selectedPlan}
                controllerData={controllerData}
              />
            )}
          </div>
        </div>
      )}
    </InstallmentPlanController>
  );
};

export default InstallmentPlanContainer;
