import React from "react";
import { Box, Chip, Tooltip } from "@mui/material";

// Read-only — purely informational. Nothing here disables Save; staff keep
// full manual override ability on this screen (see
// useStudentCourseRegistrationController.js's credit-limit logic for the
// one hard block that DOES exist here).
const CourseAvailabilityChips = ({ course }) => {
  const missingPrerequisites = course?.missingPrerequisites || [];
  const sections = course?.sections || [];

  if (!missingPrerequisites.length && !sections.length) return null;

  return (
    <Tooltip title="Informational only — this does not block Save." arrow placement="top">
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
        {missingPrerequisites.length > 0 && (
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            label={`Prereq not met: ${missingPrerequisites.map((p) => p.code).join(", ")}`}
          />
        )}
        {sections.map((section) => (
          <Chip
            key={section.assignmentId}
            size="small"
            variant="outlined"
            color={section.seatsRemaining === 0 ? "error" : "default"}
            label={`Sec ${section.section}: ${section.enrolled}/${section.capacity} seats`}
          />
        ))}
      </Box>
    </Tooltip>
  );
};

export default CourseAvailabilityChips;
