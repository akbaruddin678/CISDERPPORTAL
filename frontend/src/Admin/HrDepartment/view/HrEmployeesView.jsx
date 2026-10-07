import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Fade,
  Checkbox,
  FormControlLabel,
  IconButton,
  Menu,
  ListItemIcon,
  ListSubheader,
} from "@mui/material";
import {
  Search,
  UserPlus,
  Shield,
  Power,
  PowerOff,
  MoreVertical,
  Trash2,
  Briefcase,
} from "lucide-react";
import {
  ROLE_GROUPS,
  isKnownRole,
  roleLabel,
  groupOfRole,
  needsDepartment,
} from "../common/staffRoles";

const TEACHING_GROUP = "Teaching & Academic";

const RowActionMenu = ({
  row,
  onView,
  onManageRoles,
  onToggleStatus,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const status = row.userId?.status || "active";

  const execute = (actionFn) => {
    setAnchorEl(null);
    actionFn(row);
  };

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertical size={18} color="#64748b" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            minWidth: 180,
            borderRadius: 2,
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            fontFamily: "'Montserrat', sans-serif",
          },
        }}
      >
        <MenuItem
          onClick={() => execute(onView)}
          sx={{ fontSize: 13, fontWeight: 500 }}
        >
          <ListItemIcon>
            <Briefcase size={16} color="#475569" />
          </ListItemIcon>{" "}
          View / Edit Profile
        </MenuItem>
        <MenuItem
          onClick={() => execute(onManageRoles)}
          sx={{ fontSize: 13, fontWeight: 500 }}
        >
          <ListItemIcon>
            <Shield size={16} color="#2563eb" />
          </ListItemIcon>{" "}
          Manage Access / Dept
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onToggleStatus(row);
          }}
          sx={{ fontSize: 13, fontWeight: 500 }}
        >
          <ListItemIcon>
            {status === "active" ? (
              <PowerOff size={16} color="#d97706" />
            ) : (
              <Power size={16} color="#059669" />
            )}
          </ListItemIcon>
          {status === "active" ? "Deactivate Account" : "Activate Account"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete(row);
          }}
          sx={{ fontSize: 13, fontWeight: 500, color: "#dc2626" }}
        >
          <ListItemIcon>
            <Trash2 size={16} color="#dc2626" />
          </ListItemIcon>{" "}
          Delete Employee
        </MenuItem>
      </Menu>
    </>
  );
};

const HrEmployeesView = ({
  departments,
  filteredStaff,
  isFetchingStaff,
  allStaff,
  lockedModule,
  moduleStaff,
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  deptFilter,
  setDeptFilter,
  modals,
  setModals,
  selectedStaff,
  legacyRoles,
  roleFormError,
  navigateToProfile,
  navigateToOnboard,
  roleForm,
  setRoleForm,
  openRoleModal,
  handleToggleRole,
  handleSaveRoles,
  isUpdatingRoles,
  handleToggleStatus,
  handleDeleteStaff,
}) => {
  const getInitials = (name) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)
      : "EM";
  const getStaffName = (staff) => staff?.personalInfo?.name || "Unknown";
  const getStaffEmail = (staff) => staff?.userId?.email || "No email";

  const getRoleChipColor = (roleId) => {
    const group = groupOfRole(roleId);
    if (group === TEACHING_GROUP) return { bg: "#eff6ff", text: "#1d4ed8" };
    if (group === "Administration & Finance")
      return { bg: "#f5f3ff", text: "#6d28d9" };
    if (!group) return { bg: "#fff7ed", text: "#9a3412" };
    return { bg: "#f1f5f9", text: "#475569" };
  };

  const hasRoleIn = (staff, groupName) =>
    (staff.userId?.roles || []).some((r) => groupOfRole(r) === groupName);

  return (
    <Fade in={true} timeout={600}>
      <Box
        sx={{
          p: { xs: 2, md: 4 },
          minHeight: "100vh",
          bgcolor: "#f8fafc",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        {/* ── Header ── */}
        <Box
          mb={4}
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          flexWrap="wrap"
          gap={3}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
              color="#0f172a"
              sx={{ fontFamily: "'Aleo', serif" }}
            >
              {lockedModule ? lockedModule.label : "Staff & Faculty Directory"}
            </Typography>
            <Typography
              variant="body2"
              color="#64748b"
              mt={0.5}
              sx={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {lockedModule
                ? `Everyone currently holding this role. Changing someone's role via "Manage Access/Dept" moves them in or out of this list automatically.`
                : `Every registered staff account — admins, students and applicants are not listed. Use "Change Role" to make someone a teacher or give them any other role.`}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<UserPlus size={16} />}
            onClick={navigateToOnboard}
            sx={{
              bgcolor: "#2563eb",
              fontWeight: 600,
              boxShadow: 1,
              borderRadius: 2,
              textTransform: "none",
              fontFamily: "'Montserrat', sans-serif",
            }}
          >
            + Add New
          </Button>
        </Box>

        {/* ── Stats Summary ── */}
        <Box
          display="grid"
          gridTemplateColumns="repeat(auto-fit, minmax(180px, 1fr))"
          gap={2}
          mb={4}
        >
          {(lockedModule
            ? [
                {
                  label: `Total ${lockedModule.label.replace(" Management", "")}`,
                  value: moduleStaff.length,
                  color: "#1e40af",
                },
                {
                  label: "Active",
                  value: moduleStaff.filter((s) => (s.userId?.status || "active") === "active").length,
                  color: "#15803d",
                },
                {
                  label: "Deactivated",
                  value: moduleStaff.filter((s) => s.userId?.status === "disabled").length,
                  color: "#b45309",
                },
              ]
            : [
                {
                  label: "Total Workforce",
                  value: allStaff.length,
                  color: "#1e40af",
                },
                {
                  label: "Teaching & Academic",
                  value: allStaff.filter((s) => hasRoleIn(s, TEACHING_GROUP)).length,
                  color: "#15803d",
                },
                {
                  label: "Admin & Support",
                  value: allStaff.filter((s) => !hasRoleIn(s, TEACHING_GROUP)).length,
                  color: "#6d28d9",
                },
                {
                  label: "Deactivated",
                  value: allStaff.filter((s) => s.userId?.status === "disabled")
                    .length,
                  color: "#b45309",
                },
              ]
          ).map((stat) => (
            <Paper
              key={stat.label}
              elevation={0}
              sx={{
                p: 2.5,
                border: "1px solid #e2e8f0",
                borderRadius: 3,
                bgcolor: "#ffffff",
              }}
            >
              <Typography
                fontSize={12}
                fontWeight={700}
                color="#64748b"
                textTransform="uppercase"
                letterSpacing={0.5}
                sx={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {stat.label}
              </Typography>
              <Typography
                fontSize={28}
                fontWeight={800}
                color={stat.color}
                mt={1}
                sx={{ fontFamily: "'Aleo', serif" }}
              >
                {stat.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* ── Filters ── */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            bgcolor: "#ffffff",
          }}
        >
          <TextField
            size="small"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flexGrow: 1,
              minWidth: 250,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                fontFamily: "'Montserrat', sans-serif",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color="#94a3b8" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            label="Filter by Department"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            sx={{
              minWidth: 220,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                fontFamily: "'Montserrat', sans-serif",
              },
            }}
          >
            <MenuItem value="ALL">All Units & Departments</MenuItem>
            <MenuItem
              value="NONE"
              sx={{ color: "#64748b", fontStyle: "italic" }}
            >
              No Department (Admin/Support)
            </MenuItem>
            {departments.map((d) => (
              <MenuItem key={d._id} value={d._id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
          {!lockedModule && (
            <TextField
              select
              size="small"
              label="Filter by Role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{
                minWidth: 220,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  fontFamily: "'Montserrat', sans-serif",
                },
              }}
            >
              <MenuItem value="ALL" sx={{ fontWeight: 700 }}>
                All Roles
              </MenuItem>
              {Object.entries(ROLE_GROUPS).map(([group, roles]) => [
                <ListSubheader
                  key={group}
                  sx={{
                    fontWeight: 800,
                    color: "#0f172a",
                    bgcolor: "#f8fafc",
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  {group}
                </ListSubheader>,
                ...roles.map((r) => (
                  <MenuItem
                    key={r.id}
                    value={r.id}
                    sx={{ pl: 4, fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {r.label}
                  </MenuItem>
                )),
              ])}
            </TextField>
          )}
        </Paper>

        {/* ── Data Table ── */}
        <Paper
          elevation={0}
          sx={{
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: "#ffffff",
          }}
        >
          {isFetchingStaff ? (
            <Box py={10} textAlign="center">
              <CircularProgress size={32} sx={{ color: "#2563eb" }} />
            </Box>
          ) : filteredStaff.length === 0 ? (
            <Box py={10} textAlign="center" color="#94a3b8">
              <Typography sx={{ fontFamily: "'Montserrat', sans-serif" }}>
                No employees found matching criteria.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    {[
                      "Employee Details",
                      "Unit / Department",
                      "System Roles",
                      "Status",
                    ].map((h) => (
                      <TableCell
                        key={h}
                        align={h === "Status" ? "center" : "left"}
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#64748b",
                          textTransform: "uppercase",
                          fontFamily: "'Montserrat', sans-serif",
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                    <TableCell
                      align="right"
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                        fontFamily: "'Montserrat', sans-serif",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStaff.map((row) => {
                    const name = getStaffName(row);
                    const email = getStaffEmail(row);
                    const roles = row.userId?.roles || [];
                    const status = row.userId?.status || "active";

                    return (
                      <TableRow
                        key={row._id || row.userId?._id}
                        hover
                        sx={{ "& td": { borderBottom: "1px solid #f1f5f9" } }}
                      >
                        <TableCell
                          onClick={() => navigateToProfile(row)}
                          sx={{ cursor: "pointer" }}
                        >
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar
                              sx={{
                                bgcolor: "#e2e8f0",
                                color: "#475569",
                                fontWeight: 700,
                                width: 40,
                                height: 40,
                                fontSize: 14,
                                fontFamily: "'Montserrat', sans-serif",
                              }}
                            >
                              {getInitials(name)}
                            </Avatar>
                            <Box>
                              <Typography
                                fontWeight={700}
                                fontSize={14}
                                color="#0f172a"
                                sx={{ fontFamily: "'Montserrat', sans-serif" }}
                              >
                                {name}
                              </Typography>
                              <Typography
                                fontSize={12}
                                color="#64748b"
                                sx={{ fontFamily: "'Montserrat', sans-serif" }}
                              >
                                {row.employeeId || email}
                              </Typography>
                              {row.hasProfile === false && (
                                <Typography
                                  fontSize={11}
                                  fontWeight={700}
                                  color="#b45309"
                                  sx={{ fontFamily: "'Montserrat', sans-serif" }}
                                >
                                  No HR profile yet
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            fontSize={13}
                            fontWeight={700}
                            color="#334155"
                            sx={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {row.departmentId?.name ||
                              "Administrative / Non-Dept"}
                          </Typography>
                          {row.designation && (
                            <Typography
                              fontSize={12}
                              color="#059669"
                              fontWeight={600}
                              sx={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              {row.designation}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box
                            display="flex"
                            gap={0.5}
                            flexWrap="wrap"
                            maxWidth={220}
                          >
                            {roles.length === 0 ? (
                              <Typography fontSize={12} color="error">
                                No Access
                              </Typography>
                            ) : (
                              roles.map((r) => {
                                const colors = getRoleChipColor(r);
                                return (
                                  <Chip
                                    key={r}
                                    size="small"
                                    label={
                                      isKnownRole(r)
                                        ? roleLabel(r)
                                        : `${roleLabel(r)} (legacy)`
                                    }
                                    sx={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      height: 22,
                                      bgcolor: colors.bg,
                                      color: colors.text,
                                      textTransform: "capitalize",
                                      fontFamily: "'Montserrat', sans-serif",
                                    }}
                                  />
                                );
                              })
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={status.toUpperCase()}
                            sx={{
                              fontSize: 10,
                              fontWeight: 800,
                              height: 22,
                              bgcolor:
                                status === "active" ? "#dcfce7" : "#fef2f2",
                              color:
                                status === "active" ? "#166534" : "#991b1b",
                              fontFamily: "'Montserrat', sans-serif",
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Shield size={14} />}
                            onClick={() => openRoleModal(row)}
                            sx={{
                              mr: 0.5,
                              textTransform: "none",
                              fontWeight: 700,
                              borderRadius: 2,
                              fontFamily: "'Montserrat', sans-serif",
                            }}
                          >
                            Change Role
                          </Button>
                          <RowActionMenu
                            row={row}
                            onView={navigateToProfile}
                            onManageRoles={openRoleModal}
                            onToggleStatus={handleToggleStatus}
                            onDelete={handleDeleteStaff}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* ── MODAL 2: Roles & Department ── */}
        <Dialog
          open={modals.roles}
          onClose={() => setModals({ ...modals, roles: false })}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ fontFamily: "'Montserrat', sans-serif" }}>
            <Typography fontWeight={800} fontSize={18} sx={{ fontFamily: "'Aleo', serif" }}>
              Change Role
            </Typography>
            <Typography fontSize={13} color="#64748b" fontWeight={600}>
              {selectedStaff?.personalInfo?.name || "Employee"} ·{" "}
              {selectedStaff?.userId?.email}
            </Typography>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ py: 3, bgcolor: "#f8fafc" }}>
            <Typography
              fontSize={12}
              color="#64748b"
              mb={2}
              sx={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Tick every role this person should have. They can open the
              matching portal the next time they sign in.
            </Typography>

            {Object.entries(ROLE_GROUPS).map(([group, roles]) => (
              <Box key={group} mb={2.5}>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  color="#94a3b8"
                  textTransform="uppercase"
                  letterSpacing={1}
                  sx={{ fontFamily: "'Montserrat', sans-serif", display: "block", mb: 1 }}
                >
                  {group}
                </Typography>
                <Box display="grid" gap={1}>
                  {roles.map((role) => {
                    const checked = roleForm.roles.includes(role.id);
                    return (
                      <FormControlLabel
                        key={role.id}
                        sx={{
                          m: 0,
                          px: 1.5,
                          py: 0.5,
                          width: "100%",
                          border: "1px solid",
                          borderRadius: 2,
                          bgcolor: checked ? "#eff6ff" : "#ffffff",
                          borderColor: checked ? "#2563eb" : "#e2e8f0",
                          "&:hover": { borderColor: "#93c5fd" },
                        }}
                        control={
                          <Checkbox
                            checked={checked}
                            onChange={() => handleToggleRole(role.id)}
                            size="small"
                          />
                        }
                        label={
                          <Box>
                            <Typography
                              fontSize={13}
                              fontWeight={700}
                              sx={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              {role.label}
                            </Typography>
                            <Typography
                              fontSize={11.5}
                              color="#64748b"
                              sx={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              {role.hint}
                            </Typography>
                          </Box>
                        }
                      />
                    );
                  })}
                </Box>
              </Box>
            ))}

            {legacyRoles.length > 0 && (
              <Typography
                fontSize={12}
                color="#9a3412"
                mb={2.5}
                sx={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Also holds old role(s) that can't be edited here and will be
                kept as-is: {legacyRoles.map((r) => roleLabel(r)).join(", ")}.
              </Typography>
            )}

            <Typography
              variant="subtitle2"
              fontWeight={800}
              mb={1}
              sx={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Department{needsDepartment(roleForm.roles) ? " *" : ""}
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={roleForm.departmentId}
              onChange={(e) =>
                setRoleForm({ ...roleForm, departmentId: e.target.value })
              }
              error={Boolean(roleFormError)}
              helperText={
                roleFormError ||
                (needsDepartment(roleForm.roles)
                  ? "Teacher / HOD work inside this department."
                  : "Optional — leave empty for administrative or support staff.")
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: "#fff",
                  fontFamily: "'Montserrat', sans-serif",
                },
              }}
            >
              <MenuItem value="" sx={{ color: "#64748b", fontStyle: "italic" }}>
                No department
              </MenuItem>
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5, bgcolor: "#ffffff" }}>
            <Button
              onClick={() => setModals({ ...modals, roles: false })}
              sx={{
                fontWeight: 700,
                color: "#64748b",
                fontFamily: "'Montserrat', sans-serif",
                textTransform: "none",
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveRoles}
              disabled={isUpdatingRoles || Boolean(roleFormError)}
              sx={{
                bgcolor: "#2563eb",
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: "none",
                px: 4,
                fontFamily: "'Montserrat', sans-serif",
                textTransform: "none",
              }}
            >
              Save Role
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default HrEmployeesView;
