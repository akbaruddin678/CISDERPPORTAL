import StudentProfile from "../models/StudentProfile.js";
import PersonalInfo from "../models/PersonalInfo.js";
import FamilyInfo from "../models/FamilyInfo.js";

import Program from "../../catalog/model/Program.js";
import Semester from "../../catalog/model/Semester.js";
import Term from "../../catalog/model/Term.js";

export const syncStudentFromCollege = async (req, res) => {
  try {
    const {
      action,
      externalId,
      userId,
      studentRegNo,
      personalInfo = {},
      familyInfo = {},
      address = {},
      erpProgramId,
      erpTermId,
      erpSessionId,
      remark,
    } = req.body;

    // ─── 0. FAST-FAIL VALIDATION ───
    if (!externalId || (!studentRegNo && action !== "DELETE")) {
      return res.status(400).json({
        success: false,
        message:
          "Validation Error: 'externalId' and 'studentRegNo' are strictly required.",
      });
    }

    // ─── HANDLE DELETION ───
    if (action === "DELETE") {
      const deletedProfile = await StudentProfile.findOneAndUpdate(
        { externalId },
        { status: "withdrawn", remark: "Withdrawn via College Portal" },
        { new: true },
      );
      return res.status(200).json({ success: true, data: deletedProfile });
    }

    // ─── 1. DIRECT ID VALIDATION (Fast & Strict) ───
    if (!erpProgramId || !erpTermId || !erpSessionId) {
      return res.status(400).json({
        success: false,
        message:
          "Data Integrity Error: Missing required academic IDs (Program, Term, Session).",
      });
    }

    const [erpProg, erpTerm, erpSem] = await Promise.all([
      Program.findById(erpProgramId).lean(),
      Term.findById(erpTermId).lean(),
      Semester.findById(erpSessionId).lean(),
    ]);

    if (!erpProg || !erpTerm || !erpSem) {
      console.error(
        `❌ [ERP SYNC] Structural integrity failure for ${studentRegNo}`,
      );
      return res.status(400).json({
        success: false,
        message: `ERP Sync Rejected: One or more structural IDs provided by the college system do not exist in the active ERP catalog.`,
      });
    }

    const dynamicDeptId = erpProg.departmentId;
    const validatedUserId = userId && userId !== "null" ? userId : null;

   
    const profile = await StudentProfile.findOneAndUpdate(
      { externalId },
      {
        // A plain (no `$` operator) update object here is a full-document
        // REPLACE in MongoDB, not a partial update — it would silently wipe
        // every field not listed below (feeActivated, isTrashed,
        // lifecycleHistory, ...) on every re-sync of an existing student.
        // $set scopes this call to only the fields ERP actually owns;
        // $setOnInsert sets admissionTermId ("batch") once, on first sync
        // only, so a later re-sync never overwrites it (mirrors
        // promotionService.js's own admission-time write of this field).
        $set: {
          externalId,
          userId: validatedUserId,
          user: validatedUserId,
          studentId: studentRegNo,
          departmentId: dynamicDeptId,
          programId: erpProg._id,
          semesterId: erpSem._id,
          termId: erpTerm._id,
          status: "active",
          remark: remark || "",
        },
        $setOnInsert: { admissionTermId: erpTerm._id },
      },
      { new: true, upsert: true, runValidators: true },
    );

    // ─── UPSERT PERSONAL INFO ───
    await PersonalInfo.findOneAndUpdate(
      { studentId: profile._id },
      {
        fullName: personalInfo.fullName || "Unknown",
        cnic: personalInfo.cnic || `${studentRegNo}-CNIC`,
        phone: personalInfo.phone || "0000000000",
        email:
          personalInfo.email || `${studentRegNo.toLowerCase()}@college.edu`,
        dob: personalInfo.dob ? new Date(personalInfo.dob) : new Date(),
        gender: personalInfo.gender
          ? personalInfo.gender.toLowerCase()
          : "other",
        currentAddress: {
          address: address.address || "",
          district: address.district || "",
          province: address.province || "",
          country: address.country || "Pakistan",
        },
        permanentAddress: {
          address: address.permanentAddress || "",
          district: address.permanentDistrict || "",
          province: address.permanentProvince || "",
          country: address.permanentCountry || "Pakistan",
        },
      },
      { new: true, upsert: true, runValidators: true },
    );

    // ─── UPSERT FAMILY INFO ───
    await FamilyInfo.findOneAndUpdate(
      { studentId: profile._id },
      {
        fatherName:
          familyInfo.fatherName || personalInfo.fatherName || "Unknown",
        fatherCnic: familyInfo.fatherCnic || "",
        motherName: familyInfo.motherName || "",
        motherCnic: familyInfo.motherCnic || "",
        guardianPhone: familyInfo.guardianPhone || "",
        fathersProfession: familyInfo.fatherProfession || "",
        incomeBracket: familyInfo.familyIncome || "",
        guardianStatus: "alive",
      },
      { new: true, upsert: true, runValidators: true },
    );

    res
      .status(200)
      .json({ success: true, message: "Sync successful", data: profile._id });
  } catch (error) {
    console.error("🔴 [ERP SYNC] SERVER ERROR:", error.message);

    // Specific handler for MongoDB Unique Constraint violations (Common Prod Issue)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message: ` The value provided for '${field}' is already in use by another student in the ERP.`,
      });
    }

    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error during data synchronization.",
      });
  }
};
