import React from "react";
import { Chip, Button, CircularProgress, Tooltip, Box } from "@mui/material";
import { School, Add } from "@mui/icons-material";
import { useGetStudentScholarshipsByStudentQuery } from "../../../accountant/api/scholarshipApi";

// One cell, one query — each row checks its OWN student independently
// (no batch endpoint exists for "active scholarship per student" outside
// challan generation, see ScholarshipService.getBatchScholarshipsForTerm
// which isn't exposed as a route). Fine at Accepted-bucket scale.
const ScholarshipCell = ({ student, onAssign }) => {
  const { data: applications, isFetching } = useGetStudentScholarshipsByStudentQuery({
    studentId: student._id,
    status: "approved",
  });

  const activeScholarship = applications?.[0];

  if (isFetching) {
    return <CircularProgress size={16} />;
  }

  if (activeScholarship) {
    return (
      <Tooltip
        title={
          activeScholarship.planType === "fixed"
            ? `Fixed discount up to Rs. ${activeScholarship.planMaxAmount}`
            : `${activeScholarship.planMaxPercentage}% discount`
        }
      >
        <Chip size="small" icon={<School fontSize="small" />} label={activeScholarship.planTitle} color="success" variant="outlined" />
      </Tooltip>
    );
  }

  return (
    <Box>
      <Button size="small" startIcon={<Add fontSize="small" />} onClick={() => onAssign(student)} sx={{ fontSize: 12 }}>
        Assign
      </Button>
    </Box>
  );
};

export default ScholarshipCell;
