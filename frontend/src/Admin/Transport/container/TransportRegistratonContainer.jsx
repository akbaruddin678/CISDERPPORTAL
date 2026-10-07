import React, { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import * as API from "../api/transportApi";
import {
  useGetTermsQuery,
  useGetDepartmentsQuery,
  useGetProgramsQuery,
} from "../../accountant/api/depsemtermpro";
import TransportManagerView from "../view/TransportManagerView";

const TransportManagerContainer = () => {
  const { openAlert } = useGlobalAlert();
  const [tabIndex, setTabIndex] = useState(0); // 0:Allocations, 1:Challans, 2:Stats, 3:Setup

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [setupType, setSetupType] = useState("ROUTE"); // ROUTE | VEHICLE | DRIVER

  const [viewStudent, setViewStudent] = useState(null);
  const [tableSearch, setTableSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({
    termId: "",
    departmentId: "",
    programId: "",
    search: "",
  });

  // --- API HOOKS ---
  const { data: allocationsRes, isLoading: loadingAlloc } =
    API.useGetAllocationsQuery();
  const { data: challansRes, isLoading: loadingChallans } =
    API.useGetChallansQuery();
  const { data: statsRes, isLoading: loadingStats } = API.useGetStatsQuery();
  const { data: routesRes } = API.useGetRoutesQuery();
  const { data: vehiclesRes } = API.useGetVehiclesQuery();
  const { data: driversRes } = API.useGetDriversQuery();

  const [assignTransport] = API.useAssignTransportMutation();
  const [generateChallan] = API.useGenerateChallanMutation();
  const [vacateTransport] = API.useVacateTransportMutation();

  // Setup Mutations
  const [createRoute] = API.useCreateRouteMutation();
  const [createVehicle] = API.useCreateVehicleMutation();
  const [createDriver] = API.useCreateDriverMutation();

  // Dropdowns
  const { data: studentsData, isFetching: loadingStudents } =
    API.useGetStudentsQuery(filters, { skip: !isRegisterOpen });
  const { data: sessions } = useGetTermsQuery();
  const { data: depts } = useGetDepartmentsQuery();
  const { data: progs } = useGetProgramsQuery(
    filters.departmentId ? { departmentId: filters.departmentId } : undefined,
    { skip: !filters.departmentId }
  );

  // Data
  const allocations = allocationsRes?.data || [];
  const challans = challansRes?.data || [];
  const stats = statsRes?.data || {};
  const routes = routesRes?.data || [];
  const vehicles = vehiclesRes?.data || [];
  const drivers = driversRes?.data || [];
  const studentsList = studentsData?.data?.students || [];

  // --- FORMS ---
  const registerForm = useForm();
  const challanForm = useForm();
  const setupForm = useForm({
    defaultValues: {
      stops: [{ stopName: "", pickupTime: "", monthlyFare: "" }],
    },
  });

  // Field Array for Stops in Route Setup
  const {
    fields: stopFields,
    append: appendStop,
    remove: removeStop,
  } = useFieldArray({
    control: setupForm.control,
    name: "stops",
  });

  // --- LOGIC ---
  const selectedRouteId = registerForm.watch("routeId");
  const currentRouteStops = useMemo(() => {
    const route = routes.find((r) => r._id === selectedRouteId);
    return route?.stops || [];
  }, [selectedRouteId, routes]);

  const handleStopChange = (e) => {
    const stopName = e.target.value;
    registerForm.setValue("stopName", stopName);
    const stop = currentRouteStops.find((s) => s.stopName === stopName);
    if (stop) registerForm.setValue("monthlyFare", stop.monthlyFare); // Auto-set Fare
  };

  const filteredAllocations = useMemo(() => {
    if (!tableSearch) return allocations;
    const lower = tableSearch.toLowerCase();
    return allocations.filter(
      (row) =>
        row.studentId?.personalInfo?.fullName?.toLowerCase().includes(lower) ||
        row.routeId?.routeName?.toLowerCase().includes(lower)
    );
  }, [allocations, tableSearch]);

  const studentSpecificChallans = useMemo(() => {
    if (!viewStudent || !challans) return [];
    const targetId = viewStudent.studentId?._id || viewStudent.studentId;
    return challans.filter(
      (c) => String(c.studentId?._id || c.studentId) === String(targetId)
    );
  }, [challans, viewStudent]);

  // --- HANDLERS ---
  const onSubmitRegister = async (data) => {
    try {
      await assignTransport(data).unwrap();
      openAlert({ message: "Success", severity: "success" });
      setIsRegisterOpen(false);
    } catch (err) {
      openAlert({ message: err?.data?.message || "Error", severity: "error" });
    }
  };

  const onSubmitSetup = async (data) => {
    try {
      if (setupType === "VEHICLE") await createVehicle(data).unwrap();
      else if (setupType === "DRIVER") await createDriver(data).unwrap();
      else if (setupType === "ROUTE") await createRoute(data).unwrap();

      openAlert({ message: "Created Successfully", severity: "success" });
      setIsSetupModalOpen(false);
      setupForm.reset();
    } catch (err) {
      openAlert({ message: "Failed", severity: "error" });
    }
  };

  const onSubmitChallan = async (data) => {
    try {
      await generateChallan({
        studentIds: selectedIds,
        month: data.month,
      }).unwrap();
      openAlert({ message: "Generated", severity: "success" });
      setIsChallanModalOpen(false);
      setSelectedIds([]);
    } catch (err) {
      openAlert({ message: "Failed", severity: "error" });
    }
  };

  const handleVacate = async (id) => {
    if (window.confirm("Vacate?")) {
      try {
        await vacateTransport(id).unwrap();
        openAlert({ message: "Vacated", severity: "success" });
      } catch (err) {
        openAlert({ message: "Error", severity: "error" });
      }
    }
  };

  const monthOptions = ["January 2026", "February 2026", "March 2026"].map(
    (m) => ({ label: m, value: m })
  );

  return (
    <TransportManagerView
      tabIndex={tabIndex}
      setTabIndex={setTabIndex}
      isRegisterOpen={isRegisterOpen}
      setIsRegisterOpen={setIsRegisterOpen}
      isChallanModalOpen={isChallanModalOpen}
      setIsChallanModalOpen={setIsChallanModalOpen}
      isSetupModalOpen={isSetupModalOpen}
      setIsSetupModalOpen={setIsSetupModalOpen}
      setupType={setupType}
      setSetupType={setSetupType}
      allocations={filteredAllocations}
      challans={challans}
      stats={stats}
      routes={routes}
      vehicles={vehicles}
      drivers={drivers}
      currentRouteStops={currentRouteStops}
      // Setup Data
      setupForm={setupForm}
      stopFields={stopFields}
      appendStop={appendStop}
      removeStop={removeStop}
      onSubmitSetup={onSubmitSetup}
      // Registration Data
      registerForm={registerForm}
      onSubmitRegister={onSubmitRegister}
      handleStopChange={handleStopChange}
      studentsList={studentsList}
      sessions={sessions?.data || []}
      departments={depts?.data || []}
      programs={progs?.data || []}
      filters={filters}
      setFilters={setFilters}
      loadingStudents={loadingStudents}
      // Actions
      handleVacate={handleVacate}
      viewStudent={viewStudent}
      setViewStudent={setViewStudent}
      studentSpecificChallans={studentSpecificChallans}
      // Challan
      challanForm={challanForm}
      onSubmitChallan={onSubmitChallan}
      selectedIds={selectedIds}
      setSelectedIds={setSelectedIds}
      handleOpenChallanModal={(ids) => {
        setSelectedIds(ids);
        setIsChallanModalOpen(true);
      }}
      loadingAlloc={loadingAlloc}
      tableSearch={tableSearch}
      setTableSearch={setTableSearch}
      monthOptions={monthOptions}
    />
  );
};

export default TransportManagerContainer;
