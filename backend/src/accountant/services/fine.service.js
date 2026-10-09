import mongoose from 'mongoose';
import StudentChallan from '../model/StudentChallan.js';
import FineHistory from '../model/FineHistory.js';
import { AppError } from '../middleware/errorHandler.js';
import { StudentChallanService } from './studentChallan.service.js';

export class FineService {
  static async applyToChallan(challanId, data) {
    const { fineAmount, reason, remarks, appliedBy } = data;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const challan = await StudentChallan.findById(challanId).session(session);
      if (!challan) {
        throw new AppError("Challan not found", 404);
      }

      if (challan.status === "paid") {
        throw new AppError("Cannot apply fine to paid challan", 400);
      }

      if (fineAmount <= 0) {
        throw new AppError("Fine amount must be greater than 0", 400);
      }

      // Apply fine to challan
      challan.fineAmount = (challan.fineAmount || 0) + fineAmount;
      challan.netAmount =
        challan.originalTotal -
        (challan.scholarshipAmount || 0) +
        challan.fineAmount;
      challan.remainingAmount = challan.netAmount - (challan.paidAmount || 0);

      // Update remarks
      if (remarks) {
        challan.remarks =
          `${challan.remarks || ""} Fine applied: ₹${fineAmount}. ${remarks}`.trim();
      }

      await challan.save({ session });

      // Record fine history
      const fineHistory = new FineHistory({
        challanId,
        studentId: challan.studentId,
        fineAmount,
        reason: reason || "Manual fine application",
        calculatedAt: new Date(),
        status: "pending",
        appliedBy,
      });

      await fineHistory.save({ session });

      await session.commitTransaction();

      // Populate response
      const updatedChallan = await StudentChallan.findById(challanId)
        .populate("studentId", "studentId personalInfo")
        .populate("programId", "name code")
        .populate("departmentId", "name code");

      return {
        appliedFine: fineAmount,
        updatedChallan,
        fineHistory: fineHistory,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async payFine(challanId, data) {
    const { amount, paymentMethod, transactionId, remarks, collectedBy } = data;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const challan = await StudentChallan.findById(challanId).session(session);
      if (!challan) {
        throw new AppError("Challan not found", 404);
      }

      if (challan.fineAmount <= 0) {
        throw new AppError("No fine to pay", 400);
      }

      if (amount <= 0 || amount > challan.fineAmount) {
        throw new AppError("Invalid payment amount", 400);
      }

      // Update challan fine amount
      challan.fineAmount -= amount;
      challan.netAmount =
        challan.originalTotal -
        (challan.scholarshipAmount || 0) +
        challan.fineAmount;
      challan.remainingAmount = challan.netAmount - (challan.paidAmount || 0);

      if (remarks) {
        challan.remarks =
          `${challan.remarks || ""} Fine paid: ₹${amount}. ${remarks}`.trim();
      }

      await challan.save({ session });

      // Update fine history
      await FineHistory.findOneAndUpdate(
        {
          challanId,
          status: "pending",
          fineAmount: { $gte: amount },
        },
        {
          $inc: { fineAmount: -amount },
          status: challan.fineAmount > 0 ? "partial" : "paid",
          paidAt: new Date(),
          collectedBy,
        },
        { session, new: true },
      );

      await session.commitTransaction();

      const updatedChallan = await StudentChallan.findById(challanId)
        .populate("studentId", "studentId personalInfo")
        .populate("programId", "name code")
        .populate("departmentId", "name code");

      return {
        paidAmount: amount,
        remainingFine: challan.fineAmount,
        updatedChallan,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async waiveFine(challanId, data) {
    const { reason, remarks, waivedBy } = data;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const challan = await StudentChallan.findById(challanId).session(session);
      if (!challan) {
        throw new AppError("Challan not found", 404);
      }

      if (challan.fineAmount <= 0) {
        throw new AppError("No fine to waive", 400);
      }

      const waivedAmount = challan.fineAmount;

      // Update challan
      challan.fineAmount = 0;
      challan.netAmount =
        challan.originalTotal - (challan.scholarshipAmount || 0);
      challan.remainingAmount = challan.netAmount - (challan.paidAmount || 0);

      if (remarks) {
        challan.remarks =
          `${challan.remarks || ""} Fine waived: ₹${waivedAmount}. ${remarks}`.trim();
      }

      await challan.save({ session });

      // Record waiver in fine history
      const fineHistory = new FineHistory({
        challanId,
        studentId: challan.studentId,
        fineAmount: -waivedAmount, // Negative amount indicates waiver
        reason: reason || "Fine waiver",
        remarks: `Fine waived: ${remarks || "No reason provided"}`,
        calculatedAt: new Date(),
        status: "waived",
        appliedBy: waivedBy,
      });

      await fineHistory.save({ session });

      await session.commitTransaction();

      const updatedChallan = await StudentChallan.findById(challanId)
        .populate("studentId", "studentId personalInfo")
        .populate("programId", "name code")
        .populate("departmentId", "name code");

      return {
        waivedAmount,
        updatedChallan,
        fineHistory,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getOverdueChallans(filters = {}) {
    const { page = 1, limit = 10, ...query } = filters;
    const skip = (page - 1) * limit;

    const today = new Date();

    // 🔥 BUG FIX 1: Added 'overdue' and uppercase variations to the status array!
    const overdueFilter = {
      status: {
        $in: ["issued", "partial", "overdue", "ISSUED", "PARTIAL", "OVERDUE"],
      },
      dueDate: { $lt: today },
      remainingAmount: { $gt: 0 },
    };

    // 🔥 BUG FIX 2: Safely convert strings to Mongoose ObjectIds
    if (
      query.departmentId &&
      mongoose.Types.ObjectId.isValid(query.departmentId)
    ) {
      overdueFilter.departmentId = new mongoose.Types.ObjectId(
        query.departmentId,
      );
    }
    if (query.programId && mongoose.Types.ObjectId.isValid(query.programId)) {
      overdueFilter.programId = new mongoose.Types.ObjectId(query.programId);
    } else if (query.scope) {
      // This endpoint is shared by both the University and College of
      // Intermediate Studies reports — without this, "college" scope had
      // no effect at all (no programId/scope filter existed here whatsoever),
      // so the COIS Overdue Challans report silently depended entirely on
      // departmentId to exclude university students, with no fallback.
      const validProgramIds =
        await StudentChallanService.getProgramIdsForScope(query.scope);
      overdueFilter.programId = { $in: validProgramIds };
    }
    if (query.termId && mongoose.Types.ObjectId.isValid(query.termId)) {
      overdueFilter.termId = new mongoose.Types.ObjectId(query.termId);
    }

    const challans = await StudentChallan.find(overdueFilter)
     .populate({
        path: "studentId",
        select: "studentId personalInfo",
        populate: { path: "personalInfo", select: "fullName" }
      })
      .populate('programId', 'name code')
      .populate('departmentId', 'name code')
      .populate('semesterId', 'number')
      .populate('termId', 'name code')
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate days overdue and add to response
    const challansWithOverdue = challans.map((challan) => {
      const daysOverdue = Math.floor(
        (today - challan.dueDate) / (1000 * 60 * 60 * 24),
      );
      return {
        ...challan.toObject(),
        daysOverdue,
        isOverdue: daysOverdue > 0,
      };
    });

    const total = await StudentChallan.countDocuments(overdueFilter);

    // Calculate statistics
    const stats = await StudentChallan.aggregate([
      { $match: overdueFilter },
      {
        $group: {
          _id: null,
          totalOverdueAmount: { $sum: "$remainingAmount" },
          totalFineAmount: { $sum: "$fineAmount" },
          averageDaysOverdue: {
            $avg: {
              $divide: [
                { $subtract: [today, "$dueDate"] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
          challanCount: { $sum: 1 },
        },
      },
    ]);

    const statistics = stats[0] || {
      totalOverdueAmount: 0,
      totalFineAmount: 0,
      averageDaysOverdue: 0,
      challanCount: 0,
    };

    return {
      data: challansWithOverdue,
      statistics,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    };
  }

  static async processOverdue() {
    const result = await StudentChallanService.processOverdueChallansAutomatically();
    return {
      processed: result.processedCount,
      cancelledAdmissions: result.cancelledAdmissions,
      message: `Updated ${result.processedCount} overdue challans using their saved fine schedules`,
    };
  }

  static async getFineHistory(filters = {}) {
    const { page = 1, limit = 10, ...query } = filters;
    const skip = (page - 1) * limit;

    const fineHistory = await FineHistory.find(query)
      .populate("challanId", "challanNo dueDate")
      .populate("studentId", "studentId personalInfo")
      .populate("appliedBy collectedBy", "name email")
      .sort({ calculatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FineHistory.countDocuments(query);

    // Calculate statistics
    const stats = await FineHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$fineAmount" },
        },
      },
    ]);

    return {
      data: fineHistory,
      statistics: stats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    };
  }
}
