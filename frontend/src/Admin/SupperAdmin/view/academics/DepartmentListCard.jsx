import React from "react";
import { Card, Typography, Box, Chip, IconButton, Button, Tooltip } from "@mui/material";
import { Building2 } from "lucide-react";
import { Edit, Add } from "@mui/icons-material";

export const DepartmentListCard = ({
  department,
  sections,
  onEditDept,
  onAddSection,
  onEditSection,
}) => (
  <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
    <Box className="p-4 flex items-center justify-between bg-white">
      <Box className="flex items-start gap-4">
        <Box className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
          <Building2 size={24} />
        </Box>
        <Box>
          <Typography variant="h6" className="font-bold text-gray-800 leading-tight">
            {department.name}
          </Typography>
          <Box className="flex items-center gap-2 mt-1.5">
            <Chip
              label={department.code}
              size="small"
              className="font-mono bg-gray-100 text-gray-700 font-bold"
            />
            <Typography
              variant="caption"
              className="text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full"
            >
              {sections.length} {sections.length === 1 ? "Section" : "Sections"}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Tooltip title="Edit Class">
        <IconButton onClick={() => onEditDept(department)} size="small" color="primary">
          <Edit fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>

    <Box className="px-4 pb-4 pt-3 bg-gray-50/50 border-t border-gray-100">
      <Box className="flex items-center justify-between mb-2">
        <Typography variant="caption" className="text-gray-500 font-bold uppercase tracking-wider">
          Sections (click to rename or delete)
        </Typography>
        <Button size="small" startIcon={<Add />} onClick={() => onAddSection(department)}>
          Add Section
        </Button>
      </Box>
      <Box className="flex flex-wrap gap-2">
        {sections.length === 0 ? (
          <Typography variant="caption" className="text-gray-400 italic">
            No sections yet.
          </Typography>
        ) : (
          sections.map((sec) => (
            <Chip
              key={sec._id}
              label={sec.name}
              size="small"
              onClick={() => onEditSection(sec)}
              className="font-medium cursor-pointer bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100"
            />
          ))
        )}
      </Box>
    </Box>
  </Card>
);
