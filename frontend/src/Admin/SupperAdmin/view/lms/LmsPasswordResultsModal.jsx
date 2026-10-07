import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ContentCopy, Check, GridOn, VpnKey } from "@mui/icons-material";
import { exportRowsToExcel } from "../../../Admission/common/pipelineExport";

const RESULT_COLUMNS = [
  { header: "Name", value: (r) => r.name },
  { header: "Roll No", value: (r) => r.rollNumber },
  { header: "LMS Email", value: (r) => r.email },
  { header: "New Password", value: (r) => r.newPassword },
];

// Shown once, right after a password reset (single or bulk) — this is the
// only moment these plaintext passwords are ever visible again, since the
// backend only stores them bcrypt-hashed from here on.
const LmsPasswordResultsModal = ({ open, results, onClose }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (result) => {
    navigator.clipboard?.writeText(result.newPassword);
    setCopiedId(result.authId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExport = () => {
    exportRowsToExcel({
      columns: RESULT_COLUMNS,
      rows: results || [],
      filename: `LMS_Password_Reset_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: "Password Reset",
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ className: "rounded-xl" }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <VpnKey color="warning" />
        Password Reset — Save These Now
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          These passwords will not be shown again once this dialog is closed. Copy or export
          them now to share with the affected student(s).
        </DialogContentText>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>New Password</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right"> </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(results || []).map((r) => (
                <TableRow key={r.authId}>
                  <TableCell>
                    <div className="font-bold text-sm">{r.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{r.rollNumber}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{r.newPassword}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={copiedId === r.authId ? "Copied!" : "Copy password"}>
                      <IconButton size="small" onClick={() => handleCopy(r)}>
                        {copiedId === r.authId ? (
                          <Check fontSize="small" color="success" />
                        ) : (
                          <ContentCopy fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button startIcon={<GridOn fontSize="small" />} onClick={handleExport} color="success">
          Export Excel
        </Button>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LmsPasswordResultsModal;
