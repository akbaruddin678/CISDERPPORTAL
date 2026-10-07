import React from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
  TextField,
  Button,
  InputAdornment,
  Paper,
  Pagination,
  Select,
  MenuItem,
  CircularProgress,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Search,
  PictureAsPdf,
  GridOn,
  Refresh,
  School,
  AccountBalance,
  AlternateEmail,
  LockReset,
  Block,
  CheckCircle,
  Close,
} from "@mui/icons-material";
import LmsAccountsTable from "./LmsAccountsTable";
import EditLmsCredentialsModal from "./EditLmsCredentialsModal";
import ToggleLmsStatusModal from "./ToggleLmsStatusModal";
import LmsPasswordResultsModal from "./LmsPasswordResultsModal";

const TAB_META = {
  college: { title: "College" },
  university: { title: "University" },
};

const LmsManagementView = ({
  activeTab,
  setActiveTab,
  searchInput,
  setSearchInput,
  accounts,
  paginationParams,
  tabCounts,
  page,
  limit,
  handlePageChange,
  handleLimitChange,
  isLoading,
  isExporting,
  refetch,
  exportPDF,
  exportExcel,

  catalogData,
  departmentId,
  programId,
  semesterId,
  handleDepartmentChange,
  handleProgramChange,
  setSemesterId,
  clearCatalogFilters,

  editTarget,
  isEditModalOpen,
  closeEditModal,
  editControl,
  editErrors,
  onEditSubmit,
  isSavingCredentials,
  openEditModal,

  statusTarget,
  isStatusModalOpen,
  closeStatusModal,
  confirmToggleStatus,
  isTogglingStatus,
  openStatusModal,

  selectedIds,
  selectedCount,
  toggleSelect,
  allVisibleSelected,
  toggleSelectAll,
  clearSelection,
  selectAllInTab,
  isSelectingAllInTab,

  handleBulkBlock,
  handleBulkUnblock,

  handleGenerateEmail,
  handleBulkGenerateEmails,
  isGeneratingEmails,

  handleResetPassword,
  handleBulkResetPasswords,
  isResettingPasswords,
  passwordResults,
  isPasswordResultsOpen,
  closePasswordResults,
}) => {
  const currentTitle = TAB_META[activeTab].title;

  return (
    <Box className="p-4 md:p-6">
      <Box className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <Box>
          <Typography variant="h5" className="font-extrabold text-gray-800">
            LMS Management
          </Typography>
          <Typography variant="body2" className="text-gray-500">
            Manage every student's Learning Management System login — separate from their
            admission account — across College and University.
          </Typography>
        </Box>
        <Box className="flex gap-2">
          <Button
            size="small"
            variant="outlined"
            startIcon={<Refresh fontSize="small" />}
            onClick={refetch}
          >
            Refresh
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={isExporting}
            startIcon={
              isExporting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <PictureAsPdf fontSize="small" />
              )
            }
            onClick={() => exportPDF(currentTitle)}
          >
            Export PDF
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="success"
            disabled={isExporting}
            startIcon={
              isExporting ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <GridOn fontSize="small" />
              )
            }
            onClick={() => exportExcel(currentTitle)}
          >
            Export Excel
          </Button>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3, overflow: "hidden" }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{ bgcolor: "grey.50", borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            value="college"
            icon={<School fontSize="small" />}
            iconPosition="start"
            label={
              <Box className="flex items-center gap-2">
                College
                <Chip size="small" label={tabCounts.college} />
              </Box>
            }
          />
          <Tab
            value="university"
            icon={<AccountBalance fontSize="small" />}
            iconPosition="start"
            label={
              <Box className="flex items-center gap-2">
                University
                <Chip size="small" label={tabCounts.university} />
              </Box>
            }
          />
        </Tabs>

        <Box className="p-4 flex flex-wrap items-center justify-between gap-3">
          <TextField
            size="small"
            fullWidth
            placeholder="Search by name, roll number, or LMS email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 420 }}
          />
          <Box className="flex items-center gap-2">
            <Typography variant="body2" className="text-gray-500 whitespace-nowrap">
              Rows per page:
            </Typography>
            <Select size="small" value={limit} onChange={handleLimitChange}>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
              <MenuItem value={200}>200</MenuItem>
            </Select>
          </Box>
        </Box>

        <Box className="px-4 pb-4 flex flex-wrap items-end gap-3">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="lms-department-filter-label">Department</InputLabel>
            <Select
              labelId="lms-department-filter-label"
              label="Department"
              value={departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
            >
              <MenuItem value="">All Departments</MenuItem>
              {catalogData.departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }} disabled={!catalogData.programs.length}>
            <InputLabel id="lms-program-filter-label">Program</InputLabel>
            <Select
              labelId="lms-program-filter-label"
              label="Program"
              value={programId}
              onChange={(e) => handleProgramChange(e.target.value)}
            >
              <MenuItem value="">All Programs</MenuItem>
              {catalogData.programs.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }} disabled={!catalogData.semesters.length}>
            <InputLabel id="lms-semester-filter-label">Semester</InputLabel>
            <Select
              labelId="lms-semester-filter-label"
              label="Semester"
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
            >
              <MenuItem value="">All Semesters</MenuItem>
              {catalogData.semesters.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  Semester {s.number}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {(departmentId || programId || semesterId) && (
            <Button size="small" startIcon={<Close fontSize="small" />} onClick={clearCatalogFilters}>
              Clear Filters
            </Button>
          )}
        </Box>
      </Paper>

      <Box className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <Typography variant="body2" className="text-gray-500">
          Showing <strong>{accounts.length}</strong> of{" "}
          <strong>{paginationParams.total}</strong> {currentTitle.toLowerCase()} accounts.
        </Typography>
        {allVisibleSelected && accounts.length > 0 && selectedCount < tabCounts[activeTab] && (
          <Button size="small" onClick={selectAllInTab} disabled={isSelectingAllInTab}>
            {isSelectingAllInTab
              ? "Selecting..."
              : `Select all ${tabCounts[activeTab]} in this tab`}
          </Button>
        )}
      </Box>

      {selectedCount > 0 && (
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            mb: 2,
            p: 1.5,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
            bgcolor: "grey.50",
          }}
        >
          <Chip label={`${selectedCount} selected`} color="primary" size="small" sx={{ mr: 1 }} />
          <Button
            size="small"
            variant="outlined"
            startIcon={<AlternateEmail fontSize="small" />}
            onClick={handleBulkGenerateEmails}
            disabled={isGeneratingEmails}
          >
            Generate Email
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<LockReset fontSize="small" />}
            onClick={handleBulkResetPasswords}
            disabled={isResettingPasswords}
          >
            Reset Password
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<Block fontSize="small" />}
            onClick={handleBulkBlock}
          >
            Block
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={<CheckCircle fontSize="small" />}
            onClick={handleBulkUnblock}
          >
            Unblock
          </Button>
          <Button
            size="small"
            color="inherit"
            startIcon={<Close fontSize="small" />}
            onClick={clearSelection}
            sx={{ ml: "auto" }}
          >
            Clear
          </Button>
        </Paper>
      )}

      <LmsAccountsTable
        accounts={accounts}
        isLoading={isLoading}
        onEdit={openEditModal}
        onToggleStatus={openStatusModal}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        allVisibleSelected={allVisibleSelected}
        toggleSelectAll={toggleSelectAll}
        onGenerateEmail={handleGenerateEmail}
        onResetPassword={handleResetPassword}
      />

      {paginationParams.totalPages > 1 && (
        <Box className="flex justify-center mt-6">
          <Pagination
            count={paginationParams.totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      <EditLmsCredentialsModal
        open={isEditModalOpen}
        onClose={closeEditModal}
        account={editTarget}
        control={editControl}
        errors={editErrors}
        onSubmit={onEditSubmit}
        isSaving={isSavingCredentials}
      />

      <ToggleLmsStatusModal
        open={isStatusModalOpen}
        target={statusTarget}
        onCancel={closeStatusModal}
        onConfirm={confirmToggleStatus}
        isLoading={isTogglingStatus}
      />

      <LmsPasswordResultsModal
        open={isPasswordResultsOpen}
        results={passwordResults}
        onClose={closePasswordResults}
      />
    </Box>
  );
};

export default LmsManagementView;
