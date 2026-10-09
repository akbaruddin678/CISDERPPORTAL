import StudentFeeStructure from "../model/StudentFeeStructure.js";
import StudentProfile from "../../student/models/StudentProfile.js";
import { AppError } from "../middleware/errorHandler.js";

export class StudentFeeService {
  // ACADEMIC/EXAM repeat every semester — scope them by semesterId so
  // promoting a student (which often keeps the same termId) doesn't collide
  // with or silently overwrite the previous semester's fee. ADMISSION/
  // READMISSION are one-time-per-enrollment, so they stay termId-scoped.
  static isSemesterScoped(category) {
    return category === "ACADEMIC" || category === "EXAM";
  }

  static async upsertStudentFee(data, userId) {
    const {
      id,
      studentId,
      termId,
      semesterId,
      category,
      title,
      name,
      totalAmount,
      feeItems,
      remarks,
      feeSetupRemark,
    } = data;

    // Drop old index if it exists (ignoring errors if it doesn't)
    try {
      await StudentFeeStructure.collection.dropIndex(
        "studentId_1_termId_1_category_1",
      );
    } catch (e) {}

    const formattedItems = (feeItems || []).map((item) => ({
      headId: item.headId || null,
      headName: item.headName || "Custom Fee",
      amount: Number(item.amount),
    }));

    const finalTitle = title || name;
    const semesterScoped = this.isSemesterScoped(category);

    const payload = {
      studentId,
      termId: termId || null,
      semesterId: semesterScoped ? semesterId || null : null,
      category,
      title: finalTitle,
      totalAmount: Number(totalAmount),
      feeItems: formattedItems,
      remarks: remarks || name,
      feeSetupRemark: (feeSetupRemark || "").trim(),
      isActive: true,
      createdBy: userId,
    };

    // If an ID is provided, the user clicked "Edit". Explicitly update that record.
    if (id) {
      return await StudentFeeStructure.findByIdAndUpdate(id, payload, {
        new: true,
      });
    }

    // If NO ID is provided, the user clicked "Set Fee".
    if (category === "MISC") {
      return await StudentFeeStructure.create(payload);
    }

    // `title` stays in the match key so "Supplementary Exam" doesn't
    // overwrite "Exam Fee" — they're different records for the same
    // semester. Semester-scoped categories match on semesterId (not
    // termId), since that's the axis that actually changes on promotion.
    const matchKey = semesterScoped
      ? { studentId, semesterId, category, title: finalTitle }
      : { studentId, termId, category, title: finalTitle };

    return await StudentFeeStructure.findOneAndUpdate(matchKey, payload, {
      new: true,
      upsert: true,
    });
  }

  static async bulkCreateStudentFees(data, userId) {
    const {
      studentIds,
      termId,
      semesterId,
      category,
      title,
      name,
      totalAmount,
      feeItems,
      remarks,
      feeSetupRemark,
    } = data;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      throw new AppError("No students selected", 400);
    }

    // Filters are only a way to find students. Once explicit students have
    // been selected, their own profiles are the source of truth for the fee
    // scope. In particular, two programs can both call their section "A"
    // while using different Semester documents, so copying the first
    // student's semesterId to an entire class creates incorrectly-scoped
    // fee records.
    const uniqueStudentIds = [...new Set(studentIds.map(String))];
    const profiles = await StudentProfile.find({
      _id: { $in: uniqueStudentIds },
      isTrashed: { $ne: true },
    })
      .select("_id studentId termId semesterId")
      .lean();
    const profileById = new Map(
      profiles.map((profile) => [String(profile._id), profile]),
    );
    const missingStudentIds = uniqueStudentIds.filter(
      (studentId) => !profileById.has(studentId),
    );
    if (missingStudentIds.length) {
      throw new AppError(
        `${missingStudentIds.length} selected student record(s) could not be found. Refresh the list and try again.`,
        400,
      );
    }

    const formattedItems = (feeItems || []).map((item) => ({
      headId: item.headId || null,
      headName: item.headName || "Fee",
      amount: Number(item.amount),
    }));

    const finalTitle = title || name;
    const semesterScoped = this.isSemesterScoped(category);

    const records = uniqueStudentIds.map((sId) => {
      const profile = profileById.get(sId);
      const ownTermId = profile.termId || termId || null;
      const ownSemesterId = profile.semesterId || semesterId || null;

      if (!ownTermId) {
        throw new AppError(
          `Student ${profile.studentId || sId} has no session assigned. Update the student's academic profile first.`,
          400,
        );
      }
      if (semesterScoped && !ownSemesterId) {
        throw new AppError(
          `Student ${profile.studentId || sId} has no section assigned. Update the student's academic profile first.`,
          400,
        );
      }

      return {
        studentId: sId,
        termId: ownTermId,
        semesterId: semesterScoped ? ownSemesterId : null,
        category,
        title: finalTitle,
        totalAmount: Number(totalAmount),
        feeItems: formattedItems,
        remarks: remarks || name,
        feeSetupRemark: (feeSetupRemark || "").trim(),
        isActive: true,
        createdBy: userId,
      };
    });

    if (category === "MISC") {
      return await StudentFeeStructure.insertMany(records);
    }

    const results = [];
    for (const rec of records) {
      const matchKey = semesterScoped
        ? {
            studentId: rec.studentId,
            semesterId: rec.semesterId,
            category: rec.category,
            title: rec.title,
          }
        : {
            studentId: rec.studentId,
            termId: rec.termId,
            category: rec.category,
            title: rec.title,
          };
      const res = await StudentFeeStructure.findOneAndUpdate(matchKey, rec, {
        new: true,
        upsert: true,
      });
      results.push(res);
    }
    return results;
  }

  static async getStudentFees(studentId) {
    return await StudentFeeStructure.find({ studentId, isActive: true })
      .populate("termId", "name")
      .populate("semesterId", "name number")
      .sort({ createdAt: -1 });
  }

  static async deleteStudentFee(id) {
    return await StudentFeeStructure.findByIdAndDelete(id);
  }

  // Permanently tags a legacy fee-setup record (saved before semesterId
  // tagging existed) with the semester staff confirms it actually belongs
  // to — the manual, per-record counterpart to the read-time "use it if
  // it's the only untagged one" fallback used elsewhere. Once assigned,
  // the record behaves exactly like any normally-tagged one everywhere
  // (Fee Setup screen, Installment Configuration, challan generation) —
  // no more fallback needed for it.
  static async assignSemester(id, semesterId) {
    const record = await StudentFeeStructure.findById(id);
    if (!record) throw new AppError("Fee record not found", 404);
    if (record.semesterId) {
      throw new AppError(
        "This record is already assigned to a semester.",
        400,
      );
    }
    if (!this.isSemesterScoped(record.category)) {
      throw new AppError(
        `${record.category} fees are not semester-scoped and can't be assigned to a semester.`,
        400,
      );
    }

    const conflict = await StudentFeeStructure.findOne({
      _id: { $ne: id },
      studentId: record.studentId,
      semesterId,
      category: record.category,
      title: record.title,
    });
    if (conflict) {
      throw new AppError(
        "This student already has a fee record for that semester and category — cannot assign.",
        409,
      );
    }

    record.semesterId = semesterId;
    await record.save();
    return record;
  }
}
