import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { buildStudentProfilePdf } from "../common/buildStudentProfilePdf";
import {
  FaArrowLeft,
  FaUser,
  FaGraduationCap,
  FaCalendar,
  FaIdCard,
  FaPhone,
  FaEnvelope,
  FaBirthdayCake,
  FaVenusMars,
  FaHome,
  FaUniversity,
  FaBook,
  FaUsers,
  FaFile,
  FaFilePdf,
  FaSpinner,
  FaEye,
  FaEdit,
  FaSave,
  FaTimes,
  FaCloudUploadAlt,
  FaTrash,
  FaPlus,
  FaMoneyBillAlt,
  FaBriefcase,
  FaUserTie,
  FaHistory,
  FaExternalLinkAlt,
  FaCheckCircle,
} from "react-icons/fa";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  IconButton,
  Chip,
  Typography,
  TextField,
  Grid,
  Snackbar,
  Alert,
  MenuItem,
  Divider,
  Box,
  Paper,
} from "@mui/material";
// CNIC is stored/submitted as a plain 13-digit string (no dashes) — matches
// the format every existing record already uses and what the Admission
// application form's own validation (`^[0-9]{13}$`) expects. Dashes are
// purely a display formatting on top of that raw value.
const stripToDigits = (value, maxLen) => (value || "").replace(/\D/g, "").slice(0, maxLen);
const formatCnicDisplay = (raw) => {
  const digits = stripToDigits(raw, 13);
  return [digits.slice(0, 5), digits.slice(5, 12), digits.slice(12, 13)]
    .filter(Boolean)
    .join("-");
};

// ============================================================================
// EDIT DIALOG (logic intact, styling refined)
// ============================================================================
const EditSectionDialog = ({
  open,
  onClose,
  sectionTitle,
  initialData,
  onSave,
  isSaving,
  catalogData,
}) => {
  const isArrayType = sectionTitle === "Education History";
  const [formData, setFormData] = useState(isArrayType ? [] : {});
  const [files, setFiles] = useState({});

  useEffect(() => {
    if (initialData && open)
      setFormData(JSON.parse(JSON.stringify(initialData)));
    else if (open && isArrayType) setFormData([]);
    setFiles({});
  }, [initialData, open, isArrayType]);

  const handleChange = (key, value, nestedKey = null) => {
    if (nestedKey)
      setFormData((p) => ({ ...p, [key]: { ...p[key], [nestedKey]: value } }));
    else setFormData((p) => ({ ...p, [key]: value }));
  };

  const handleArrayChange = (index, key, value) => {
    const arr = [...formData];
    const rec = { ...arr[index], [key]: value };
    if (key === "obtainedMarks" || key === "totalMarks") {
      const o = parseFloat(key === "obtainedMarks" ? value : rec.obtainedMarks);
      const t = parseFloat(key === "totalMarks" ? value : rec.totalMarks);
      rec.percentage =
        !isNaN(o) && !isNaN(t) && t > 0 ? ((o / t) * 100).toFixed(2) : "";
    }
    arr[index] = rec;
    setFormData(arr);
  };

  const handleAddRow = () =>
    setFormData([
      ...formData,
      {
        educationProgram: "",
        institution: "",
        board: "",
        obtainedMarks: "",
        totalMarks: "",
        percentage: "",
      },
    ]);
  const handleRemoveRow = (i) =>
    setFormData(formData.filter((_, idx) => idx !== i));
  const handleFileChange = (key, file) => {
    if (file) setFiles((p) => ({ ...p, [key]: file }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isCnicInvalid) return;
    onSave(sectionTitle, formData, files);
  };

  const cnicDigitCount = stripToDigits(
    sectionTitle === "Personal Information" ? formData.cnic : "",
    13,
  ).length;
  const isCnicInvalid =
    sectionTitle === "Personal Information" && cnicDigitCount !== 13;

  const fieldSx = {
    "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.875rem" },
    "& .MuiInputLabel-root": { fontSize: "0.875rem" },
  };

  const renderFields = () => {
    switch (sectionTitle) {
      case "Academic Information": {
        const filteredPrograms =
          catalogData?.programs?.filter(
            (p) =>
              (p.departmentId?._id || p.departmentId) === formData.departmentId,
          ) || [];
        const filteredSemesters =
          catalogData?.semesters?.filter(
            (s) => (s.programId?._id || s.programId) === formData.programId,
          ) || [];
        return (
          <Grid container spacing={2.5}>
            {[
              {
                label: "Class",
                key: "departmentId",
                items: catalogData?.departments,
                renderItem: (d) => d.name,
                onChange: (v) => {
                  handleChange("departmentId", v);
                  handleChange("programId", "");
                  handleChange("semesterId", "");
                },
              },
              {
                label: "Program",
                key: "programId",
                items: filteredPrograms,
                renderItem: (p) => p.name,
                disabled: !formData.departmentId,
                onChange: (v) => {
                  handleChange("programId", v);
                  handleChange("semesterId", "");
                },
              },
              {
                label: "Section",
                key: "semesterId",
                items: filteredSemesters,
                renderItem: (s) => s.name || `Section ${s.number}`,
                disabled: !formData.programId,
                onChange: (v) => handleChange("semesterId", v),
              },
              {
                label: "Session / Term",
                key: "sessionId",
                items: catalogData?.sessions,
                renderItem: (s) => s.name,
                onChange: (v) => handleChange("sessionId", v),
              },
            ].map(({ label, key, items, renderItem, disabled, onChange }) => (
              <Grid item xs={12} md={6} key={key}>
                <TextField
                  select
                  fullWidth
                  label={label}
                  value={formData[key] || ""}
                  disabled={disabled}
                  onChange={(e) => onChange(e.target.value)}
                  sx={fieldSx}
                >
                  <MenuItem value="">
                    <em>Select {label}</em>
                  </MenuItem>
                  {items?.map((item) => (
                    <MenuItem key={item._id} value={item._id}>
                      {renderItem(item)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ))}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Student Status"
                value={formData.status || ""}
                onChange={(e) => handleChange("status", e.target.value)}
                sx={fieldSx}
              >
                {["active", "graduated", "suspended", "withdrawn"].map((v) => (
                  <MenuItem
                    key={v}
                    value={v}
                    sx={{ textTransform: "capitalize" }}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        );
      }

      case "Education History": {
        const eduList = Array.isArray(formData) ? formData : [];
        return (
          <Box>
            {eduList.length === 0 && (
              <Box
                sx={{
                  py: 4,
                  textAlign: "center",
                  color: "text.secondary",
                  border: "2px dashed #e2e8f0",
                  borderRadius: 3,
                  mb: 2,
                }}
              >
                <FaBook
                  style={{ opacity: 0.3, marginBottom: 8, fontSize: 24 }}
                />
                <Typography variant="body2">
                  No records. Add one below.
                </Typography>
              </Box>
            )}
            {eduList.map((edu, index) => (
              <Paper
                key={index}
                variant="outlined"
                sx={{
                  p: 2.5,
                  mb: 2,
                  borderRadius: 3,
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    sx={{
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Record #{index + 1}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveRow(index)}
                    color="error"
                    sx={{ bgcolor: "#fff1f2", borderRadius: 1.5 }}
                  >
                    <FaTrash size={11} />
                  </IconButton>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Degree / Program"
                      value={edu.educationProgram || ""}
                      onChange={(e) =>
                        handleArrayChange(
                          index,
                          "educationProgram",
                          e.target.value,
                        )
                      }
                      sx={{
                        ...fieldSx,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "white",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Institution"
                      value={edu.institution || ""}
                      onChange={(e) =>
                        handleArrayChange(index, "institution", e.target.value)
                      }
                      sx={{
                        ...fieldSx,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "white",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Board"
                      value={edu.board || ""}
                      onChange={(e) =>
                        handleArrayChange(index, "board", e.target.value)
                      }
                      sx={{
                        ...fieldSx,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "white",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={4} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Obtained"
                      value={edu.obtainedMarks || ""}
                      onChange={(e) =>
                        handleArrayChange(
                          index,
                          "obtainedMarks",
                          e.target.value,
                        )
                      }
                      sx={{
                        ...fieldSx,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "white",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={4} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Total"
                      value={edu.totalMarks || ""}
                      onChange={(e) =>
                        handleArrayChange(index, "totalMarks", e.target.value)
                      }
                      sx={{
                        ...fieldSx,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "white",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={4} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="%"
                      value={edu.percentage || ""}
                      InputProps={{ readOnly: true }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "#f1f5f9",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={
                        edu.startDate
                          ? new Date(edu.startDate).toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleArrayChange(index, "startDate", e.target.value)
                      }
                      sx={{
                        ...fieldSx,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "white",
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="End Date"
                      InputLabelProps={{ shrink: true }}
                      value={
                        edu.endDateOrResultAwaited
                          ? new Date(edu.endDateOrResultAwaited)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleArrayChange(
                          index,
                          "endDateOrResultAwaited",
                          e.target.value,
                        )
                      }
                      sx={{
                        ...fieldSx,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "white",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button
              startIcon={<FaPlus size={12} />}
              variant="outlined"
              fullWidth
              onClick={handleAddRow}
              sx={{
                borderStyle: "dashed",
                borderRadius: 3,
                py: 1.5,
                fontWeight: 700,
                textTransform: "none",
                borderColor: "#cbd5e1",
                color: "#64748b",
                "&:hover": {
                  borderColor: "#2563eb",
                  color: "#2563eb",
                  bgcolor: "#eff6ff",
                },
              }}
            >
              Add Education Record
            </Button>
          </Box>
        );
      }

      case "Personal Information":
        return (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.fullName || ""}
                onChange={(e) => handleChange("fullName", e.target.value)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CNIC"
                placeholder="XXXXX-XXXXXXX-X"
                value={formatCnicDisplay(formData.cnic)}
                onChange={(e) =>
                  handleChange("cnic", stripToDigits(e.target.value, 13))
                }
                inputProps={{ inputMode: "numeric", maxLength: 15 }}
                error={cnicDigitCount > 0 && cnicDigitCount !== 13}
                helperText={
                  cnicDigitCount > 0 && cnicDigitCount !== 13
                    ? `${cnicDigitCount}/13 digits — CNIC must be exactly 13 digits.`
                    : "Must be unique — no other student can share this CNIC."
                }
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date of Birth"
                InputLabelProps={{ shrink: true }}
                value={
                  formData.dob
                    ? new Date(formData.dob).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => handleChange("dob", e.target.value)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Gender"
                value={formData.gender || ""}
                onChange={(e) => handleChange("gender", e.target.value)}
                sx={fieldSx}
              >
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
                sx={fieldSx}
              />
            </Grid>
          </Grid>
        );

      case "Address Information":
        return (
          <Grid container spacing={3}>
            {[
              ["Current Address", "currentAddress", "#eff6ff", "#dbeafe"],
              ["Permanent Address", "permanentAddress", "#f8fafc", "#e2e8f0"],
            ].map(([label, key, bg, borderColor]) => (
              <Grid item xs={12} key={key}>
                <Paper
                  variant="outlined"
                  sx={{ p: 3, borderRadius: 3, bgcolor: bg, borderColor }}
                >
                  <Typography
                    variant="caption"
                    fontWeight="black"
                    sx={{
                      display: "block",
                      mb: 2,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      color: key === "currentAddress" ? "#2563eb" : "#64748b",
                    }}
                  >
                    {label}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Street Address"
                        value={formData[key]?.address || ""}
                        onChange={(e) =>
                          handleChange(key, e.target.value, "address")
                        }
                        sx={{
                          ...fieldSx,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",
                            bgcolor: "white",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="District"
                        value={formData[key]?.district || ""}
                        onChange={(e) =>
                          handleChange(key, e.target.value, "district")
                        }
                        sx={{
                          ...fieldSx,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",
                            bgcolor: "white",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Province"
                        value={formData[key]?.province || ""}
                        onChange={(e) =>
                          handleChange(key, e.target.value, "province")
                        }
                        sx={{
                          ...fieldSx,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",
                            bgcolor: "white",
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Country"
                        value={formData[key]?.country || ""}
                        onChange={(e) =>
                          handleChange(key, e.target.value, "country")
                        }
                        sx={{
                          ...fieldSx,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",
                            bgcolor: "white",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        );

      case "Family Information":
        return (
          <Grid container spacing={2.5}>
            {[
              ["Father Name", "fatherName"],
              ["Father CNIC", "fatherCnic"],
              ["Mother Name", "motherName"],
              ["Mother CNIC", "motherCnic"],
              ["Guardian Phone", "guardianPhone"],
              ["Income Bracket", "incomeBracket"],
            ].map(([label, key]) => (
              <Grid item xs={12} md={6} key={key}>
                <TextField
                  fullWidth
                  label={label}
                  value={formData[key] || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  sx={fieldSx}
                />
              </Grid>
            ))}
          </Grid>
        );

      case "Documents": {
        const docList = [
          { id: "profilePhoto", label: "Profile Photo" },
          { id: "cnicFront", label: "CNIC Front" },
          { id: "cnicBack", label: "CNIC Back" },
          { id: "matricCertificate", label: "Matric Certificate" },
          { id: "fscCertificate", label: "FSc / Intermediate" },
          { id: "domicileDoc", label: "Domicile Certificate" },
        ];
        return (
          <Grid container spacing={2}>
            {docList.map((doc) => (
              <Grid item xs={12} sm={6} key={doc.id}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    border: `1.5px solid ${files[doc.id] ? "#22c55e" : "#e2e8f0"}`,
                    bgcolor: files[doc.id] ? "#f0fdf4" : "white",
                    transition: "all 0.2s",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{ mb: 1.5, color: "#374151" }}
                  >
                    {doc.label}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Chip
                      size="small"
                      label={
                        files[doc.id]
                          ? "New file selected"
                          : formData[doc.id]
                            ? "On file"
                            : "Missing"
                      }
                      color={
                        files[doc.id]
                          ? "success"
                          : formData[doc.id]
                            ? "primary"
                            : "error"
                      }
                      variant={files[doc.id] ? "filled" : "outlined"}
                      sx={{ fontSize: "0.7rem", height: 22 }}
                    />
                    {formData[doc.id] && !files[doc.id] && (
                      <IconButton
                        size="small"
                        color="primary"
                        href={formData[doc.id]}
                        target="_blank"
                        sx={{ bgcolor: "#eff6ff", borderRadius: 1.5 }}
                      >
                        <FaEye size={12} />
                      </IconButton>
                    )}
                  </Box>
                  <Button
                    variant={files[doc.id] ? "contained" : "outlined"}
                    component="label"
                    size="small"
                    fullWidth
                    color={files[doc.id] ? "success" : "primary"}
                    startIcon={
                      files[doc.id] ? (
                        <FaCheckCircle size={11} />
                      ) : (
                        <FaCloudUploadAlt size={11} />
                      )
                    }
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 700,
                      py: 0.75,
                    }}
                  >
                    {files[doc.id] ? "Change File" : "Upload Document"}
                    <input
                      type="file"
                      hidden
                      accept="image/*,application/pdf"
                      onChange={(e) =>
                        handleFileChange(doc.id, e.target.files[0])
                      }
                    />
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        );
      }

      default:
        return <Typography>No editable fields for this section.</Typography>;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        component: "form",
        onSubmit: handleSubmit,
        sx: { borderRadius: 4, overflow: "hidden" },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: "1px solid #f1f5f9",
          pb: 2.5,
          pt: 3,
          px: 4,
          background: "#fafafa",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{ width: 4, height: 24, bgcolor: "#2563eb", borderRadius: 2 }}
          />
          <Typography variant="h6" fontWeight="black" fontSize="1.1rem">
            Edit {sectionTitle}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 4, bgcolor: "#fafafa" }}>
        {renderFields()}
      </DialogContent>
      <DialogActions
        sx={{
          p: 3,
          bgcolor: "white",
          borderTop: "1px solid #f1f5f9",
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          color="inherit"
          sx={{
            borderRadius: 2.5,
            px: 3,
            py: 1,
            fontWeight: 700,
            textTransform: "none",
            bgcolor: "#f8fafc",
            "&:hover": { bgcolor: "#f1f5f9" },
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSaving || isCnicInvalid}
          startIcon={
            isSaving ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <FaSave size={13} />
            )
          }
          sx={{
            borderRadius: 2.5,
            px: 4,
            py: 1,
            fontWeight: 700,
            textTransform: "none",
            bgcolor: "#2563eb",
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
            "&:hover": { bgcolor: "#1d4ed8" },
          }}
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ============================================================================
// MAIN DETAILS VIEW
// ============================================================================
const StudentDetailsView = ({
  student,
  loading,
  error,
  handleUpdate,
  isUpdating,
  catalogData,
}) => {
  const navigate = useNavigate();
  const [editDialog, setEditDialog] = useState({
    open: false,
    section: "",
    data: {},
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const openEdit = (section, data) =>
    setEditDialog({ open: true, section, data });
  const closeEdit = () => setEditDialog({ open: false, section: "", data: {} });

  const onSaveUpdate = async (section, textData, files) => {
    if (!handleUpdate) return;
    const res = await handleUpdate(section, textData, files);
    if (res.success) {
      setSnackbar({ open: true, message: res.message, severity: "success" });
      closeEdit();
    } else setSnackbar({ open: true, message: res.error, severity: "error" });
  };

  const getStatusConfig = (status) =>
    ({
      active: {
        color: "success",
        bg: "#ecfdf5",
        text: "#065f46",
        dot: "#10b981",
      },
      graduated: {
        color: "primary",
        bg: "#eff6ff",
        text: "#1e40af",
        dot: "#3b82f6",
      },
      suspended: {
        color: "error",
        bg: "#fff1f2",
        text: "#9f1239",
        dot: "#f43f5e",
      },
      withdrawn: {
        color: "warning",
        bg: "#fffbeb",
        text: "#92400e",
        dot: "#f59e0b",
      },
    })[status] || {
      color: "default",
      bg: "#f8fafc",
      text: "#475569",
      dot: "#94a3b8",
    };

  const formatAddr = (addr) =>
    !addr
      ? "N/A"
      : [addr.address, addr.district, addr.province, addr.country]
          .filter(Boolean)
          .join(", ");

  if (loading)
    return (
      <div
        className="h-screen flex flex-col justify-center items-center gap-4"
        style={{ background: "#f8fafc" }}
      >
        <CircularProgress sx={{ color: "#2563eb" }} />
        <Typography color="textSecondary" sx={{ fontWeight: 600 }}>
          Loading Student Profile…
        </Typography>
      </div>
    );
  if (error)
    return (
      <div className="p-10 text-center">
        <Typography color="error" variant="h6">
          {error}
        </Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </div>
    );
  if (!student)
    return (
      <div className="p-10 text-center">
        <Typography color="textSecondary" variant="h6">
          Student Not Found
        </Typography>
      </div>
    );

  const {
    personalInfo = {},
    familyInfo = {},
    educationHistory = [],
    enrollment = {},
    promotionRemarks = [],
  } = student;
  const documents = student.documents || {};
  const sc = getStatusConfig(student.status);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await buildStudentProfilePdf({
        student,
        personalInfo,
        familyInfo,
        educationHistory,
        documents,
        enrollment,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // ── Sub-components ──
  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={10} style={{ color: "#94a3b8" }} />}
        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-800 leading-snug">
        {value || "—"}
      </p>
    </div>
  );

  const SectionCard = ({
    title,
    icon: Icon,
    editData = null,
    children,
    accent = "#2563eb",
  }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-slate-100"
        style={{ background: "#fafbfc" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: `${accent}15` }}
          >
            {Icon && <Icon size={13} style={{ color: accent }} />}
          </div>
          <h3 className="text-sm font-black text-slate-800">{title}</h3>
        </div>
        {handleUpdate && editData !== null && (
          <button
            onClick={() => openEdit(title, editData)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
          >
            <FaEdit size={10} /> Edit
          </button>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');`}</style>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Profile Header ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Blue accent bar */}
          <div
            className="h-1.5 w-full"
            style={{ background: "linear-gradient(90deg, #2563eb, #7c3aed)" }}
          />
          <div className="p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors flex-shrink-0"
              >
                <FaArrowLeft size={13} />
              </button>
              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                }}
              >
                {(personalInfo.fullName || "S")[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 leading-tight tracking-tight">
                  {personalInfo.fullName || "Student Name"}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                    <FaIdCard size={9} /> {student.studentId}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold"
                    style={{ background: sc.bg, color: sc.text }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: sc.dot }}
                    />
                    {student.status?.charAt(0).toUpperCase() +
                      student.status?.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
              }}
            >
              {isGeneratingPdf ? <FaSpinner size={13} className="animate-spin" /> : <FaFilePdf size={13} />}
              {isGeneratingPdf ? "Generating…" : "Download PDF"}
            </button>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT: 2-column wide */}
          <div className="lg:col-span-2 space-y-5">
            {/* Personal Info */}
            <SectionCard
              title="Personal Information"
              icon={FaUser}
              editData={personalInfo}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
                <InfoRow
                  label="Full Name"
                  value={personalInfo.fullName}
                  icon={FaUser}
                />
                <InfoRow
                  label="CNIC"
                  value={personalInfo.cnic}
                  icon={FaIdCard}
                />
                <InfoRow
                  label="Phone"
                  value={personalInfo.phone}
                  icon={FaPhone}
                />
                <InfoRow
                  label="Email"
                  value={personalInfo.email}
                  icon={FaEnvelope}
                />
                <InfoRow
                  label="Date of Birth"
                  value={
                    personalInfo.dob
                      ? format(new Date(personalInfo.dob), "dd MMM yyyy")
                      : "—"
                  }
                  icon={FaBirthdayCake}
                />
                <InfoRow
                  label="Gender"
                  value={
                    personalInfo.gender?.charAt(0).toUpperCase() +
                    personalInfo.gender?.slice(1)
                  }
                  icon={FaVenusMars}
                />
              </div>
            </SectionCard>

            {/* Address */}
            <SectionCard
              title="Address Information"
              icon={FaHome}
              editData={personalInfo}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="p-4 rounded-xl border border-blue-100"
                  style={{ background: "#eff6ff" }}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-500 mb-2">
                    Current Address
                  </p>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    {formatAddr(personalInfo.currentAddress)}
                  </p>
                </div>
                <div
                  className="p-4 rounded-xl border border-slate-200"
                  style={{ background: "#f8fafc" }}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">
                    Permanent Address
                  </p>
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                    {formatAddr(personalInfo.permanentAddress)}
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* Family Info */}
            <SectionCard
              title="Family Information"
              icon={FaUsers}
              editData={familyInfo}
              accent="#7c3aed"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5">
                <InfoRow
                  label="Father Name"
                  value={familyInfo.fatherName}
                  icon={FaUser}
                />
                <InfoRow
                  label="Father CNIC"
                  value={familyInfo.fatherCnic}
                  icon={FaIdCard}
                />
                <InfoRow
                  label="Mother Name"
                  value={familyInfo.motherName}
                  icon={FaUser}
                />
                <InfoRow
                  label="Mother CNIC"
                  value={familyInfo.motherCnic}
                  icon={FaIdCard}
                />
                <InfoRow
                  label="Guardian Phone"
                  value={familyInfo.guardianPhone}
                  icon={FaPhone}
                />
                <InfoRow
                  label="Income Bracket"
                  value={familyInfo.incomeBracket}
                  icon={FaMoneyBillAlt}
                />
                <InfoRow
                  label="Profession"
                  value={familyInfo.fathersProfession}
                  icon={FaBriefcase}
                />
                <InfoRow
                  label="Guardian Status"
                  value={familyInfo.guardianStatus}
                  icon={FaUserTie}
                />
              </div>
            </SectionCard>

            {/* Documents */}
            <SectionCard
              title="Documents"
              icon={FaFile}
              editData={documents}
              accent="#059669"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { k: "profilePhoto", l: "Profile Photo" },
                  { k: "cnicFront", l: "CNIC Front" },
                  { k: "cnicBack", l: "CNIC Back" },
                  { k: "matricCertificate", l: "Matriculation" },
                  { k: "fscCertificate", l: "Intermediate" },
                  { k: "domicileDoc", l: "Domicile Cert." },
                ].map((doc) => (
                  <div
                    key={doc.k}
                    onClick={() =>
                      documents[doc.k] &&
                      window.open(documents[doc.k], "_blank")
                    }
                    className="group p-3.5 rounded-xl border transition-all"
                    style={{
                      cursor: documents[doc.k] ? "pointer" : "default",
                      background: documents[doc.k] ? "#f0fdf4" : "#fafafa",
                      borderColor: documents[doc.k] ? "#bbf7d0" : "#e2e8f0",
                    }}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                          background: documents[doc.k] ? "#dcfce7" : "#fee2e2",
                        }}
                      >
                        {documents[doc.k] ? (
                          <FaFilePdf size={13} style={{ color: "#16a34a" }} />
                        ) : (
                          <FaTimes size={11} style={{ color: "#dc2626" }} />
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {doc.l}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-bold"
                        style={{
                          color: documents[doc.k] ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {documents[doc.k] ? "Available" : "Missing"}
                      </span>
                      {documents[doc.k] && (
                        <FaEye
                          size={11}
                          style={{ color: "#94a3b8" }}
                          className="group-hover:text-green-600 transition-colors"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-5">
            {/* Academic Info */}
            <SectionCard
              title="Academic Information"
              icon={FaUniversity}
              accent="#2563eb"
              editData={{
                departmentId: student.department?._id || student.department,
                programId: student.program?._id || student.program,
                semesterId: student.semester?._id || student.semester,
                sessionId:
                  student.session?._id || student.session || student.termId,
                status: student.status,
              }}
            >
              <div className="space-y-4">
                <InfoRow
                  label="Program"
                  value={student.program?.name}
                  icon={FaGraduationCap}
                />
                <InfoRow
                  label="Class"
                  value={student.department?.name}
                  icon={FaUniversity}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow
                    label="Section"
                    value={
                      student.semester?.name ||
                      (student.semester?.number ? `Section ${student.semester.number}` : "N/A")
                    }
                    icon={FaBook}
                  />
                  <InfoRow
                    label="Session"
                    value={student.session?.name}
                    icon={FaCalendar}
                  />
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <div
                    className="p-3.5 rounded-xl"
                    style={{
                      background: "#ecfdf5",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600 mb-2.5">
                      Enrollment
                    </p>
                    <InfoRow
                      label="Status"
                      value={enrollment?.status}
                      icon={FaUser}
                    />
                    <div className="mt-3">
                      <InfoRow
                        label="Enrolled On"
                        value={
                          enrollment?.createdAt
                            ? format(
                                new Date(enrollment.createdAt),
                                "dd MMM yyyy",
                              )
                            : "N/A"
                        }
                        icon={FaCalendar}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Remarks & History */}
            <SectionCard
              title="Remarks & History"
              icon={FaHistory}
              editData={null}
              accent="#7c3aed"
            >
              <div className="space-y-3">
                {promotionRemarks.length > 0 ? (
                  promotionRemarks.map((rem, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-slate-200"
                      style={{ background: "#f8fafc" }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide"
                          style={{
                            background:
                              rem.status === "Admitted" ? "#ecfdf5" : "#eff6ff",
                            color:
                              rem.status === "Admitted" ? "#065f46" : "#1e40af",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background:
                                rem.status === "Admitted"
                                  ? "#10b981"
                                  : "#3b82f6",
                            }}
                          />
                          {rem.status || "Remark"}
                        </span>
                        {rem.date && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            {format(new Date(rem.date), "dd MMM yyyy")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                        {rem.remark || (
                          <span className="italic text-slate-400">
                            No additional remarks
                          </span>
                        )}
                      </p>
                      {rem.proofDoc && (
                        <button
                          onClick={() => window.open(rem.proofDoc, "_blank")}
                          className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 transition-colors"
                        >
                          <FaExternalLinkAlt size={9} /> View Proof Document
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <FaHistory size={16} style={{ opacity: 0.3 }} />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      No history available
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Education History */}
            <SectionCard
              title="Education History"
              icon={FaBook}
              editData={educationHistory}
              accent="#d97706"
            >
              <div className="space-y-3">
                {educationHistory.length > 0 ? (
                  educationHistory.map((edu, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl border border-slate-200"
                      style={{ background: "#fafafa" }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-xs font-black text-slate-900 leading-tight">
                          {edu.educationProgram}
                        </p>
                        <span
                          className="flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-lg"
                          style={{
                            background:
                              parseFloat(edu.percentage) >= 60
                                ? "#ecfdf5"
                                : "#fffbeb",
                            color:
                              parseFloat(edu.percentage) >= 60
                                ? "#065f46"
                                : "#92400e",
                          }}
                        >
                          {edu.percentage}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mb-2">
                        {edu.institution}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {edu.board}
                        </span>
                        <span
                          className="text-[10px] font-black text-slate-700"
                          style={{ fontFamily: "monospace" }}
                        >
                          {edu.obtainedMarks}/{edu.totalMarks}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-xs text-slate-400 font-medium">
                      No history available
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* System Info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-slate-100">
                  <FaCalendar size={12} style={{ color: "#64748b" }} />
                </div>
                <h3 className="text-sm font-black text-slate-700">
                  System Info
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: "Created",
                    value: student.createdAt
                      ? format(new Date(student.createdAt), "dd MMM yyyy")
                      : "N/A",
                  },
                  {
                    label: "Last Updated",
                    value: student.updatedAt
                      ? format(new Date(student.updatedAt), "dd MMM yyyy")
                      : "N/A",
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center pb-2.5 border-b border-slate-100 last:border-0 last:pb-0"
                  >
                    <span className="text-xs text-slate-400 font-semibold">
                      {label}
                    </span>
                    <span className="text-xs font-black text-slate-700">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditSectionDialog
        key={editDialog.section}
        open={editDialog.open}
        onClose={closeEdit}
        sectionTitle={editDialog.section}
        initialData={editDialog.data}
        onSave={onSaveUpdate}
        isSaving={isUpdating}
        catalogData={catalogData}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 3, fontWeight: 700 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default StudentDetailsView;
