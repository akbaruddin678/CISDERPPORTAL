import mongoose from "mongoose";
import StudentChallan from "../model/StudentChallan.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import FeeStructure from "../model/FeeStructure.js";
import { ScholarshipService } from "./scholarship.service.js";
import { AppError } from "../middleware/errorHandler.js";

export class StudentChallanService {
  static async generateChallanNo() {
    const prefix = "CH";
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${Date.now().toString().slice(-4)}-${rand}`;
  }

  // --- MISSING METHOD ADDED HERE ---
  static async getChallansByStudentId(studentId) {
    const challans = await StudentChallan.find({ studentId })
      .populate("termId", "name")
      .populate("scholarshipId", "amount percentage type") // Optional populate
      .sort({ createdAt: -1 });

    return challans;
  }

  // ==========================================
  // 1. SINGLE CHALLAN GENERATION
  // ==========================================
  static async generateSingle(data) {
    const {
      studentId,
      termId,
      feeStructureId,
      dueDate,
      departmentId,
      programId,
      semesterId,
    } = data;

    // 1. Resolve Fee Structure
    let feeStructure = null;
    if (feeStructureId) {
      feeStructure = await FeeStructure.findById(feeStructureId);
    } else {
      const student = await StudentProfile.findById(studentId);
      if (!student) throw new AppError("Student not found", 404);

      const targetProgram = programId || student.program;
      const targetTerm = termId;

      feeStructure = await FeeStructure.findOne({
        programId: targetProgram,
        termId: targetTerm,
        isActive: true,
      });
    }

    if (!feeStructure) {
      throw new AppError(
        "Fee Structure not found. Please ensure a Fee Structure exists for this Program and Session.",
        404
      );
    }

    // 2. Determine Semester
    const student = await StudentProfile.findById(studentId);
    const targetSemesterId = semesterId || student.currentSemester;

    if (!targetSemesterId) {
      throw new AppError("Semester not specified for fee calculation", 400);
    }

    // 3. Calculate Base Fees
    let feeBreakdown;
    try {
      feeBreakdown = FeeStructure.calculateCharges(
        feeStructure,
        targetSemesterId,
        false
      );
    } catch (error) {
      throw new AppError(`Fee Calculation Error: ${error.message}`, 400);
    }

    const { tuitionFee, otherFees, oneTimeFees, originalTotal } = feeBreakdown;

    // 4. Scholarship Logic
    const scholarshipData =
      await ScholarshipService.getStudentActiveScholarship(studentId, termId);

    let scholarshipAmount = 0;
    let scholarshipId = null;

    if (scholarshipData) {
      scholarshipAmount = ScholarshipService.calculateScholarshipAmount(
        originalTotal,
        scholarshipData.plan
      );
      scholarshipId = scholarshipData.applicationId;
    }

    scholarshipAmount = Math.min(scholarshipAmount, originalTotal);
    const netAmount = originalTotal - scholarshipAmount;

    // 5. Create
    const challan = await StudentChallan.create({
      challanNo: await this.generateChallanNo(),
      studentId,
      termId,
      feeStructureId: feeStructure._id,
      programId: programId || feeStructure.programId,
      departmentId: departmentId || feeStructure.departmentId,
      semesterId: targetSemesterId,

      tuitionFee,
      otherFees,
      oneTimeFees,
      originalTotal,

      scholarshipId,
      scholarshipAmount,

      fineAmount: 0,
      paidAmount: 0,
      netAmount,
      remainingAmount: netAmount,

      dueDate,
      status: "issued",
      issuedAt: new Date(),
    });

    return challan;
  }

  // ==========================================
  // 2. BULK CHALLAN GENERATION
  // ==========================================
  static async generateBulk(data) {
    const {
      termId,
      feeStructureId,
      dueDate,
      departmentId,
      programId,
      semesterId,
    } = data;

    let feeStructure = null;
    if (feeStructureId) {
      feeStructure = await FeeStructure.findById(feeStructureId);
    } else if (programId && termId) {
      feeStructure = await FeeStructure.findOne({
        programId,
        termId,
        isActive: true,
      });
    }

    if (!feeStructure) {
      throw new AppError(
        "Fee Structure not found for the selected Program and Session.",
        404
      );
    }

    const query = { isActive: true };
    if (departmentId) query.department = departmentId;
    if (programId) query.program = programId;
    if (semesterId) query.currentSemester = semesterId;

    const students = await StudentProfile.find(query);
    if (!students.length)
      return {
        successCount: 0,
        failedCount: 0,
        message: "No students found matching filters",
      };

    const scholarshipMap = await ScholarshipService.getBatchScholarshipsForTerm(
      termId
    );
    const results = { successCount: 0, failedCount: 0, errors: [] };

    for (const student of students) {
      try {
        const exists = await StudentChallan.exists({
          studentId: student._id,
          termId,
          isDeleted: false,
          status: { $ne: "cancelled" },
        });

        if (exists) {
          results.failedCount++;
          continue;
        }

        const targetSemester = semesterId || student.currentSemester;
        if (!targetSemester)
          throw new Error(`Student has no semester assigned`);

        let feeBreakdown;
        try {
          feeBreakdown = FeeStructure.calculateCharges(
            feeStructure,
            targetSemester,
            false
          );
        } catch (e) {
          throw new Error(`Semester not found in Fee Structure`);
        }

        const { tuitionFee, otherFees, oneTimeFees, originalTotal } =
          feeBreakdown;

        const scholarshipData = scholarshipMap.get(student._id.toString());
        let scholarshipAmount = 0;
        let scholarshipId = null;

        if (scholarshipData) {
          scholarshipAmount = ScholarshipService.calculateScholarshipAmount(
            originalTotal,
            scholarshipData.plan
          );
          scholarshipId = scholarshipData.applicationId;
        }

        scholarshipAmount = Math.min(scholarshipAmount, originalTotal);
        const netAmount = originalTotal - scholarshipAmount;

        await StudentChallan.create({
          challanNo: await this.generateChallanNo(),
          studentId: student._id,
          programId: student.program,
          departmentId: student.department,
          semesterId: targetSemester,
          termId,
          feeStructureId: feeStructure._id,

          tuitionFee,
          otherFees,
          oneTimeFees,
          originalTotal,
          scholarshipId,
          scholarshipAmount,

          fineAmount: 0,
          paidAmount: 0,
          netAmount,
          remainingAmount: netAmount,

          dueDate,
          status: "issued",
          issuedAt: new Date(),
        });

        results.successCount++;
      } catch (err) {
        console.error(`Failed ${student.studentId}:`, err.message);
        results.failedCount++;
        results.errors.push(`${student.studentId}: ${err.message}`);
      }
    }

    return results;
  }

  // ==========================================
  // 3. CONVERT TO INSTALLMENT
  // ==========================================
  static async convertToInstallment(challanId, installmentPlanId) {
    const challan = await StudentChallan.findById(challanId);
    if (!challan) throw new AppError("Challan not found", 404);
    if (challan.status === "paid")
      throw new AppError("Cannot convert paid challan", 400);

    challan.isInstallment = true;
    challan.installmentPlanId = installmentPlanId;
    challan.status = "partial";
    await challan.save();

    return challan;
  }

  // ==========================================
  // 4. SOFT DELETE CHALLAN
  // ==========================================
  static async softDeleteChallan(id, { reason, deletedBy }) {
    const challan = await StudentChallan.findById(id);
    if (!challan) throw new AppError("Challan not found", 404);

    // Allow deleting unpaid challans or mark as cancelled
    if (challan.status === "paid") {
      throw new AppError(
        "Cannot delete a paid challan. Consider refunding instead.",
        400
      );
    }

    challan.isDeleted = true;
    challan.status = "cancelled";
    challan.deletionReason = reason;
    challan.deletedBy = deletedBy; // Pass User ID from controller
    challan.deletedAt = new Date();

    await challan.save();
    return challan;
  }

  // --- Helper to get single challan details ---
  static async getById(id) {
    return await StudentChallan.findById(id)
      .populate("studentId", "name studentId")
      .populate("termId", "name");
  }

  // --- Helper to get all challans (for stats) ---
  static async getAll(query) {
    // Add filtering logic here based on query params
    return await StudentChallan.find()
      .populate("studentId", "name")
      .sort({ createdAt: -1 })
      .limit(query.limit || 50);
  }

  static async markPaid(id, paymentData) {
    const challan = await StudentChallan.findById(id);
    if (!challan) throw new AppError("Not Found", 404);

    challan.status = "paid";
    challan.paidAmount = challan.netAmount;
    challan.remainingAmount = 0;
    challan.paidAt = paymentData.paymentDate || new Date();
    await challan.save();
    return challan;
  }
}
