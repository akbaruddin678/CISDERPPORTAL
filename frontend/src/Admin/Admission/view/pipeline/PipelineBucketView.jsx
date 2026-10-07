import React from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Print,
  DeleteOutline,
  Visibility,
  EditNote,
  PictureAsPdf,
  GridOn,
  CheckCircleOutline,
  MarkEmailReadOutlined,
  Restore,
  WarningAmber,
} from "@mui/icons-material";
import DeleteAdmissionModal from "../../common/DeleteAdmissionModal";
import EditRemarkModal from "../../common/EditRemarkModal";
import CompleteAdmissionModal from "../../common/CompleteAdmissionModal";
import AssignScholarshipModal from "../../common/AssignScholarshipModal";
import ResendAdmissionEmailModal from "../../common/ResendAdmissionEmailModal";
import ScholarshipCell from "./ScholarshipCell";

const CHALLAN_BADGE = {
  not_generated: { label: "Not Generated", color: "default" },
  pending: { label: "Pending", color: "warning" },
  paid: { label: "Paid", color: "success" },
  overdue: { label: "Overdue", color: "error" },
};

const PipelineBucketView = ({
  title,
  description,
  students,
  isLoading,
  searchQuery,
  setSearchQuery,
  showPrintChallan = false,
  printChallan,
  isPrinting,
  viewApplication,
  exportPDF,
  exportExcel,
  allowDelete = true,
  allowScopeChoice = false,
  deleteTarget,
  isDeleteModalOpen,
  openDeleteModal,
  closeDeleteModal,
  remark,
  setRemark,
  deleteScope,
  setDeleteScope,
  confirmDelete,
  isDeleting,
  remarkTargetName,
  isRemarkModalOpen,
  openRemarkModal,
  closeRemarkModal,
  remarkDraft,
  setRemarkDraft,
  saveRemark,
  isSavingRemark,
  // Only set (true) on the Fee Paid bucket — replaces the Delete action
  // entirely with the archival "Mark Complete" flow.
  showComplete = false,
  completeTarget,
  isCompleteModalOpen,
  openCompleteModal,
  closeCompleteModal,
  completeRemark,
  setCompleteRemark,
  completeConfirmed,
  setCompleteConfirmed,
  confirmComplete,
  isCompleting,
  // Only set (true) on the Accepted bucket — before a challan exists, so
  // whatever gets generated afterwards picks the discount up automatically.
  showScholarship = false,
  scholarshipTarget,
  isAssignScholarshipModalOpen,
  openAssignModal,
  closeAssignModal,
  scholarshipPlans,
  isLoadingScholarshipPlans,
  scholarshipPlanId,
  setScholarshipPlanId,
  confirmAssignScholarship,
  isAssigningScholarship,
  // Only set (true) on the Accepted bucket — resends the same congrats
  // email + PDF admission letter that promoteStudent already sent once.
  showResendEmail = false,
  resendEmailTarget,
  isResendEmailModalOpen,
  openResendEmailModal,
  closeResendEmailModal,
  confirmResendEmail,
  isResendingEmail,
  // Only set (true) on the Cancelled — Non-Payment bucket — replaces
  // Delete with a "Re-Admit" action, and shows the cancellation
  // reason/date instead of the Challan Status badge.
  showReAdmit = false,
  onReAdmit,
  isReAdmitting = false,
}) => (
  <Box>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
      <Box>
        <Typography variant="h6" fontWeight={800}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<PictureAsPdf />}
          onClick={() => exportPDF(students, title)}
          disabled={students.length === 0}
        >
          PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<GridOn />}
          onClick={() => exportExcel(students, title)}
          disabled={students.length === 0}
        >
          Excel
        </Button>
      </Box>
    </Box>

    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Phone</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Guardian Phone</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Program</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Session</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Challan Status</TableCell>
            {showScholarship && <TableCell sx={{ fontWeight: 800 }}>Scholarship</TableCell>}
            <TableCell sx={{ fontWeight: 800 }}>Remark</TableCell>
            <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={showScholarship ? 9 : 8} align="center" sx={{ py: 6 }}><CircularProgress size={26} /></TableCell></TableRow>
          ) : students.length === 0 ? (
            <TableRow><TableCell colSpan={showScholarship ? 9 : 8} align="center" sx={{ py: 6, color: "text.secondary" }}>No students in this stage.</TableCell></TableRow>
          ) : students.map((s) => {
            const badge = CHALLAN_BADGE[s.challanStatus] || CHALLAN_BADGE.not_generated;
            return (
              <TableRow key={s._id} hover>
                <TableCell>
                  <Typography fontWeight={700} fontSize={14}>{s.personalInfo?.fullName || "Unknown"}</Typography>
                  <Typography fontSize={12} color="text.secondary">{s.studentId}</Typography>
                </TableCell>
                <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{s.personalInfo?.phone || "N/A"}</TableCell>
                <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{s.familyInfo?.guardianPhone || "N/A"}</TableCell>
                <TableCell>{s.program?.name || "N/A"}</TableCell>
                <TableCell>{s.session?.name || "N/A"}</TableCell>
                <TableCell>
                  {showReAdmit ? (
                    <Box>
                      <Chip size="small" label="Cancelled — Non-Payment" color="error" variant="outlined" />
                      {s.cancelledReason && (
                        <Typography fontSize={11.5} color="text.secondary" sx={{ mt: 0.5, maxWidth: 200 }}>
                          {s.cancelledReason}
                          {s.cancelledAt && ` · ${new Date(s.cancelledAt).toLocaleDateString()}`}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Box>
                      <Chip size="small" label={badge.label} color={badge.color} variant="outlined" />
                      {s.daysUntilCancellation != null && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                          <WarningAmber sx={{ fontSize: 14, color: "warning.main" }} />
                          <Typography fontSize={11.5} fontWeight={700} color="warning.dark">
                            {s.daysUntilCancellation === 0
                              ? "Cancelled today if unpaid"
                              : `Cancelled in ${s.daysUntilCancellation} day${s.daysUntilCancellation === 1 ? "" : "s"} if unpaid`}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </TableCell>
                {showScholarship && (
                  <TableCell>
                    <ScholarshipCell student={s} onAssign={openAssignModal} />
                  </TableCell>
                )}
                <TableCell sx={{ maxWidth: 160 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      fontSize={12.5}
                      color={s.remark ? "text.primary" : "text.disabled"}
                      noWrap
                      title={s.remark || ""}
                      sx={{ maxWidth: 110 }}
                    >
                      {s.remark || "No remark"}
                    </Typography>
                    <Tooltip title="Edit Remark">
                      <IconButton size="small" onClick={() => openRemarkModal(s)}>
                        <EditNote fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View Application">
                    <IconButton size="small" onClick={() => viewApplication(s)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {showPrintChallan && (
                    <Tooltip title="Print Challan">
                      <IconButton size="small" onClick={() => printChallan(s)} disabled={isPrinting}>
                        <Print fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {showResendEmail && (
                    <Tooltip title="Resend Admission Email">
                      <IconButton size="small" onClick={() => openResendEmailModal(s)} sx={{ color: "text.disabled", "&:hover": { color: "primary.main" } }}>
                        <MarkEmailReadOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {showReAdmit ? (
                    <Tooltip title="Re-Admit This Student">
                      <IconButton size="small" onClick={() => onReAdmit(s)} disabled={isReAdmitting} sx={{ color: "text.disabled", "&:hover": { color: "info.main" } }}>
                        <Restore fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : showComplete ? (
                    <Tooltip title="Mark Complete">
                      <IconButton size="small" onClick={() => openCompleteModal(s)} sx={{ color: "text.disabled", "&:hover": { color: "success.main" } }}>
                        <CheckCircleOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    allowDelete && (
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => openDeleteModal(s)} sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}>
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>

    {allowDelete && !showComplete && (
      <DeleteAdmissionModal
        open={isDeleteModalOpen}
        admission={deleteTarget}
        remark={remark}
        setRemark={setRemark}
        allowScopeChoice={allowScopeChoice}
        scope={deleteScope}
        setScope={setDeleteScope}
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    )}

    {showComplete && (
      <CompleteAdmissionModal
        open={isCompleteModalOpen}
        student={completeTarget}
        remark={completeRemark}
        setRemark={setCompleteRemark}
        confirmed={completeConfirmed}
        setConfirmed={setCompleteConfirmed}
        onCancel={closeCompleteModal}
        onConfirm={confirmComplete}
        isCompleting={isCompleting}
      />
    )}

    {showScholarship && (
      <AssignScholarshipModal
        open={isAssignScholarshipModalOpen}
        student={scholarshipTarget}
        plans={scholarshipPlans}
        isLoadingPlans={isLoadingScholarshipPlans}
        planId={scholarshipPlanId}
        setPlanId={setScholarshipPlanId}
        onCancel={closeAssignModal}
        onConfirm={confirmAssignScholarship}
        isAssigning={isAssigningScholarship}
      />
    )}

    {showResendEmail && (
      <ResendAdmissionEmailModal
        open={isResendEmailModalOpen}
        student={resendEmailTarget}
        onCancel={closeResendEmailModal}
        onConfirm={confirmResendEmail}
        isResendingEmail={isResendingEmail}
      />
    )}

    <EditRemarkModal
      open={isRemarkModalOpen}
      name={remarkTargetName}
      remarkDraft={remarkDraft}
      setRemarkDraft={setRemarkDraft}
      onCancel={closeRemarkModal}
      onSave={saveRemark}
      isSaving={isSavingRemark}
    />
  </Box>
);

export default PipelineBucketView;
