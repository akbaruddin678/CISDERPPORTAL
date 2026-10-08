import React from "react";
import { Card, Typography, Box, Chip, IconButton, Button, Tooltip } from "@mui/material";
import { Building2, Layers } from "lucide-react";
import { Edit, Add, DeleteOutline } from "@mui/icons-material";

// One class: its programs, and each program's sections.
export const DepartmentListCard = ({
  department,
  programs,
  sectionsByProgram,
  onEditDept,
  onAddProgram,
  onEditProgram,
  onDeleteProgram,
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
              {programs.length} {programs.length === 1 ? "Program" : "Programs"}
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

    <Box className="px-4 pb-4 pt-3 bg-gray-50/50 border-t border-gray-100 space-y-3">
      <Box className="flex items-center justify-between">
        <Typography variant="caption" className="text-gray-500 font-bold uppercase tracking-wider">
          Programs
        </Typography>
        <Button size="small" startIcon={<Add />} onClick={() => onAddProgram(department)}>
          Add Program
        </Button>
      </Box>

      {programs.length === 0 ? (
        <Box className="p-4 text-center border border-dashed border-gray-300 rounded-lg bg-white">
          <Typography variant="body2" className="text-gray-500">
            No programs in this class yet. Add one, then add its sections.
          </Typography>
        </Box>
      ) : (
        programs.map((prog) => {
          const sections = sectionsByProgram[prog._id] || [];
          return (
            <Box key={prog._id} className="p-3 bg-white border border-gray-200 rounded-xl">
              <Box className="flex items-center justify-between gap-2">
                <Box className="flex items-center gap-2 min-w-0">
                  <Layers size={16} className="text-indigo-500 shrink-0" />
                  <Typography variant="subtitle2" className="font-bold text-gray-800 truncate">
                    {prog.name}
                  </Typography>
                  <Chip
                    label={prog.code}
                    size="small"
                    className="font-mono bg-gray-100 text-gray-600 font-bold"
                  />
                </Box>
                <Box className="flex items-center shrink-0">
                  <Tooltip title="Edit program">
                    <IconButton size="small" color="primary" onClick={() => onEditProgram(prog)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete program">
                    <IconButton size="small" color="error" onClick={() => onDeleteProgram(prog)}>
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Box className="mt-2 pt-2 border-t border-gray-100">
                <Box className="flex items-center justify-between mb-1.5">
                  <Typography variant="caption" className="text-gray-400 font-semibold">
                    Sections ({sections.length}) — click one to rename or delete
                  </Typography>
                  <Button size="small" startIcon={<Add />} onClick={() => onAddSection(department, prog)}>
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
            </Box>
          );
        })
      )}
    </Box>
  </Card>
);
