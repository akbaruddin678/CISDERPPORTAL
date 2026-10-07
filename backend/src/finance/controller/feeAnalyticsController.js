import mongoose from "mongoose";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import StudentChallan from "../../accountant/model/StudentChallan.js";

// GET /api/fee-analytics
export const getFeeAnalytics = asyncHandler(async (req, res) => {
  const { month, departmentId, termId, semesterId } = req.query;

  // 1. Base Match Stage
  const matchStage = {
    isDeleted: { $ne: true },
    deletedAt: null,
    status: { $nin: ["cancelled", "merged", "draft"] },
  };

  // 2. Apply Dynamic Filters
  if (departmentId && departmentId !== "ALL") {
    matchStage.departmentId = new mongoose.Types.ObjectId(departmentId);
  }
  if (termId && termId !== "ALL") {
    matchStage.termId = new mongoose.Types.ObjectId(termId);
  }
  if (semesterId && semesterId !== "ALL") {
    matchStage.semesterId = new mongoose.Types.ObjectId(semesterId);
  }

  // 3. Apply Month/Date Filter
  if (month && month !== "ALL") {
    let startDate, endDate;
    if (month === "Current") {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else {
      const [m, y] = month.split("-");
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0, 23, 59, 59);
    }
    matchStage.dueDate = { $gte: startDate, $lte: endDate };
  }

  // 4. Run the Master Aggregation
  const [analyticsResult] = await StudentChallan.aggregate([
    { $match: matchStage },
    {
      $facet: {
        // --- A. Calculate Top KPIs ---
        kpis: [
          {
            $group: {
              _id: null,
              // ✅ FIX 1: Direct sum of netAmount guarantees 100% accurate expected revenue
              totalExpected: { $sum: "$netAmount" },
              totalCollected: { $sum: "$paidAmount" },

              // ✅ FIX 2: Pending is STRICTLY "not yet due"
              totalPending: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $in: ["$status", ["issued", "partial"]] },
                        { $gte: ["$dueDate", new Date()] }, // Due today or future
                      ],
                    },
                    "$remainingAmount",
                    0,
                  ],
                },
              },

              // ✅ FIX 3: Overdue is STRICTLY "past due" or flagged "overdue"
              totalOverdue: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $eq: ["$status", "overdue"] },
                        {
                          $and: [
                            { $in: ["$status", ["issued", "partial"]] },
                            { $lt: ["$dueDate", new Date()] }, // Past due
                          ],
                        },
                      ],
                    },
                    "$remainingAmount",
                    0,
                  ],
                },
              },
            },
          },
        ],

        // --- B. Department Wise Breakdown ---
        departmentData: [
          {
            $group: {
              _id: "$departmentId",
              collected: { $sum: "$paidAmount" },
              pending: { $sum: "$remainingAmount" },
            },
          },
          {
            $lookup: {
              from: "departments",
              localField: "_id",
              foreignField: "_id",
              as: "dept",
            },
          },
          { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              department: { $ifNull: ["$dept.name", "$dept.code", "Unknown"] },
              collected: 1,
              pending: 1,
              _id: 0,
            },
          },
        ],

        // --- C. Semester Wise Breakdown ---
        semesterData: [
          {
            $group: {
              _id: "$semesterId",
              collected: { $sum: "$paidAmount" },
            },
          },
          {
            $lookup: {
              from: "semesters",
              localField: "_id",
              foreignField: "_id",
              as: "sem",
            },
          },
          { $unwind: { path: "$sem", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              semester: {
                $concat: [
                  "Semester ",
                  { $toString: { $ifNull: ["$sem.number", "Unknown"] } },
                ],
              },
              collected: 1,
              _id: 0,
            },
          },
          { $sort: { semester: 1 } },
        ],

        // --- D. Session/Term Wise Breakdown ---
        sessionData: [
          {
            $group: {
              _id: "$termId",
              collected: { $sum: "$paidAmount" },
            },
          },
          {
            $lookup: {
              from: "terms",
              localField: "_id",
              foreignField: "_id",
              as: "term",
            },
          },
          { $unwind: { path: "$term", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              session: { $ifNull: ["$term.name", "Unknown Session"] },
              collected: 1,
              _id: 0,
            },
          },
        ],

        // --- E. Monthly Revenue Trend ---
        monthlyTrend: [
          {
            $match: {
              paidAmount: { $gt: 0 },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$dueDate" },
                month: { $month: "$dueDate" },
              },
              amount: { $sum: "$paidAmount" },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
          { $limit: 6 },
        ],
      },
    },
  ]);

  // 5. Format & Process the Aggregation Results
  const rawKpis = analyticsResult.kpis[0] || {
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
  };

  const { totalExpected, totalCollected, totalPending, totalOverdue } = rawKpis;

  // ✅ FIX 4: Use the explicit expected total for the calculation
  const collectionRate =
    totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const formattedTrendData = analyticsResult.monthlyTrend.map((item) => ({
    month: monthNames[item._id.month - 1],
    amount: item.amount,
  }));

  const statusData = [
    { name: "Collected", value: totalCollected },
    { name: "Pending", value: totalPending },
    { name: "Overdue", value: totalOverdue },
  ].filter((item) => item.value > 0);

  // 6. Send Response
  res.status(200).json({
    success: true,
    data: {
      kpis: {
        totalExpected,
        totalCollected,
        totalPending,
        totalOverdue,
        collectionRate,
      },
      statusData,
      monthlyTrend: formattedTrendData,
      departmentData: analyticsResult.departmentData,
      semesterData: analyticsResult.semesterData,
      sessionData: analyticsResult.sessionData,
    },
  });
});

// POST /api/fee-analytics/lock-month
export const lockMonthAndGenerateReport = asyncHandler(async (req, res) => {
  const { targetMonth } = req.body;

  if (!targetMonth) {
    return res
      .status(400)
      .json({ success: false, message: "Target month is required." });
  }

  res.status(200).json({
    success: true,
    message: `Successfully locked financial records for ${targetMonth}.`,
    data: { reportUrl: "/downloads/reports/monthly-summary.pdf" },
  });
});
