import React, { useState } from "react";
import {
  Card,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  Divider,
  Tooltip,
} from "@mui/material";
import { Building2, GraduationCap, Library } from "lucide-react";
import { KeyboardArrowDown, KeyboardArrowUp, Edit } from "@mui/icons-material";

export const DepartmentListCard = ({
  department,
  programs,
  semesters,
  onEditDept,
  onEditProgram,
  onEditSemester,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={`transition-all duration-300 border border-gray-200 shadow-sm rounded-xl overflow-hidden ${expanded ? "ring-2 ring-blue-100" : "hover:shadow-md"}`}
    >
      <Box className="p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors">
        <Box
          className="flex items-start gap-4 cursor-pointer flex-1"
          onClick={() => setExpanded(!expanded)}
        >
          <Box className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Building2 size={24} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              className="font-bold text-gray-800 leading-tight"
            >
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
                {programs.length} Programs
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box className="flex items-center gap-1">
          <Tooltip title="Edit Department">
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onEditDept(department);
              }}
              size="small"
              color="primary"
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={expanded ? "Collapse" : "Expand"}>
            <IconButton onClick={() => setExpanded(!expanded)} size="small">
              {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <Box className="p-4 bg-gray-50/50">
          {programs.length === 0 ? (
            <Box className="p-4 text-center border border-dashed border-gray-300 rounded-lg bg-white">
              <Typography variant="body2" className="text-gray-500">
                No programs exist in this department yet.
              </Typography>
            </Box>
          ) : (
            <Box className="flex flex-col gap-4">
              {programs.map((prog) => {
                const isCollege = prog.level === "HSSC";
                const progSemesters = semesters
                  .filter(
                    (s) =>
                      s.programId?._id === prog._id || s.programId === prog._id,
                  )
                  .sort((a, b) => a.number - b.number);

                return (
                  <Box
                    key={prog._id}
                    className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
                  >
                    <Box className="flex justify-between items-start mb-3">
                      <Box className="flex items-center gap-2">
                        {isCollege ? (
                          <Library size={18} className="text-green-600" />
                        ) : (
                          <GraduationCap size={18} className="text-blue-600" />
                        )}
                        <Typography
                          variant="subtitle1"
                          className="font-bold text-gray-800"
                        >
                          {prog.name}
                        </Typography>
                      </Box>
                      <Box className="flex items-center gap-1">
                        <Chip
                          label={prog.level}
                          size="small"
                          variant="outlined"
                          color={isCollege ? "success" : "primary"}
                          className="font-bold bg-white"
                        />
                        <Tooltip title="Edit Program / Number of Semesters">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onEditProgram(prog)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Box className="mt-3 pt-3 border-t border-gray-100">
                      <Typography
                        variant="caption"
                        className="text-gray-500 font-bold mb-2 block uppercase tracking-wider"
                      >
                        {isCollege
                          ? "Academic Sessions / Parts"
                          : "Academic Semesters"}{" "}
                        (Click to Edit)
                      </Typography>

                      <Box className="flex flex-wrap gap-2">
                        {progSemesters.length === 0 ? (
                          <Typography
                            variant="caption"
                            className="text-gray-400 italic"
                          >
                            No stages generated.
                          </Typography>
                        ) : (
                          progSemesters.map((sem) => (
                            <Chip
                              key={sem._id}
                              label={sem.name}
                              size="small"
                              onClick={() => onEditSemester(sem)} // ✅ Click to rename
                              className={`font-medium cursor-pointer hover:shadow-md ${isCollege ? "bg-green-50 text-green-800 border border-green-200 hover:bg-green-100" : "bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100"}`}
                            />
                          ))
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </Collapse>
    </Card>
  );
};
