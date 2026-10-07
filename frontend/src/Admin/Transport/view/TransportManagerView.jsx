import React from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Grid,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
  Checkbox,
  Tabs,
  Tab,
  Card,
  CardContent,
} from "@mui/material";
import {
  PersonAdd,
  Delete,
  Search,
  DirectionsBus,
  ReceiptLong,
  History,
  Close,
  Visibility,
  People,
  TrendingUp,
  Settings,
  Add,
  AttachMoney,
} from "@mui/icons-material";
import InputField from "../../../shared/shared/InputField/UI/InputField";
import SelectField from "../../../shared/sharedSelect/container/SelectField";

const TransportManagerView = (props) => {
  const {
    tabIndex,
    setTabIndex,
    isRegisterOpen,
    setIsRegisterOpen,
    isChallanModalOpen,
    setIsChallanModalOpen,
    isSetupModalOpen,
    setIsSetupModalOpen,
    setupType,
    setSetupType,

    allocations,
    challans,
    stats,
    routes,
    vehicles,
    drivers,
    currentRouteStops,
    setupForm,
    stopFields,
    appendStop,
    removeStop,
    onSubmitSetup,

    registerForm,
    onSubmitRegister,
    handleStopChange,
    studentsList,
    sessions,
    departments,
    programs,
    filters,
    setFilters,
    loadingStudents,

    handleVacate,
    viewStudent,
    setViewStudent,
    studentSpecificChallans,
    challanForm,
    onSubmitChallan,
    selectedIds,
    setSelectedIds,
    handleOpenChallanModal,
    loadingAlloc,
    tableSearch,
    setTableSearch,
    monthOptions,
  } = props;

  const handleSelectAll = (e) => {
    if (e.target.checked)
      setSelectedIds(allocations.map((a) => a.studentId?._id));
    else setSelectedIds([]);
  };

  const handleSelectRow = (id) => {
    if (selectedIds.includes(id))
      setSelectedIds(selectedIds.filter((x) => x !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: "100%", borderLeft: `5px solid ${color}` }}>
      <CardContent className="flex items-center justify-between">
        <div>
          <Typography
            variant="caption"
            className="uppercase font-bold text-gray-500"
          >
            {title}
          </Typography>
          <Typography variant="h4" className="font-bold mt-1">
            {value}
          </Typography>
        </div>
        <div style={{ color }}>{icon}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <DirectionsBus className="text-emerald-600" /> Transport Management
        </h1>
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)}>
          <Tab
            icon={<DirectionsBus />}
            iconPosition="start"
            label="Allocations"
          />
          <Tab icon={<History />} iconPosition="start" label="Challans" />
          <Tab icon={<TrendingUp />} iconPosition="start" label="Stats" />
          <Tab
            icon={<Settings />}
            iconPosition="start"
            label="Setup (Routes/Bus)"
          />
        </Tabs>
      </div>

      {/* --- TAB 0: ALLOCATIONS --- */}
      {tabIndex === 0 && (
        <>
          <div className="flex justify-between">
            <div className="flex gap-2">
              <TextField
                size="small"
                placeholder="Search..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ bgcolor: "white", width: 300 }}
              />
            </div>
            <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ReceiptLong />}
                  onClick={() => handleOpenChallanModal(selectedIds)}
                >
                  Bulk Challan
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setIsRegisterOpen(true)}
              >
                New Registration
              </Button>
            </div>
          </div>
          <Paper className="overflow-hidden rounded-xl shadow-sm border">
            <Table size="small">
              <TableHead className="bg-gray-100">
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={
                        allocations.length > 0 &&
                        selectedIds.length === allocations.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Route / Stop</TableCell>
                  <TableCell>Fare</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingAlloc ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : (
                  allocations.map((row) => (
                    <TableRow
                      key={row._id}
                      hover
                      selected={selectedIds.includes(row.studentId?._id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(row.studentId?._id)}
                          onChange={() => handleSelectRow(row.studentId?._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div
                          className="font-bold text-blue-700 cursor-pointer hover:underline"
                          onClick={() => setViewStudent(row)}
                        >
                          {row.studentId?.personalInfo?.fullName}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {row.studentId?.studentId}
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.routeId?.routeName}{" "}
                        <Chip
                          size="small"
                          label={row.stopName}
                          className="ml-1"
                        />
                      </TableCell>
                      <TableCell className="font-bold text-emerald-700">
                        {row.agreedMonthlyFare}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(row.allocationDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => setViewStudent(row)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            handleOpenChallanModal([row.studentId?._id])
                          }
                        >
                          <ReceiptLong fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleVacate(row._id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      {/* --- TAB 1: CHALLANS --- */}
      {tabIndex === 1 && (
        <Paper className="overflow-hidden rounded-xl shadow-sm border">
          <Table size="small">
            <TableHead className="bg-gray-100">
              <TableRow>
                <TableCell>Challan</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {challans.map((c) => (
                <TableRow key={c._id} hover>
                  <TableCell className="font-mono text-xs">
                    {c.challanNo}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">
                      {c.studentId?.personalInfo?.fullName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {c.studentId?.studentId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        c.challanType === "transport_admission"
                          ? "Admission"
                          : "Monthly"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell className="text-xs">{c.remarks}</TableCell>
                  <TableCell className="font-bold">{c.netAmount}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.status}
                      size="small"
                      color={c.status === "paid" ? "success" : "error"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* --- TAB 2: STATS --- */}
      {tabIndex === 2 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Active Students"
              value={stats.activeStudents || 0}
              icon={<People />}
              color="#2563eb"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Monthly Revenue"
              value={stats.monthlyPotential || 0}
              icon={<span style={{ fontWeight: "bold" }}>Rs</span>}
              color="#059669"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Collected"
              value={stats.collected || 0}
              icon={<AttachMoney />}
              color="#16a34a"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Pending"
              value={stats.pending || 0}
              icon={<ReceiptLong />}
              color="#dc2626"
            />
          </Grid>
        </Grid>
      )}

      {/* --- TAB 3: SETUP (ROUTES/BUSES) --- */}
      {tabIndex === 3 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={setupType === "ROUTE" ? "contained" : "outlined"}
              onClick={() => {
                setSetupType("ROUTE");
                setIsSetupModalOpen(true);
              }}
            >
              Add Route
            </Button>
            <Button
              variant={setupType === "VEHICLE" ? "contained" : "outlined"}
              onClick={() => {
                setSetupType("VEHICLE");
                setIsSetupModalOpen(true);
              }}
            >
              Add Vehicle
            </Button>
            <Button
              variant={setupType === "DRIVER" ? "contained" : "outlined"}
              onClick={() => {
                setSetupType("DRIVER");
                setIsSetupModalOpen(true);
              }}
            >
              Add Driver
            </Button>
          </div>

          <Paper className="p-4">
            <Typography variant="h6" className="mb-2">
              Active Routes & Stops
            </Typography>
            <Table size="small">
              <TableHead className="bg-gray-100">
                <TableRow>
                  <TableCell>Route Name</TableCell>
                  <TableCell>Bus / Driver</TableCell>
                  <TableCell>Stops</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {routes.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell>{r.routeName}</TableCell>
                    <TableCell>
                      {r.vehicleId?.registrationNumber} / {r.driverId?.fullName}
                    </TableCell>
                    <TableCell>
                      {r.stops.map((s) => (
                        <Chip
                          key={s._id}
                          label={`${s.stopName} (${s.monthlyFare})`}
                          size="small"
                          className="m-1"
                        />
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </div>
      )}

      {/* --- MODAL 1: REGISTRATION --- */}
      <Dialog
        open={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <form onSubmit={registerForm.handleSubmit(onSubmitRegister)}>
          <DialogTitle>Assign Transport to Student</DialogTitle>
          <DialogContent className="py-6 space-y-4">
            <div className="bg-blue-50 p-3 rounded grid grid-cols-12 gap-2">
              <div className="col-span-12 text-xs font-bold text-blue-800">
                1. FIND STUDENT
              </div>
              <div className="col-span-3">
                <select
                  className="w-full p-2 border rounded"
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, termId: e.target.value }))
                  }
                >
                  <option value="">Session</option>
                  {sessions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <input
                  className="w-full p-2 border rounded"
                  placeholder="Search..."
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, search: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-12">
                {loadingStudents ? (
                  <div className="text-xs">Searching...</div>
                ) : (
                  <SelectField
                    name="studentId"
                    label="Select Student"
                    control={registerForm.control}
                    errors={registerForm.formState.errors}
                    options={studentsList.map((s) => ({
                      value: s._id,
                      label: `${s.personalInfo?.fullName} (${s.studentId})`,
                    }))}
                    required
                  />
                )}
              </div>
            </div>

            <div className="font-bold text-xs text-gray-500 mt-2">
              2. ASSIGN ROUTE & STOP
            </div>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <SelectField
                  name="routeId"
                  label="Select Route"
                  control={registerForm.control}
                  errors={registerForm.formState.errors}
                  options={routes.map((r) => ({
                    value: r._id,
                    label: r.routeName,
                  }))}
                  required
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">
                    Select Stop
                  </label>
                  <select
                    className="p-2 border rounded text-sm"
                    onChange={handleStopChange}
                    required
                  >
                    <option value="">-- Choose Stop --</option>
                    {currentRouteStops.map((s, i) => (
                      <option key={i} value={s.stopName}>
                        {s.stopName} (Rs {s.monthlyFare})
                      </option>
                    ))}
                  </select>
                </div>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <SelectField
                  name="targetMonth"
                  label="Billing Month"
                  control={registerForm.control}
                  errors={registerForm.formState.errors}
                  options={monthOptions}
                  required
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <InputField
                  name="monthlyFare"
                  label="Monthly Fare"
                  type="number"
                  control={registerForm.control}
                  errors={registerForm.formState.errors}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Assign
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* --- MODAL 4: SETUP (ADD ROUTE/BUS) --- */}
      <Dialog
        open={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={setupForm.handleSubmit(onSubmitSetup)}>
          <DialogTitle>Add New {setupType}</DialogTitle>
          <DialogContent className="py-6 space-y-4">
            {setupType === "VEHICLE" && (
              <>
                <InputField
                  name="registrationNumber"
                  label="Registration No"
                  control={setupForm.control}
                  errors={setupForm.formState.errors}
                  required
                />
                <SelectField
                  name="vehicleType"
                  label="Type"
                  control={setupForm.control}
                  errors={setupForm.formState.errors}
                  options={[
                    { value: "Bus", label: "Bus" },
                    { value: "Coaster", label: "Coaster" },
                    { value: "Van", label: "Van" },
                  ]}
                  required
                />
                <InputField
                  name="capacity"
                  label="Capacity"
                  type="number"
                  control={setupForm.control}
                  errors={setupForm.formState.errors}
                  required
                />
              </>
            )}
            {setupType === "DRIVER" && (
              <>
                <InputField
                  name="fullName"
                  label="Full Name"
                  control={setupForm.control}
                  errors={setupForm.formState.errors}
                  required
                />
                <InputField
                  name="cnic"
                  label="CNIC"
                  control={setupForm.control}
                  errors={setupForm.formState.errors}
                  required
                />
                <InputField
                  name="licenseNumber"
                  label="License No"
                  control={setupForm.control}
                  errors={setupForm.formState.errors}
                  required
                />
                <InputField
                  name="contactNumber"
                  label="Contact"
                  control={setupForm.control}
                  errors={setupForm.formState.errors}
                  required
                />
              </>
            )}
            {setupType === "ROUTE" && (
              <>
                <InputField
                  name="routeName"
                  label="Route Name"
                  control={setupForm.control}
                  errors={setupForm.formState.errors}
                  required
                />
                <SelectField
                  name="vehicleId"
                  label="Vehicle"
                  control={setupForm.control}
                  errors={setupForm.formState.errors}
                  options={vehicles.map((v) => ({
                    value: v._id,
                    label: v.registrationNumber,
                  }))}
                />
                <SelectField
                  name="driverId"
                  label="Driver"
                  control={setupForm.control}
                  errors={setupForm.formState.errors}
                  options={drivers.map((d) => ({
                    value: d._id,
                    label: d.fullName,
                  }))}
                />
                <div className="border-t pt-2">
                  <Typography variant="subtitle2">Stops & Fares</Typography>
                  {stopFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 mb-2">
                      <input
                        {...setupForm.register(`stops.${index}.stopName`)}
                        placeholder="Stop Name"
                        className="border p-1 w-1/3"
                        required
                      />
                      <input
                        {...setupForm.register(`stops.${index}.pickupTime`)}
                        placeholder="Time"
                        className="border p-1 w-1/4"
                        required
                      />
                      <input
                        {...setupForm.register(`stops.${index}.monthlyFare`)}
                        placeholder="Fare"
                        type="number"
                        className="border p-1 w-1/4"
                        required
                      />
                      <Button
                        color="error"
                        size="small"
                        onClick={() => removeStop(index)}
                      >
                        X
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="small"
                    onClick={() =>
                      appendStop({
                        stopName: "",
                        pickupTime: "",
                        monthlyFare: "",
                      })
                    }
                    startIcon={<Add />}
                  >
                    Add Stop
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsSetupModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* --- MODAL 2 & 3: CHALLAN & STUDENT VIEW --- */}
      <Dialog
        open={isChallanModalOpen}
        onClose={() => setIsChallanModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={challanForm.handleSubmit(onSubmitChallan)}>
          <DialogTitle>Generate Challan</DialogTitle>
          <DialogContent className="py-6">
            <SelectField
              name="month"
              label="Month"
              control={challanForm.control}
              errors={challanForm.formState.errors}
              options={monthOptions}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsChallanModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Generate
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={!!viewStudent}
        onClose={() => setViewStudent(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Student History{" "}
          <IconButton
            onClick={() => setViewStudent(null)}
            className="float-right"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {viewStudent && (
            <>
              <div className="mb-4">
                <strong>{viewStudent.studentId?.personalInfo?.fullName}</strong>{" "}
                - {viewStudent.routeId?.routeName}
              </div>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Challan</TableCell>
                    <TableCell>Month</TableCell>
                    <TableCell>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentSpecificChallans.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell>{c.challanNo}</TableCell>
                      <TableCell>{c.remarks}</TableCell>
                      <TableCell>{c.netAmount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransportManagerView;
