import mongoose from 'mongoose';
import InstallmentPlan from '../model/InstallmentPlan.js';
import StudentInstallmentAssignment from '../model/studentInstallmentAssignment.js';
import StudentChallan from '../model/StudentChallan.js';
import { AppError } from '../middleware/errorHandler.js';

export class InstallmentService {
  // --- 1. CREATE PLAN (Updated for Custom Schedules) ---
  static async createPlan(data) {
    try {
      const {
        name,
        description,
        numberOfInstallments,
        customSchedule, // Expecting array of { installmentNumber, specificDueDate, percentage }
        createdBy,
      } = data;

      const existingPlan = await InstallmentPlan.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });
      if (existingPlan) {
        throw new AppError(
          "Installment plan with this name already exists",
          400
        );
      }

      // Validate Schedule matches number of installments
      if (
        !customSchedule ||
        customSchedule.length !== parseInt(numberOfInstallments)
      ) {
        throw new AppError(
          `Custom schedule must have exactly ${numberOfInstallments} entries.`,
          400
        );
      }

      // Validate Percentages add up to 100 (optional but recommended)
      const totalPercent = customSchedule.reduce(
        (sum, item) => sum + item.percentage,
        0
      );
      if (Math.abs(totalPercent - 100) > 0.1) {
        throw new AppError(
          `Installment percentages must equal 100% (Current: ${totalPercent}%)`,
          400
        );
      }

      const plan = await InstallmentPlan.create({
        name,
        description,
        numberOfInstallments: parseInt(numberOfInstallments),
        scheduleConfig: customSchedule, // Store the custom dates/percentages
        isActive: true,
        createdBy,
      });

      return plan;
    } catch (error) {
      console.error("Error creating plan:", error.message);
      throw error;
    }
  }

  static async getPlans(filters = {}) {
    const { page = 1, limit = 10, ...query } = filters;
    const skip = (page - 1) * limit;
    const plans = await InstallmentPlan.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await InstallmentPlan.countDocuments(query);
    return {
      data: plans,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      },
    };
  }

  static async getPlan(id) {
    return await InstallmentPlan.findById(id).populate(
      "createdBy",
      "name email"
    );
  }

  static async updatePlan(id, data) {
    return await InstallmentPlan.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

 
 

  static async getAssignmentDetails(assignmentId) {
    const assignment = await StudentInstallmentAssignment.findById(assignmentId)
      .populate("studentId", "studentId personalInfo departmentId programId")
      .populate("challanId", "challanNo netAmount originalTotal dueDate status")
      .populate("installmentPlanId", "name  numberOfInstallments intervalDays");

    if (!assignment) {
      throw new AppError("Installment assignment not found", 404);
    }

    return assignment;
  }
static async assignToStudent(data) {
    const { studentId, installmentPlanId, challanId, remarks } = data;
    const session = await mongoose.startSession();

    try {
      await session.startTransaction();
      const installmentPlan = await InstallmentPlan.findById(installmentPlanId).session(session);
      const challan = await StudentChallan.findById(challanId).session(session);

      if (!installmentPlan || !challan) throw new AppError("Plan or Challan not found", 404);

      const assignment = new StudentInstallmentAssignment({
        studentId, challanId, installmentPlanId,
        totalAmount: challan.netAmount || challan.originalTotal,
        totalPaid: 0,
        totalPending: challan.netAmount || challan.originalTotal,
        status: "active",
        remarks: remarks || "Converted from challan",
      });

      const installmentsList = [];
      const totalAmount = assignment.totalAmount;
      let runningTotal = 0;
      const sortedConfig = installmentPlan.scheduleConfig.sort((a, b) => a.installmentNumber - b.installmentNumber);

      for (let i = 0; i < sortedConfig.length; i++) {
        const config = sortedConfig[i];
        let amount = Math.floor((totalAmount * config.percentage) / 100);
        if (i === sortedConfig.length - 1) amount = totalAmount - runningTotal;
        runningTotal += amount;

        let dueDate = config.specificDueDate ? new Date(config.specificDueDate) 
                    : config.daysAfterAssignment ? new Date(Date.now() + config.daysAfterAssignment * 86400000) 
                    : new Date(new Date().setMonth(new Date().getMonth() + i + 1));

        installmentsList.push({
          installmentNumber: config.installmentNumber,
          amount: amount,
          dueDate: dueDate,
          status: "pending",
          isPaid: false,
        });
      }

      assignment.installments = installmentsList;
      await assignment.save({ session });

      // ✅ CRITICAL FIX: Kill the parent challan so it doesn't show up on dashboards
      challan.isInstallment = true;
      challan.installmentPlanId = installmentPlanId;
      challan.status = "merged"; 
      challan.remainingAmount = 0; 
      challan.remarks = "Converted into Installment Plan";
      await challan.save({ session });

      await session.commitTransaction();
      return assignment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // --- 3. THE MAGIC GENERATOR (TARGET INSTALLMENT & ROLLOVER) ---
  static async generateSpecificInstallmentChallan(assignmentId, targetNumber) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const assignment = await StudentInstallmentAssignment.findById(assignmentId)
        .populate("challanId")
        .session(session);

      if (!assignment) throw new AppError("Assignment not found", 404);

      const targetInst = assignment.installments.find(i => i.installmentNumber === parseInt(targetNumber));
      if (!targetInst) throw new AppError("Installment number not found", 404);
      if (targetInst.issuedChallanId) throw new AppError("Challan is already generated for this specific installment.", 400);

      let rolloverArrears = 0;
      let rolloverFine = 0;
      let mergedIds = [];

      // Scan older unpaid installments
      const previousInstallments = assignment.installments.filter(
        i => i.installmentNumber < parseInt(targetNumber) && !i.isPaid
      );

      for (const prev of previousInstallments) {
        if (prev.issuedChallanId) {
          // If a physical challan existed, safely kill it and extract exact data
          const prevChallan = await StudentChallan.findById(prev.issuedChallanId).session(session);
          if (prevChallan && !["paid", "cancelled", "merged"].includes(prevChallan.status)) {
            
            // Extract Unpaid Base (Net Amount - Fine - Partial Payments)
            let unpaidBase = prevChallan.netAmount - (prevChallan.fineAmount || 0) - prevChallan.paidAmount;
            if (unpaidBase < 0) unpaidBase = 0;

            rolloverArrears += unpaidBase;
            rolloverFine += (prevChallan.fineAmount || 0);
            mergedIds.push(prevChallan._id);

            // Merge it out of existence
            prevChallan.status = "merged";
            prevChallan.remainingAmount = 0;
            prevChallan.remarks = `Merged into Installment ${targetNumber}`;
            await prevChallan.save({ session });
          }
        } else {
          // It was never generated, so the whole planned amount is an arrear
          rolloverArrears += prev.amount;
        }
        // Mark the tracker so we know it rolled over
        prev.status = "forwarded";
      }

      // Generate the new physical Challan
      const pChallan = assignment.challanId;
      const challanNo = await this.generateChallanNo();
      const totalNet = targetInst.amount + rolloverArrears + rolloverFine;

      const [newChallan] = await StudentChallan.create([{
        challanNo,
        studentId: assignment.studentId,
        programId: pChallan.programId,
        departmentId: pChallan.departmentId,
        semesterId: pChallan.semesterId,
        termId: pChallan.termId,
        
        challanType: "INSTALLMENT",
        isInstallment: true,
        installmentGroup: assignment._id.toString(),
        installmentNumber: targetInst.installmentNumber,
        
        originalTotal: targetInst.amount,
        feeDetails: { [`Installment ${targetInst.installmentNumber}`]: targetInst.amount },
        
        // ✅ Perfect Rollover Math applied to database
        arrears: rolloverArrears,
        fineAmount: rolloverFine,
        includedChallanIds: mergedIds,
        
        netAmount: totalNet,
        remainingAmount: totalNet,
        dueDate: targetInst.dueDate,
        status: "issued",
        remarks: `Generated Installment ${targetInst.installmentNumber}/${assignment.installments.length}`,
        issuedAt: new Date()
      }], { session });

      // Update Tracker with the new PDF link
      targetInst.issuedChallanId = newChallan._id;
      targetInst.status = "issued";
      await assignment.save({ session });

      await session.commitTransaction();
      return newChallan;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // --- 4. PAYMENT SYNC ---
  static async updateInstallmentPayment(assignmentId, installmentNumber, paymentData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const assignment = await StudentInstallmentAssignment.findById(assignmentId).session(session);
      const installment = assignment.installments.find(inst => inst.installmentNumber === parseInt(installmentNumber));

      installment.isPaid = true;
      installment.paidAt = new Date();
      installment.paymentMethod = paymentData.paymentMethod;
      installment.transactionId = paymentData.transactionId;
      installment.status = "paid";

      assignment.totalPaid += installment.amount;
      assignment.totalPending = assignment.totalAmount - assignment.totalPaid;
      if (assignment.totalPending <= 0) assignment.status = "completed";

      await assignment.save({ session });

      // ✅ FIX: Sync the physical printed challan to Paid as well!
      if (installment.issuedChallanId) {
        await StudentChallan.findByIdAndUpdate(
          installment.issuedChallanId,
          { status: "paid", paidAmount: installment.amount, remainingAmount: 0, paidAt: new Date() },
          { session }
        );
      }

      await session.commitTransaction();
      return assignment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
 
  static async removeAssignment(assignmentId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const assignment = await StudentInstallmentAssignment.findById(
        assignmentId
      ).session(session);
      if (!assignment) {
        throw new AppError("Installment assignment not found", 404);
      }

      await StudentInstallmentAssignment.findByIdAndDelete(assignmentId, {
        session,
      });

      await StudentChallan.findByIdAndUpdate(
        assignment.challanId,
        {
          isInstallment: false,
          installmentPlanId: null,
        },
        { session }
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getOverdueInstallments() {
    const today = new Date();

    const assignments = await StudentInstallmentAssignment.find({
      status: "active",
      "installments.dueDate": { $lt: today },
      "installments.isPaid": false,
    })
      .populate("studentId", "studentId personalInfo")
      .populate("challanId", "challanNo dueDate")
      .populate("installmentPlanId", "name");

    const overdueInstallments = [];

    assignments.forEach((assignment) => {
      assignment.installments.forEach((installment) => {
        if (!installment.isPaid && installment.dueDate < today) {
          overdueInstallments.push({
            assignmentId: assignment._id,
            student: assignment.studentId,
            challan: assignment.challanId,
            installmentPlan: assignment.installmentPlanId,
            installment: {
              number: installment.installmentNumber,
              amount: installment.amount,
              dueDate: installment.dueDate,
              daysOverdue: Math.floor(
                (today - installment.dueDate) / (1000 * 60 * 60 * 24)
              ),
            },
          });
        }
      });
    });

    return overdueInstallments;
  }
}