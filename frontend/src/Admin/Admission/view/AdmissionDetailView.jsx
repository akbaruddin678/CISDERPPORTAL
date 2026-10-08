import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Tooltip,
  Fade,
  IconButton,
  Stack,
  Divider,
} from "@mui/material";
import {
  School as SchoolIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  FamilyRestroom as FamilyIcon,
  Description as DescriptionIcon,
  HistoryEdu as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Download as DownloadIcon,
  EditNote as EditNoteIcon,
  Info as InfoIcon,
  Badge as BadgeIcon,
  CalendarMonth as CalendarIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  CloudUpload as CloudUploadIcon,
  CardGiftcard as ScholarshipIcon,
} from "@mui/icons-material";
import {
  useGetScholarshipPlansQuery,
  useApplyStudentScholarshipMutation,
  useApproveStudentScholarshipMutation,
} from "../../accountant/api/scholarshipApi";

const AdmissionDetailView = ({
  admissionData,
  isLoading,
  isError,
  departments = [],
  programs = [],
  semesters = [],
  sessions = [],
  loadingCatalog = false,
  onPromote,
  refetch,
}) => {
  // FIXED: Check specifically for "accepted" status to lock the view properly when reopened
  const isAlreadyPromotedFromData =
    admissionData?.data?.status === "accepted" ||
    admissionData?.data?.application?.status === "accepted";

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [remark, setRemark] = useState("");
  const [proofFile, setProofFile] = useState(null); // NEW: State for file upload
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [alreadyPromotedInfo, setAlreadyPromotedInfo] = useState(null);

  // Scholarship (optional) — assigned right at promotion time, since a
  // StudentProfile (what a scholarship links to) doesn't exist until this
  // application is actually promoted. Same apply-then-approve flow used on
  // the Accepted tab's own "Assign Scholarship" action.
  const [selectedScholarshipPlan, setSelectedScholarshipPlan] = useState("");
  const { data: scholarshipPlansRes, isFetching: isLoadingScholarshipPlans } =
    useGetScholarshipPlansQuery({ active: true, limit: 100 });
  const scholarshipPlans = scholarshipPlansRes?.data || [];
  const [applyScholarshipMutation] = useApplyStudentScholarshipMutation();
  const [approveScholarshipMutation] = useApproveStudentScholarshipMutation();

  useEffect(() => {
    if (admissionData?.success) {
      const admission = admissionData.data;

      if (isAlreadyPromotedFromData) {
        setAlreadyPromotedInfo({
          status: admission.application?.status || admission.status,
          studentId: admission.promotedStudentId || admission.studentId,
          promotionDate: admission.promotionDate,
        });
      }

      const departmentId =
        admission.academic?.department?.id ||
        admission.academic?.department?._id ||
        "";
      const programId =
        admission.academic?.program?.id ||
        admission.academic?.program?._id ||
        "";
      const sessionId =
        admission.academic?.session?.id ||
        admission.academic?.session?._id ||
        "";

      setSelectedDepartment((prev) => prev || departmentId);
      setSelectedProgram((prev) => prev || programId);
      setSelectedSession((prev) => prev || sessionId);
    }
  }, [admissionData, isAlreadyPromotedFromData]);

  const filteredPrograms = useMemo(() => {
    if (!selectedDepartment) return programs;
    return programs.filter((prog) => {
      const departmentId = prog.departmentId?._id || prog.departmentId;
      return departmentId === selectedDepartment;
    });
  }, [selectedDepartment, programs]);

  const filteredSemesters = useMemo(() => {
    if (!selectedProgram) return [];
    const filtered = semesters.filter((sem) => {
      const semesterProgramId = sem.programId?._id || sem.programId;
      return semesterProgramId === selectedProgram;
    });
    return filtered.sort((a, b) => (a.number || 0) - (b.number || 0));
  }, [selectedProgram, semesters]);

  const handleDepartmentChange = useCallback((departmentId) => {
    setSelectedDepartment(departmentId);
    setSelectedProgram("");
    setSelectedSemester("");
  }, []);

  const handleProgramChange = useCallback((programId) => {
    setSelectedProgram(programId);
    setSelectedSemester("");
  }, []);

  const canPromote =
    selectedDepartment &&
    selectedProgram &&
    selectedSemester &&
    selectedSession;

  const handlePromote = async () => {
    if (!canPromote || !onPromote || isAlreadyPromotedFromData) return;

    setPromotionLoading(true);
    try {
      // NEW: Use FormData to handle the optional file upload
      const formData = new FormData();
      formData.append(
        "admissionId",
        admissionData.data.id || admissionData.data._id,
      );
      formData.append("departmentId", selectedDepartment);
      formData.append("programId", selectedProgram);
      formData.append("semesterId", selectedSemester);
      formData.append("sessionId", selectedSession);
      formData.append("remark", remark.trim());

      if (proofFile) {
        formData.append("proofFile", proofFile);
      }

      // Pass formData instead of JSON
      const result = await onPromote(formData);

      if (result?.data?.alreadyPromoted) {
        setSnackbar({
          open: true,
          message: `Student already promoted with Student ID: ${result.data.studentProfile?.studentId}`,
          severity: "info",
        });
        setAlreadyPromotedInfo({
          status: "Submitted",
          studentId: result.data.studentProfile?.studentId,
          promotionDate: new Date(),
        });
        if (refetch) await refetch();
      } else {
        let scholarshipMessage = "";
        const newStudentId = result?.data?.studentProfile?._id;
        if (selectedScholarshipPlan && newStudentId) {
          try {
            const applied = await applyScholarshipMutation({
              studentId: newStudentId,
              scholarshipPlanId: selectedScholarshipPlan,
            }).unwrap();
            await approveScholarshipMutation({ id: applied.id }).unwrap();
            scholarshipMessage = " Scholarship assigned.";
          } catch (scholarshipError) {
            scholarshipMessage = ` (Scholarship assignment failed: ${
              scholarshipError.data?.message || scholarshipError.data?.error || "please assign it manually from the Accepted tab."
            })`;
          }
        }

        setSnackbar({
          open: true,
          message: `Student promoted successfully!${scholarshipMessage}`,
          severity: "success",
        });
        setRemark("");
        setProofFile(null); // Reset file
        setSelectedScholarshipPlan("");
        if (refetch) await refetch();
      }
    } catch (error) {
      console.error("Promotion error:", error);
      let errorMessage = error.message;
      let severity = "error";

      if (
        error.message.includes("already promoted") ||
        error.message.includes("already exists") ||
        error.response?.status === 409
      ) {
        errorMessage = "Student has already been promoted. " + errorMessage;
        severity = "info";
        if (refetch) await refetch();
      }

      setSnackbar({
        open: true,
        message: `Promotion: ${errorMessage}`,
        severity: severity,
      });
    } finally {
      setPromotionLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const DetailCard = ({ title, icon, children, color = "primary" }) => (
    <Card
      elevation={0}
      sx={{ border: `1px solid #e0e0e0`, borderRadius: 2, mb: 3 }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              mr: 2,
              width: 40,
              height: 40,
            }}
          >
            {icon}
          </Avatar>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  const DetailItem = ({ label, value, icon }) => (
    <Box sx={{ mb: 2.5 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
      >
        {icon && (
          <Box component="span" sx={{ mr: 0.5 }}>
            {icon}
          </Box>
        )}
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value || "—"}
      </Typography>
    </Box>
  );

  const PromotionStep = ({
    label,
    value,
    options,
    onChange,
    disabled,
    error,
    helperText,
  }) => (
    <Box sx={{ mb: 3 }}>
      <FormControl fullWidth size="small" error={error}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          onChange={onChange}
          label={label}
          disabled={disabled}
          sx={{ bgcolor: disabled ? "action.hover" : "background.paper" }}
        >
          <MenuItem value="">
            <em>Select {label}</em>
          </MenuItem>
          {options.map((option) => (
            <MenuItem key={option._id} value={option._id}>
              {option.name ||
                option.title ||
                (option.number
                  ? `Section ${option.number}`
                  : `Option ${option._id}`)}
            </MenuItem>
          ))}
        </Select>
        {helperText && (
          <Typography
            variant="caption"
            color={error ? "error" : "text.secondary"}
            sx={{ mt: 0.5, display: "block" }}
          >
            {helperText}
          </Typography>
        )}
      </FormControl>
    </Box>
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, color: "text.secondary" }}>
          Loading admission details...
        </Typography>
      </Box>
    );
  }

  if (isError || !admissionData?.success) {
    return (
      <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Failed to load admission details
        </Typography>
        <Typography variant="body2">
          Please try refreshing the page or contact support if the problem
          persists.
        </Typography>
      </Alert>
    );
  }

  const admission = admissionData?.data;
  const isAlreadyPromoted = isAlreadyPromotedFromData || alreadyPromotedInfo;

  const applicationSteps = [
    {
      label: "Submitted",
      status: admission.application?.status === "submitted",
    },
    {
      label: "Under Review",
      status: admission.application?.status === "review",
    },
    {
      label: "Approved",
      status: admission.application?.status === "approved",
    },
    { label: "Promoted", status: isAlreadyPromoted },
  ];

  const profilePhotoUrl =
    admission.documents?.profilePhoto ||
    admission.photoFile ||
    admission.documents?.photoFile;

  const studentName = admission.student?.name || admission.fullName;
  const studentId = admission.id;
  const email = admission.student?.email || admission.userId?.email;
  const phone = admission.student?.phone || admission.phone;
  const gender = admission.student?.gender || admission.gender;
  const dob = admission.student?.dob || admission.dob;

  const documentList = [
    { key: "cnicDoc_front", label: "CNIC Front" },
    { key: "cnicDoc_back", label: "CNIC Back" },
    { key: "domicileDoc", label: "Domicile" },
    { key: "matricCertificate", label: "SSC / Matric" },
    { key: "interCertificate", label: "HSSC / Inter" },
    { key: "otherDoc", label: "Other Document" },
  ];

  const educationList = admission.education || admission.educationDetails || [];

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, md: 3 } }}>
      {/* Profile Header Section */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: "primary.light",
          background: "linear-gradient(135deg, #1976d2 0%, #2196f3 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            bgcolor: "rgba(255, 255, 255, 0.1)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -30,
            right: 100,
            width: 150,
            height: 150,
            borderRadius: "50%",
            bgcolor: "rgba(255, 255, 255, 0.08)",
          }}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Profile Picture */}
          <Box sx={{ position: "relative" }}>
            {profilePhotoUrl ? (
              <Avatar
                src={profilePhotoUrl}
                sx={{
                  width: 120,
                  height: 120,
                  border: "4px solid white",
                  boxShadow: 3,
                  mr: 3,
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  border: "4px solid white",
                  boxShadow: 3,
                  bgcolor: "primary.dark",
                  fontSize: "2.5rem",
                  mr: 3,
                }}
              >
                {studentName?.charAt(0) || "S"}
              </Avatar>
            )}

            {/* Status Badge */}
            <Box
              sx={{
                position: "absolute",
                bottom: 10,
                right: 25,
                bgcolor: isAlreadyPromoted ? "success.main" : "warning.main",
                color: "white",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid white",
                boxShadow: 2,
              }}
            >
              {isAlreadyPromoted ? (
                <CheckCircleIcon sx={{ fontSize: 18 }} />
              ) : (
                <PersonIcon sx={{ fontSize: 18 }} />
              )}
            </Box>
          </Box>

          {/* Student Information */}
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 1,
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography variant="h4" fontWeight={700} sx={{ mr: 2 }}>
                {studentName}
              </Typography>
              <Chip
                icon={<BadgeIcon />}
                label={`ID: ${studentId}`}
                size="medium"
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  backdropFilter: "blur(10px)",
                  fontWeight: 600,
                }}
              />
              {isAlreadyPromoted && alreadyPromotedInfo?.studentId && (
                <Chip
                  icon={<SchoolIcon />}
                  label={`Student ID: ${alreadyPromotedInfo.studentId}`}
                  size="medium"
                  sx={{
                    bgcolor: "success.main",
                    color: "white",
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>

            <Typography
              variant="h6"
              fontWeight={500}
              sx={{ opacity: 0.9, mb: 2.5 }}
            >
              {admission.academic?.program?.name || "Admission Applicant"}
            </Typography>

            <Stack direction="row" spacing={3} flexWrap="wrap">
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <EmailIcon sx={{ mr: 1, fontSize: 20, opacity: 0.9 }} />
                <Typography variant="body2" fontWeight={500}>
                  {email || "No email"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <PhoneIcon sx={{ mr: 1, fontSize: 20, opacity: 0.9 }} />
                <Typography variant="body2" fontWeight={500}>
                  {phone || "No phone"}
                </Typography>
              </Box>
              {gender && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {gender.toLowerCase() === "male" ? (
                    <MaleIcon sx={{ mr: 1, fontSize: 20, opacity: 0.9 }} />
                  ) : (
                    <FemaleIcon sx={{ mr: 1, fontSize: 20, opacity: 0.9 }} />
                  )}
                  <Typography variant="body2" fontWeight={500}>
                    {gender}
                  </Typography>
                </Box>
              )}
              {dob && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CalendarIcon sx={{ mr: 1, fontSize: 20, opacity: 0.9 }} />
                  <Typography variant="body2" fontWeight={500}>
                    {format(new Date(dob), "dd MMM yyyy")}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Promotion Button */}
          <Box sx={{ ml: 2 }}>
            <Button
              variant="contained"
              color={isAlreadyPromoted ? "success" : "primary"}
              onClick={handlePromote}
              disabled={
                !canPromote ||
                promotionLoading ||
                loadingCatalog ||
                isAlreadyPromoted
              }
              startIcon={
                promotionLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <ArrowForwardIcon />
                )
              }
              size="large"
              sx={{
                minWidth: 200,
                borderRadius: 2,
                boxShadow: 3,
                "&:hover": {
                  boxShadow: 4,
                  transform: "translateY(-2px)",
                  transition: "all 0.2s",
                },
                px: 3,
                py: 1.5,
                bgcolor: "white",
                color: "primary.main",
                fontWeight: 600,
                "&:disabled": {
                  bgcolor: "rgba(255, 255, 255, 0.3)",
                  color: "rgba(255, 255, 255, 0.7)",
                },
              }}
            >
              {isAlreadyPromoted
                ? "Already Admitted"
                : promotionLoading
                  ? "Admitting..."
                  : "Get Admission"}
            </Button>
            {!canPromote && !isAlreadyPromoted && (
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255, 255, 255, 0.8)",
                  mt: 1,
                  display: "block",
                  textAlign: "center",
                }}
              >
                Select academic details below
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 3, position: "relative", zIndex: 1 }}>
          <Stepper alternativeLabel activeStep={isAlreadyPromoted ? 3 : 1}>
            {applicationSteps.map((step, index) => (
              <Step key={step.label} completed={step.status}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      color: "white !important",
                      fontWeight: 500,
                    },
                    "& .MuiStepIcon-root": {
                      color: step.status
                        ? "success.main"
                        : "rgba(255, 255, 255, 0.3)",
                      "&.Mui-active": {
                        color: "white",
                      },
                      "&.Mui-completed": {
                        color: "success.main",
                      },
                    },
                  }}
                >
                  {step.label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column - Promotion Section */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <SchoolIcon color="primary" sx={{ mr: 2, fontSize: 28 }} />
              <Typography variant="h6" fontWeight={600}>
                Student Program Selection
              </Typography>
              <Tooltip title="Select academic details to promote the student">
                <InfoIcon color="action" sx={{ ml: 1, fontSize: 20 }} />
              </Tooltip>
            </Box>

            {loadingCatalog ? (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <CircularProgress size={30} />
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Loading academic catalog...
                </Typography>
              </Box>
            ) : (
              <Fade in={!loadingCatalog}>
                <Box>
                  <PromotionStep
                    label="Class"
                    value={selectedDepartment}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    options={departments}
                    disabled={isAlreadyPromoted}
                  />
                  <PromotionStep
                    label="Program"
                    value={selectedProgram}
                    onChange={(e) => handleProgramChange(e.target.value)}
                    options={filteredPrograms}
                    disabled={!selectedDepartment || isAlreadyPromoted}
                    helperText={
                      selectedDepartment &&
                      filteredPrograms.length === 0 &&
                      "No programs available"
                    }
                  />
                  <PromotionStep
                    label="Section"
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    options={filteredSemesters}
                    disabled={!selectedProgram || isAlreadyPromoted}
                    helperText={
                      selectedProgram &&
                      filteredSemesters.length === 0 &&
                      "No semesters available"
                    }
                  />
                  <PromotionStep
                    label="Session"
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    options={sessions}
                    disabled={isAlreadyPromoted}
                  />

                  {isAlreadyPromoted ? (
                    <Alert
                      severity="success"
                      icon={<CheckCircleIcon />}
                      sx={{ mt: 2, borderRadius: 2 }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        Student already promoted
                        {alreadyPromotedInfo?.studentId &&
                          ` • ID: ${alreadyPromotedInfo.studentId}`}
                      </Typography>
                    </Alert>
                  ) : (
                    !canPromote && (
                      <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                        <Typography variant="body2">
                          Select all academic details to enable promotion
                        </Typography>
                      </Alert>
                    )
                  )}
                </Box>
              </Fade>
            )}
          </Paper>

          {/* Remarks & Proof Card */}
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <EditNoteIcon color="primary" sx={{ mr: 2, fontSize: 28 }} />
              <Typography variant="h6" fontWeight={600}>
                Promotion Remarks & Proof
              </Typography>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Add remarks about this promotion (optional)..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={isAlreadyPromoted}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
                mb: 2,
              }}
            />

            {!isAlreadyPromoted && (
              <Button
                variant={proofFile ? "contained" : "outlined"}
                component="label"
                fullWidth
                color={proofFile ? "success" : "primary"}
                startIcon={<CloudUploadIcon />}
                sx={{ borderRadius: 2, py: 1 }}
              >
                {proofFile
                  ? `Selected: ${proofFile.name}`
                  : "Upload Proof Document (Optional)"}
                <input
                  type="file"
                  hidden
                  accept="image/*,application/pdf"
                  onChange={(e) => setProofFile(e.target.files[0])}
                />
              </Button>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1.5, display: "block" }}
            >
              {isAlreadyPromoted
                ? "Remarks and proof are view-only for promoted students"
                : "These remarks and proof will be recorded with the promotion"}
            </Typography>
          </Paper>

          {/* Scholarship (Optional) Card — assigned the moment this
              application is promoted, since it needs the StudentProfile
              that promotion creates. Leaving this unset is fine; a
              scholarship can always be assigned later from the Accepted
              tab instead. */}
          {!isAlreadyPromoted && (
            <Paper
              elevation={0}
              sx={{ p: 3, mt: 3, borderRadius: 3, border: "1px solid #e0e0e0" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <ScholarshipIcon color="primary" sx={{ mr: 2, fontSize: 28 }} />
                <Typography variant="h6" fontWeight={600}>
                  Scholarship (Optional)
                </Typography>
                <Tooltip title="Assign a scholarship to this student as soon as they're promoted">
                  <InfoIcon color="action" sx={{ ml: 1, fontSize: 20 }} />
                </Tooltip>
              </Box>

              <FormControl fullWidth size="small">
                <InputLabel id="scholarship-plan-select-label">Scholarship Plan</InputLabel>
                <Select
                  labelId="scholarship-plan-select-label"
                  label="Scholarship Plan"
                  value={selectedScholarshipPlan}
                  onChange={(e) => setSelectedScholarshipPlan(e.target.value)}
                  disabled={isLoadingScholarshipPlans}
                >
                  <MenuItem value="">
                    <em>No scholarship</em>
                  </MenuItem>
                  {scholarshipPlans.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.title} ({p.type === "fixed" ? `Rs. ${p.maxAmount}` : `${p.maxPercentage}%`})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
                Applied automatically when you promote this student below — it will discount their fee once a
                challan is generated.
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Right Column - Details Sections */}
        <Grid item xs={12} lg={8}>
          <DetailCard
            title="Applied Program"
            icon={<SchoolIcon />}
            color="info"
          >
            <Grid container spacing={6}>
              <Grid item xs={12} sm={6} md={3}>
                <DetailItem
                  label="Class"
                  value={admission.academic?.department?.name}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DetailItem
                  label="Program"
                  value={admission.academic?.program?.name}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DetailItem
                  label="Program Level"
                  value={admission.academic?.program?.level}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DetailItem
                  label="Session"
                  value={admission.academic?.session?.name}
                />
              </Grid>
            </Grid>
          </DetailCard>

          <DetailCard title="Personal Information" icon={<PersonIcon />}>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <DetailItem label="Full Name" value={studentName} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  label="CNIC"
                  value={admission.student?.cnic || admission.cnic}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem label="Phone" value={phone} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem label="Email" value={email} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  label="Date of Birth"
                  value={dob ? format(new Date(dob), "dd MMM yyyy") : "—"}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem label="Gender" value={gender} />
              </Grid>
            </Grid>
          </DetailCard>

          <DetailCard
            title="Family Information"
            icon={<FamilyIcon />}
            color="warning"
          >
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  label="Father's Name"
                  value={admission.family?.fatherName || admission.fatherName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  label="Father's CNIC"
                  value={admission.family?.fatherCnic || admission.fathernic}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  label="Mother's Name"
                  value={admission.family?.motherName || admission.motherName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  label="Mother's CNIC"
                  value={admission.family?.motherCnic || admission.motherCnic}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  label="Guardian Status"
                  value={
                    admission.family?.guardianStatus || admission.guardianStatus
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailItem
                  label="Guardian Phone"
                  value={
                    admission.family?.guardianPhone || admission.guardianPhone
                  }
                />
              </Grid>
            </Grid>
          </DetailCard>

          <DetailCard
            title="Address Information"
            icon={<LocationIcon />}
            color="secondary"
          >
            <Grid container spacing={20}>
              <Grid item xs={12} md={6}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  color="text.secondary"
                  gutterBottom
                >
                  Current Address
                </Typography>
                <DetailItem
                  label="Address"
                  value={
                    admission.address?.current?.address ||
                    admission.currentAddress
                  }
                />
                <DetailItem
                  label="District"
                  value={
                    admission.address?.current?.district ||
                    admission.currentDistrict
                  }
                />
                <DetailItem
                  label="Province"
                  value={
                    admission.address?.current?.province ||
                    admission.currentProvince
                  }
                />
                <DetailItem
                  label="Country"
                  value={
                    admission.address?.current?.country ||
                    admission.currentCountry
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  color="text.secondary"
                  gutterBottom
                >
                  Permanent Address
                </Typography>
                <DetailItem
                  label="Address"
                  value={
                    admission.address?.permanent?.address ||
                    admission.permanentAddress
                  }
                />
                <DetailItem
                  label="District"
                  value={
                    admission.address?.permanent?.district ||
                    admission.permanentDistrict
                  }
                />
                <DetailItem
                  label="Province"
                  value={
                    admission.address?.permanent?.province ||
                    admission.permanentProvince
                  }
                />
                <DetailItem
                  label="Country"
                  value={
                    admission.address?.permanent?.country ||
                    admission.permanentCountry
                  }
                />
              </Grid>
            </Grid>
          </DetailCard>

          <DetailCard
            title="Education History"
            icon={<HistoryIcon />}
            color="success"
          >
            {educationList.length === 0 ? (
              <Typography color="text.secondary">
                No education records found.
              </Typography>
            ) : (
              educationList.map((edu, index) => (
                <Box key={index}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <DetailItem label="Institution" value={edu.institution} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <DetailItem
                        label="Program"
                        value={edu.educationProgram || edu.program}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <DetailItem label="Board" value={edu.board} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <DetailItem
                        label="Start Date"
                        value={
                          edu.startDate
                            ? format(new Date(edu.startDate), "MMM yyyy")
                            : "—"
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <DetailItem
                        label="End Date"
                        value={
                          edu.endDateOrResultAwaited
                            ? format(
                                new Date(edu.endDateOrResultAwaited),
                                "MMM yyyy",
                              )
                            : "—"
                        }
                      />
                    </Grid>
                  </Grid>
                  {index < educationList.length - 1 && (
                    <Divider sx={{ my: 3 }} />
                  )}
                </Box>
              ))
            )}
          </DetailCard>

          <DetailCard
            title="Documents"
            icon={<DescriptionIcon />}
            color="error"
          >
            <Grid container spacing={1}>
              <Grid item xs={6} sm={4} md={2}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 0.5 }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ minWidth: "45px" }}
                  >
                    Photo:
                  </Typography>
                  {profilePhotoUrl ? (
                    <IconButton
                      size="small"
                      color="primary"
                      href={profilePhotoUrl}
                      target="_blank"
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <Typography variant="caption" color="text.disabled">
                      N/A
                    </Typography>
                  )}
                </Stack>
              </Grid>

              {documentList.map((docConfig) => {
                const docUrl = admission.documents?.[docConfig.key];
                if (!docUrl && docConfig.key !== "interCertificate")
                  return null;

                return (
                  <Grid item xs={6} sm={4} md={2} key={docConfig.key}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ mb: 0.5 }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{ minWidth: "45px" }}
                      >
                        {docConfig.label}:
                      </Typography>
                      {docUrl ? (
                        <IconButton
                          size="small"
                          color="primary"
                          href={docUrl}
                          target="_blank"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <Typography variant="caption" color="text.disabled">
                          N/A
                        </Typography>
                      )}
                    </Stack>
                  </Grid>
                );
              })}
            </Grid>
          </DetailCard>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          elevation={6}
          sx={{ borderRadius: 2, minWidth: 300 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdmissionDetailView;
