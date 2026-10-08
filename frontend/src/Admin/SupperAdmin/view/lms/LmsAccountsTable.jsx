import React from "react";
import {
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
  CircularProgress,
  Checkbox,
} from "@mui/material";
import { Edit, Block, CheckCircle, AlternateEmail, LockReset } from "@mui/icons-material";

const STATUS_COLOR = {
  ACTIVE: "success",
  BLOCKED: "error",
  PENDING: "warning",
};

const formatLastLogin = (value) => {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const LmsAccountsTable = ({
  accounts,
  isLoading,
  onEdit,
  onToggleStatus,
  selectedIds,
  toggleSelect,
  allVisibleSelected,
  toggleSelectAll,
  onGenerateEmail,
  onResetPassword,
}) => (
  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: "grey.50" }}>
          <TableCell padding="checkbox">
            <Checkbox
              size="small"
              checked={allVisibleSelected}
              indeterminate={!allVisibleSelected && accounts.some((a) => selectedIds?.has(a._id))}
              onChange={toggleSelectAll}
              disabled={accounts.length === 0}
            />
          </TableCell>
          <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
          <TableCell sx={{ fontWeight: 800 }}>LMS Email</TableCell>
          <TableCell sx={{ fontWeight: 800 }}>Program</TableCell>
          <TableCell sx={{ fontWeight: 800 }}>Session / Section</TableCell>
          <TableCell sx={{ fontWeight: 800 }}>LMS Status</TableCell>
          <TableCell sx={{ fontWeight: 800 }}>Fee Status</TableCell>
          <TableCell sx={{ fontWeight: 800 }}>Last Login</TableCell>
          <TableCell sx={{ fontWeight: 800 }} align="right">
            Actions
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
              <CircularProgress size={26} />
            </TableCell>
          </TableRow>
        ) : accounts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} align="center" sx={{ py: 6, color: "text.secondary" }}>
              No LMS accounts found.
            </TableCell>
          </TableRow>
        ) : (
          accounts.map((a) => (
            <TableRow key={a._id} hover selected={selectedIds?.has(a._id)}>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={selectedIds?.has(a._id) || false}
                  onChange={() => toggleSelect(a._id)}
                />
              </TableCell>
              <TableCell>
                <div className="font-bold text-sm text-gray-800">{a.name}</div>
                <div className="text-xs text-gray-500 font-mono">{a.rollNumber}</div>
              </TableCell>
              <TableCell className="font-mono text-xs">{a.email || "N/A"}</TableCell>
              <TableCell>
                <div className="text-sm">{a.program?.name || "N/A"}</div>
                <div className="text-xs text-gray-400">{a.department}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm">{a.session}</div>
                <div className="text-xs text-gray-400">
                  {a.semester ? `Section ${a.semester}` : "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={a.status}
                  color={STATUS_COLOR[a.status] || "default"}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={a.feePendingForSemester ? "Pending" : "Paid"}
                  color={a.feePendingForSemester ? "warning" : "success"}
                  variant="outlined"
                />
              </TableCell>
              <TableCell className="text-xs text-gray-500">
                {formatLastLogin(a.lastLogin)}
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Edit LMS Email / Password">
                  <IconButton size="small" onClick={() => onEdit(a)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Generate LMS Email (<rollnumber>@cisd.edu.pk)">
                  <IconButton size="small" onClick={() => onGenerateEmail(a)}>
                    <AlternateEmail fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reset Password (auto-generate)">
                  <IconButton size="small" onClick={() => onResetPassword(a)}>
                    <LockReset fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={a.status === "ACTIVE" ? "Block Account" : "Unblock Account"}>
                  <IconButton
                    size="small"
                    onClick={() => onToggleStatus(a)}
                    sx={{
                      color: "text.disabled",
                      "&:hover": {
                        color: a.status === "ACTIVE" ? "error.main" : "success.main",
                      },
                    }}
                  >
                    {a.status === "ACTIVE" ? (
                      <Block fontSize="small" />
                    ) : (
                      <CheckCircle fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

export default LmsAccountsTable;
