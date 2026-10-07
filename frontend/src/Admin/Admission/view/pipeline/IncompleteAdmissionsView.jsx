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
  Pagination,
} from "@mui/material";
import {
  Search,
  Print,
  DeleteOutline,
  PictureAsPdf,
  GridOn,
  Visibility,
  EditNote,
} from "@mui/icons-material";
import DeleteAdmissionModal from "../../common/DeleteAdmissionModal";
import EditRemarkModal from "../../common/EditRemarkModal";

const IncompleteAdmissionsView = ({
  admissions,
  isLoading,
  page,
  setPage,
  pagination,
  searchQuery,
  setSearchQuery,
  viewApplication,
  printList,
  printSingle,
  exportExcel,
  deleteTarget,
  isDeleteModalOpen,
  openDeleteModal,
  closeDeleteModal,
  remark,
  setRemark,
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
}) => (
  <Box>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
      <Box>
        <Typography variant="h6" fontWeight={800}>Incomplete Admissions</Typography>
        <Typography variant="body2" color="text.secondary">
          Applications still in draft — not yet submitted by the applicant.
        </Typography>
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
        <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={printList} disabled={admissions.length === 0}>
          PDF
        </Button>
        <Button variant="outlined" startIcon={<GridOn />} onClick={exportExcel} disabled={admissions.length === 0}>
          Excel
        </Button>
      </Box>
    </Box>

    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 800 }}>Applicant</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Father Name</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Phone</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Guardian Phone</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Program</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Step</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Applied On</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Remark</TableCell>
            <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><CircularProgress size={26} /></TableCell></TableRow>
          ) : admissions.length === 0 ? (
            <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>No incomplete admissions found.</TableCell></TableRow>
          ) : admissions.map((a) => (
            <TableRow key={a.id} hover>
              <TableCell>
                <Typography fontWeight={700} fontSize={14}>{a.name || "Unknown"}</Typography>
                <Typography fontSize={12} color="text.secondary">{a.cnic}</Typography>
              </TableCell>
              <TableCell>{a.fatherName || "N/A"}</TableCell>
              <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{a.phone || "N/A"}</TableCell>
              <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{a.guardianPhone || "N/A"}</TableCell>
              <TableCell>{a.program || "N/A"}</TableCell>
              <TableCell><Chip size="small" label={`Step ${a.currentStep}/4`} /></TableCell>
              <TableCell>{new Date(a.appliedDate).toLocaleDateString()}</TableCell>
              <TableCell sx={{ maxWidth: 160 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography
                    fontSize={12.5}
                    color={a.remark ? "text.primary" : "text.disabled"}
                    noWrap
                    title={a.remark || ""}
                    sx={{ maxWidth: 110 }}
                  >
                    {a.remark || "No remark"}
                  </Typography>
                  <Tooltip title="Edit Remark">
                    <IconButton size="small" onClick={() => openRemarkModal(a)}>
                      <EditNote fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="View Application">
                  <IconButton size="small" onClick={() => viewApplication(a)}>
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Print Progress">
                  <IconButton size="small" onClick={() => printSingle(a)}><Print fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => openDeleteModal(a)} sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}>
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
      <Pagination
        page={page}
        onChange={(e, p) => setPage(p)}
        count={Math.max(1, Math.ceil(pagination.total / 20))}
        color="primary"
      />
    </Box>

    <DeleteAdmissionModal
      open={isDeleteModalOpen}
      admission={deleteTarget}
      remark={remark}
      setRemark={setRemark}
      onCancel={closeDeleteModal}
      onConfirm={confirmDelete}
      isDeleting={isDeleting}
    />

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

export default IncompleteAdmissionsView;
