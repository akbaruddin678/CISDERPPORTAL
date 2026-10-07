import { asyncHandler } from "../middleware/asyncHandler.js";
import { RevenueExplorerService } from "../services/revenueExplorer.service.js";

export const getGroupedRevenue = asyncHandler(async (req, res) => {
  const { month, year, groupBy, departmentId, programId, scope } = req.query;
  const result = await RevenueExplorerService.getGroupedRevenue({
    month,
    year,
    groupBy,
    departmentId,
    programId,
    scope,
  });
  res.status(200).json({ success: true, data: result });
});

export const getSemesterStudents = asyncHandler(async (req, res) => {
  const { semesterId, month, year } = req.query;
  if (!semesterId) {
    return res
      .status(400)
      .json({ success: false, message: "semesterId is required" });
  }
  const result = await RevenueExplorerService.getSemesterStudents({
    semesterId,
    month,
    year,
  });
  res.status(200).json({ success: true, data: result });
});
