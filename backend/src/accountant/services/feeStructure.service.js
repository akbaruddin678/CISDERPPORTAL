import AcademicFeeStructure from "../model/FeeStructure/AcademicFeeStructure.js";
import BasicFeeStructure from "../model/FeeStructure/BasicFeeStructure.js";
import AdmissionFeeStructure from "../model/FeeStructure/AdmissionFeeStructure.js";
import MiscellaneousFee from "../model/FeeStructure/MiscellaneousFee.js";
import FeeHead from "../model/FeeStructure/FeeHead.js";
import ReAdmissionFeeStructure from "../model/FeeStructure/ReAdmissionFeeStructure.js";
import ExamFeeStructure from "../model/FeeStructure/ExamFeeStructure.js";
import { AppError } from "../middleware/errorHandler.js";

export class FeeManagementService {
  // --- HEADS ---
  static async createFeeHead(data) {
    const existing = await FeeHead.findOne({ name: data.name });
    if (existing)
      throw new AppError("Fee Head with this name already exists", 400);
    return await FeeHead.create(data);
  }

  static async getFeeHeads(query) {
    const { type } = query;
    const filter = {};

    if (type) {
      const types = type.split(",");
      filter.type = { $in: types };
    }

    return await FeeHead.find(filter).sort({ name: 1 });
  }

  // --- 1. ACADEMIC (Tuition) ---
  static async createAcademic(data) {
    const { programId, termId, semesterNumber, totalAmount, feeItems } = data;
    const exists = await AcademicFeeStructure.findOne({
      programId,
      termId,
      semesterNumber,
    });
    if (exists)
      throw new AppError(
        `Fee Structure already exists for Semester ${semesterNumber}`,
        409,
      );
    return await AcademicFeeStructure.create({
      programId,
      termId,
      semesterNumber,
      totalAmount,
      feeItems,
    });
  }

  static async getAcademic(query) {
    const { programId, termId } = query;
    const filter = {};
    if (programId) filter.programId = programId;
    if (termId) filter.termId = termId;

    return await AcademicFeeStructure.find(filter)
      .populate("programId", "name")
      .populate("termId", "termName")
      .populate("feeItems.headId", "name type")
      .sort({ semesterNumber: 1 });
  }

  static async updateAcademic(id, data) {
    return await AcademicFeeStructure.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  static async deleteAcademic(id) {
    return await AcademicFeeStructure.findByIdAndDelete(id);
  }

  // --- 1B. BASIC (Per-Semester baseline fee) ---
  static async createBasic(data) {
    const { programId, termId, semesterNumber, totalAmount, feeItems } = data;
    const exists = await BasicFeeStructure.findOne({
      programId,
      termId,
      semesterNumber,
    });
    if (exists)
      throw new AppError(
        `Basic Fee already exists for Semester ${semesterNumber}`,
        409,
      );
    return await BasicFeeStructure.create({
      programId,
      termId,
      semesterNumber,
      totalAmount,
      feeItems,
    });
  }

  static async getBasic(query) {
    const { programId, termId } = query;
    const filter = {};
    if (programId) filter.programId = programId;
    if (termId) filter.termId = termId;

    return await BasicFeeStructure.find(filter)
      .populate("programId", "name")
      .populate("termId", "termName")
      .populate("feeItems.headId", "name type")
      .sort({ semesterNumber: 1 });
  }

  static async updateBasic(id, data) {
    return await BasicFeeStructure.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  static async deleteBasic(id) {
    return await BasicFeeStructure.findByIdAndDelete(id);
  }

  // --- 2. ADMISSION (One Time) ---
  static async createAdmission(data) {
    const { programId, termId, totalAmount, securityDeposit, feeItems } = data;
    const exists = await AdmissionFeeStructure.findOne({ programId, termId });
    if (exists)
      throw new AppError(`Admission Fee already exists for this Program`, 409);
    return await AdmissionFeeStructure.create({
      programId,
      termId,
      totalAmount,
      securityDeposit,
      feeItems,
    });
  }

  static async getAdmission(query) {
    const { programId, termId } = query;
    const filter = {};
    if (programId) filter.programId = programId;
    if (termId) filter.termId = termId;

    return await AdmissionFeeStructure.find(filter)
      .populate("programId", "name")
      .populate("termId", "termName")
      .populate("feeItems.headId", "name type");
  }

  static async updateAdmission(id, data) {
    return await AdmissionFeeStructure.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  static async deleteAdmission(id) {
    return await AdmissionFeeStructure.findByIdAndDelete(id);
  }

  // --- 3. RE-ADMISSION (NEW) ---
  static async createReAdmission(data) {
    const { programId, termId, totalAmount, feeItems } = data;
    const exists = await ReAdmissionFeeStructure.findOne({ programId, termId });
    if (exists)
      throw new AppError(
        "Re-Admission Fee already exists for this Program",
        409,
      );
    return await ReAdmissionFeeStructure.create({
      programId,
      termId,
      totalAmount,
      feeItems,
    });
  }

  static async getReAdmission(query) {
    const { programId, termId } = query;
    return await ReAdmissionFeeStructure.find({ programId, termId })
      .populate("programId", "name")
      .populate("termId", "termName")
      .populate("feeItems.headId", "name");
  }

  static async updateReAdmission(id, data) {
    return await ReAdmissionFeeStructure.findByIdAndUpdate(id, data, {
      new: true,
    });
  }
  static async deleteReAdmission(id) {
    return await ReAdmissionFeeStructure.findByIdAndDelete(id);
  }

  // --- 4. EXAM (NEW) ---
  static async createExam(data) {
    const {
      programId,
      termId,
      levelNumber,
      academicLevel,
      totalAmount,
      feeItems,
    } = data;
    const exists = await ExamFeeStructure.findOne({
      programId,
      termId,
      levelNumber,
    });
    if (exists)
      throw new AppError(
        `Exam Fee exists for ${academicLevel} ${levelNumber}`,
        409,
      );
    return await ExamFeeStructure.create({
      programId,
      termId,
      levelNumber,
      academicLevel,
      totalAmount,
      feeItems,
    });
  }

  static async getExam(query) {
    const { programId, termId } = query;
    return await ExamFeeStructure.find({ programId, termId })
      .populate("programId", "name")
      .populate("termId", "termName")
      .sort({ levelNumber: 1 });
  }

  static async updateExam(id, data) {
    return await ExamFeeStructure.findByIdAndUpdate(id, data, { new: true });
  }
  static async deleteExam(id) {
    return await ExamFeeStructure.findByIdAndDelete(id);
  }

  // --- 5. GLOBAL MISC FEES ---
  static async createMisc(data) {
    // We check by title or name to prevent duplicates of global fees
    const identifier = data.title || data.name;
    if (!identifier) throw new AppError("Fee Title/Name is required", 400);

    const exists = await MiscellaneousFee.findOne({
      $or: [{ name: identifier }, { title: identifier }],
    });

    if (exists) {
      exists.amount = data.amount;
      // Optional: Update title if it was provided
      if (data.title) exists.title = data.title;
      if (data.name) exists.name = data.name;
      return await exists.save();
    }
    return await MiscellaneousFee.create(data);
  }

  static async getMisc() {
    // Return all global misc fees, sorted by name
    return await MiscellaneousFee.find({}).sort({ name: 1, title: 1 });
  }

  static async deleteMisc(id) {
    return await MiscellaneousFee.findByIdAndDelete(id);
  }
}
