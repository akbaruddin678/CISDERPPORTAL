import mongoose from "mongoose";
import crypto from "crypto";
import User from "../../user/model/User.js";
import Person from "../../core/models/Person.js";
import StaffProfile from "../../staff/models/StaffProfile.js";
import StaffDocument from "../../staff/models/StaffDocument.js";
import StaffEmploymentInfo from "../../staff/models/StaffEmploymentInfo.js";
import Department from "../../catalog/model/Department.js";
import StaffLeaveRequest from "../../staff/models/StaffLeaveRequest.js";
import JobPosting from "../../staff/models/JobPosting.js";
import JobApplication from "../../staff/models/JobApplication.js";
import { hashPassword } from "../../core/utils/password.js";
import { uploadToR2, deleteFromR2 } from "../../core/utils/cloudflareR2.js";
import {
  sendWelcomeSetPasswordEmail,
  sendItProvisioningEmail,
  sendHodNewHireEmail,
} from "../../core/utils/email.js";

// Builds a unique, slugified reference email (firstname.lastname@domain) for
// the directory/ID card — display-only, never used for login. Collisions
// (two "John Smith"s) are resolved with a numeric suffix.
const DOMAIN = "neiedu.online";
const slugify = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const generateOfficialEmail = async (firstName, lastName) => {
  const base = `${slugify(firstName)}.${slugify(lastName)}`;
  let candidate = `${base}@${DOMAIN}`;
  let suffix = 1;
  while (await StaffProfile.exists({ officialEmail: candidate })) {
    candidate = `${base}${suffix}@${DOMAIN}`;
    suffix += 1;
  }
  return candidate;
};

// Helper: Security check to prevent HR from modifying Admins
const protectAdminTarget = async (userId, session = null) => {
  const query = User.findById(userId);
  if (session) query.session(session);
  const targetUser = await query;

  if (!targetUser) throw new Error("User not found.");
  if (targetUser.roles.includes("admin")) {
    throw new Error("Access Denied: Cannot manage system administrators.");
  }
  return targetUser;
};

// =========================================================
// 1. GET ALL STAFF (Clean Mongoose Populate)
// =========================================================
// Accounts that are never "staff" for HR purposes — system administrators,
// students and applicants live in their own modules.
const NON_STAFF_ROLES = ["admin", "student", "applicant"];
const EDITABLE_ROLES = User.schema
  .path("roles")
  .caster.enumValues.filter((r) => !NON_STAFF_ROLES.includes(r));
// Roles that only make sense attached to a department.
const DEPARTMENT_ROLES = ["teacher", "hod"];

// Minimal HR profile for a registered account that has none yet (e.g. a
// login created from the admin user panel) — HR fills in the rest later on
// the full Employee Profile page.
const ensureProfileForUser = async (userId, session = null) => {
  const existing = await StaffProfile.findOne({ userId }).session(session);
  if (existing) return existing;

  let n = (await StaffProfile.countDocuments().session(session)) + 1;
  let employeeId;
  do {
    employeeId = `EMP-${new Date().getFullYear()}-${1000 + n}`;
    n += 1;
  } while (await StaffProfile.exists({ employeeId }).session(session));

  const [created] = await StaffProfile.create(
    [{ userId, employeeId, designation: "Staff" }],
    { session },
  );
  return created;
};

export const getAllStaff = async (req, res) => {
  try {
    // Every registered staff-type login, whether or not HR has created a
    // profile for it yet — otherwise accounts made outside the onboarding
    // wizard are invisible and can't be managed at all.
    const users = await User.find({ roles: { $nin: NON_STAFF_ROLES } })
      .select("email roles status")
      .lean();
    const userIds = users.map((u) => u._id);

    const [profiles, people] = await Promise.all([
      StaffProfile.find({ userId: { $in: userIds } })
        .populate("departmentId", "name code")
        .populate("personalInfo")
        .lean(),
      Person.find({ userId: { $in: userIds } }).select("userId name").lean(),
    ]);
    const profileByUser = new Map(profiles.map((p) => [String(p.userId), p]));
    const nameByUser = new Map(people.map((p) => [String(p.userId), p.name]));

    const rows = users.map((u) => {
      const profile = profileByUser.get(String(u._id));
      if (profile) return { ...profile, userId: u, hasProfile: true };
      return {
        _id: null,
        hasProfile: false,
        userId: u,
        departmentId: null,
        designation: null,
        employeeId: null,
        personalInfo: { name: nameByUser.get(String(u._id)) || u.email.split("@")[0] },
      };
    });

    rows.sort((a, b) =>
      (a.personalInfo?.name || "").localeCompare(b.personalInfo?.name || ""),
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch directory." });
  }
};

// Creates the minimal HR profile for a registered account that lacks one and
// returns its id, so every per-employee action (profile page, access,
// status, delete) has a StaffProfile to work with. Idempotent.
export const ensureStaffProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("roles");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (user.roles.some((r) => NON_STAFF_ROLES.includes(r))) {
      return res.status(400).json({
        success: false,
        message: "Only staff accounts can have an HR profile.",
      });
    }
    const profile = await ensureProfileForUser(user._id);
    res.status(200).json({ success: true, data: { staffId: profile._id } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================
// 1b. GET SINGLE STAFF PROFILE (full detail — powers the Employee
// Profile page's Profile/Contract/Documents tabs)
// =========================================================
export const getStaffById = async (req, res) => {
  try {
    const staff = await StaffProfile.findById(req.params.id)
      .populate({ path: "userId", select: "email roles status" })
      .populate("departmentId", "name code")
      .populate("personalInfo")
      .populate("roleAssignments.departmentId", "name code")
      .populate({
        path: "roleAssignments.reportsTo",
        select: "employeeId designation",
        populate: { path: "personalInfo", select: "name" },
      })
      .lean();

    if (!staff)
      return res.status(404).json({ success: false, message: "Staff profile not found." });

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Safe JSON.parse for multipart text fields carrying structured data
// (arrays/objects can't cross a multipart/form-data boundary as-is).
const parseJson = (val, fallback) => {
  if (val === undefined || val === null || val === "") return fallback;
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

// =========================================================
// 2. CREATE / ONBOARD EMPLOYEE — full 8-step wizard payload:
// identity, contact, academic credentials, employment/contract, payroll
// (StaffEmploymentInfo), IT provisioning fields, and optional attached
// documents. One multipart request, one transaction for everything that
// must be atomic (User/Person/StaffProfile/StaffEmploymentInfo); document
// uploads and the post-submission email triggers run AFTER commit, same
// discipline as the R2-cleanup-after-delete pattern below.
// =========================================================
export const createStaff = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let staffProfile;
  let emailNorm;
  let resetToken;

  try {
    const b = req.body;
    const {
      firstName,
      lastName,
      email,
      phone,
      designation,
      departmentId,
      password,
      dob,
      gender,
      nationalId,
      qualification,
      specialization,
      experienceYears,
      joiningDate,
      primaryRole,
      employmentType,
      contractStartDate,
      contractEndDate,
      probationStartDate,
      probationEndDate,
    } = b;

    if (!firstName || !email)
      throw new Error("First name and email are required.");

    emailNorm = String(email).trim().toLowerCase();
    const exists = await User.findOne({ email: emailNorm }).session(session);
    if (exists) throw new Error("Email already in use.");

    const finalPassword =
      password || Math.random().toString(36).slice(-10) + "A1!";
    const passwordHash = await hashPassword(finalPassword);

    // A "set your password" link is emailed after commit, reusing the
    // existing forgot-password resetToken mechanism — the HR-set temp
    // password above still works as a fallback if the link is never used.
    resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 72 * 60 * 60 * 1000);

    // 1. Create Login User
    const newUser = await User.create(
      [
        {
          email: emailNorm,
          passwordHash,
          roles: primaryRole ? [primaryRole] : ["staff"],
          status: "active",
          emailVerified: true,
          resetToken,
          resetTokenExpires,
        },
      ],
      { session },
    );

    const generatedUserId = newUser[0]._id;

    // Profile photo is optional — a failed/missing upload shouldn't block
    // onboarding, so it's uploaded before the transaction and just left out
    // if it fails.
    let profilePhotoUrl = null;
    const photoFile = req.files?.profilePhoto?.[0];
    if (photoFile) {
      try {
        profilePhotoUrl = await uploadToR2(photoFile, "staff-photos");
      } catch {
        profilePhotoUrl = null;
      }
    }

    const currentAddress = parseJson(b.currentAddress, undefined);
    const permanentAddress = parseJson(b.permanentAddress, undefined);
    const addressLine = b.address || currentAddress?.address || null;
    const cityLine = b.city || currentAddress?.city || null;

    // 2. Create Unified Person Record
    await Person.create(
      [
        {
          userId: generatedUserId,
          name: `${firstName.trim()} ${lastName?.trim() || ""}`.trim(),
          dob: dob || null,
          gender: gender || null,
          nationalId: nationalId || null,
          profilePhotoUrl,
          contact: { address: addressLine, city: cityLine, phone: phone || null },
        },
      ],
      { session },
    );

    const officialEmail = await generateOfficialEmail(firstName, lastName);

    const qualifications = parseJson(b.qualifications, []);
    const dependents = parseJson(b.dependents, []);
    const emergencyContacts = parseJson(b.emergencyContacts, []);
    const teachingSpecializations = parseJson(b.teachingSpecializations, []);
    const researchProfile = parseJson(b.researchProfile, undefined);
    const workingDays = parseJson(b.workingDays, []);
    const disabilityStatus = parseJson(b.disabilityStatus, undefined);

    // 3. Create Staff Profile
    const count = await StaffProfile.countDocuments().session(session);
    const created = await StaffProfile.create(
      [
        {
          userId: generatedUserId,
          employeeId: `EMP-${new Date().getFullYear()}-${1000 + count + 1}`,
          departmentId: departmentId || null,
          designation: designation || "Staff",
          phone: phone || "",
          employmentType: employmentType || "Full-Time",
          qualification: qualification || null,
          specialization: specialization || null,
          experienceYears: experienceYears || 0,
          industryExperienceYears: b.industryExperienceYears || 0,
          joiningDate: joiningDate || new Date(),
          // Only meaningful for time-bound employment types, but harmless
          // to store regardless — the Contract tab / cron only act on
          // these for Visiting/Adjunct/Contract employmentType.
          contractStartDate: contractStartDate || null,
          contractEndDate: contractEndDate || null,
          probation:
            probationStartDate || probationEndDate
              ? {
                  startDate: probationStartDate || null,
                  endDate: probationEndDate || null,
                  durationMonths: b.probationDurationMonths || undefined,
                  status: "in_progress",
                }
              : undefined,

          passportNumber: b.passportNumber || null,
          bloodGroup: b.bloodGroup || null,
          maritalStatus: b.maritalStatus || "Not Specified",
          disabilityStatus,
          qualifications,
          dependents,
          emergencyContacts,
          currentAddress,
          permanentAddress,

          highestDegree: b.highestDegree || undefined,
          teachingSpecializations,
          researchProfile,

          shift: b.shift || "Day Shift",
          workingDays,
          biometricId: b.biometricId || null,
          officialEmail,
        },
      ],
      { session },
    );

    staffProfile = created[0];

    // 4. Payroll & Financial (StaffEmploymentInfo) — only created when a
    // basic salary was actually provided, since it's required on the model.
    if (b.basicSalary) {
      await StaffEmploymentInfo.create(
        [
          {
            staffId: staffProfile._id,
            dateOfJoining: joiningDate || new Date(),
            probationEndDate: probationEndDate || null,
            salaryGrade: b.salaryGrade || null,
            basicSalary: b.basicSalary,
            bankDetails: {
              bankName: b.bankName || null,
              branchCode: b.branchCode || null,
              accountTitle: b.accountTitle || null,
              accountNumber: b.accountNumber || null,
              iban: b.iban || null,
            },
            allowances: {
              phdAllowance: b.phdAllowance || 0,
              researchAllowance: b.researchAllowance || 0,
              housingAllowance: b.housingAllowance || 0,
              transportAllowance: b.transportAllowance || 0,
            },
            taxInfo: { ntn: b.ntn || null, taxBracket: b.taxBracket || null },
            providentFund: {
              enrolled: b.pfEnrolled === "true" || b.pfEnrolled === true,
              employeeContributionPercent: b.pfEmployeePercent || 0,
              employerContributionPercent: b.pfEmployerPercent || 0,
            },
            reportingTo: b.reportingTo || null,
          },
        ],
        { session },
      );
    }

    await session.commitTransaction();

    // --- Post-commit, non-blocking work ---

    // 5. Document Vault — files attached during onboarding (Step 7).
    const documentFiles = req.files?.documents || [];
    const documentsMeta = parseJson(b.documentsMeta, []);
    if (documentFiles.length) {
      await Promise.all(
        documentFiles.map(async (file, idx) => {
          try {
            const meta = documentsMeta[idx] || {};
            const fileUrl = await uploadToR2(file, `staff-documents/${staffProfile._id}`);
            const fileKey = fileUrl.replace(`${process.env.MEDIA_URL}/`, "");
            await StaffDocument.create({
              staffId: staffProfile._id,
              docType: meta.docType || file.originalname,
              category: meta.category || "Onboarding",
              fileUrl,
              fileKey,
              uploadedBy: req.user?._id || null,
              expiryDate: meta.expiryDate || null,
            });
          } catch (err) {
            console.error("Onboarding document upload failed:", err);
          }
        }),
      );
    }

    // 6. Welcome email — set-password link
    try {
      const domain = "https://cisd.cisdportal.online";
      const setPasswordUrl = `${domain}/set-password?email=${encodeURIComponent(emailNorm)}&token=${resetToken}`;
      await sendWelcomeSetPasswordEmail(emailNorm, {
        name: `${firstName} ${lastName || ""}`.trim(),
        setPasswordUrl,
      });
    } catch (err) {
      console.error("Welcome email failed:", err);
    }

    // 7. IT provisioning notification — only if a real recipient is
    // configured; no fake "success" when there's nowhere to send it.
    if (process.env.IT_DEPARTMENT_EMAIL) {
      try {
        const dept = departmentId
          ? await Department.findById(departmentId).select("name")
          : null;
        await sendItProvisioningEmail(process.env.IT_DEPARTMENT_EMAIL, {
          name: `${firstName} ${lastName || ""}`.trim(),
          designation,
          departmentName: dept?.name,
          joiningDate,
          biometricId: b.biometricId,
        });
      } catch (err) {
        console.error("IT provisioning email failed:", err);
      }
    }

    // 8. HOD notification
    if (departmentId) {
      try {
        const dept = await Department.findById(departmentId)
          .select("name headOfDepartment")
          .populate({ path: "headOfDepartment", populate: { path: "userId", select: "email" } });
        const hodEmail = dept?.headOfDepartment?.userId?.email;
        if (hodEmail) {
          await sendHodNewHireEmail(hodEmail, {
            name: `${firstName} ${lastName || ""}`.trim(),
            designation,
            departmentName: dept.name,
          });
        }
      } catch (err) {
        console.error("HOD notification email failed:", err);
      }
    }

    // 9. Close the loop with the public onboarding request this was
    // approved from, if any — links the request to the real account it
    // became instead of leaving it stuck at "Applied" forever.
    if (b.sourceOnboardingRequestId && mongoose.isValidObjectId(b.sourceOnboardingRequestId)) {
      try {
        await JobApplication.updateOne(
          { _id: b.sourceOnboardingRequestId },
          {
            $set: {
              status: "Hired",
              convertedStaffId: staffProfile._id,
              reviewedBy: req.user?._id || null,
              reviewedAt: new Date(),
            },
          },
        );
      } catch (err) {
        console.error("Failed to link onboarding request to new staff record:", err);
      }
    }

    res.status(201).json({
      success: true,
      message: "Staff onboarded successfully.",
      data: { staffId: staffProfile._id },
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// =========================================================
// PENDING ONBOARDING REQUESTS (from the public /teacher-onboarding page) —
// stored as JobApplication docs with source:"public_onboarding". Status
// values reuse that model's existing enum: "Applied" (pending review),
// "Hired" (approved — see createStaff's linkage above), "Rejected".
// =========================================================
const ONBOARDING_STATUS_MAP = { pending: "Applied", approved: "Hired", rejected: "Rejected" };

export const getOnboardingRequests = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const filter = { source: "public_onboarding" };
    if (ONBOARDING_STATUS_MAP[status]) filter.status = ONBOARDING_STATUS_MAP[status];
    const requests = await JobApplication.find(filter)
      .populate("departmentId", "name")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch onboarding requests." });
  }
};

export const getOnboardingRequestById = async (req, res) => {
  try {
    const request = await JobApplication.findOne({ _id: req.params.id, source: "public_onboarding" })
      .populate("departmentId", "name")
      .lean();
    if (!request) {
      return res.status(404).json({ success: false, message: "Onboarding request not found." });
    }
    res.status(200).json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectOnboardingRequest = async (req, res) => {
  try {
    const request = await JobApplication.findOne({ _id: req.params.id, source: "public_onboarding" });
    if (!request) {
      return res.status(404).json({ success: false, message: "Onboarding request not found." });
    }
    if (request.status !== "Applied") {
      return res.status(400).json({ success: false, message: "Only a pending request can be rejected." });
    }
    request.status = "Rejected";
    request.rejectionReason = req.body.reason || "";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();
    res.status(200).json({ success: true, message: "Onboarding request rejected." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================
// 3. UPDATE PROFILE
// =========================================================
export const updateStaff = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params; // This is the StaffProfile ID
    const {
      firstName,
      lastName,
      phone,
      designation,
      departmentId,
      dob,
      gender,
      nationalId,
      address,
      city,
      qualification,
      specialization,
      experienceYears,
      joiningDate,
      employmentType,
    } = req.body;

    const staff = await StaffProfile.findById(id).session(session);
    if (!staff) throw new Error("Staff profile not found.");

    await protectAdminTarget(staff.userId, session);

    // Update Professional Details
    staff.designation = designation || staff.designation;
    staff.phone = phone || staff.phone;
    staff.departmentId = departmentId || staff.departmentId;
    staff.employmentType = employmentType || staff.employmentType;
    staff.qualification =
      qualification !== undefined ? qualification : staff.qualification;
    staff.specialization =
      specialization !== undefined ? specialization : staff.specialization;
    staff.experienceYears =
      experienceYears !== undefined ? experienceYears : staff.experienceYears;
    staff.joiningDate =
      joiningDate !== undefined ? joiningDate : staff.joiningDate;
    await staff.save({ session });

    // Update Personal Details
    if (firstName) {
      await Person.findOneAndUpdate(
        { userId: staff.userId },
        {
          name: `${firstName.trim()} ${lastName?.trim() || ""}`.trim(),
          dob: dob || null,
          gender: gender || null,
          nationalId: nationalId || null,
          "contact.address": address || null,
          "contact.city": city || null,
          "contact.phone": phone || null,
        },
        { upsert: true, session },
      );
    }

    await session.commitTransaction();
    res
      .status(200)
      .json({ success: true, message: "Profile updated successfully." });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// =========================================================
// 3b. UPDATE PROFILE DETAILS — Profile tab (qualifications, dependents,
// emergency contacts, addresses, passport/blood group). One call per
// save from the Employee Profile page's Profile tab.
// =========================================================
export const updateProfileDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      qualifications,
      dependents,
      emergencyContacts,
      currentAddress,
      permanentAddress,
      passportNumber,
      bloodGroup,
      maritalStatus,
      disabilityStatus,
      highestDegree,
      teachingSpecializations,
      industryExperienceYears,
      researchProfile,
    } = req.body;

    const staff = await StaffProfile.findById(id);
    if (!staff)
      return res.status(404).json({ success: false, message: "Staff profile not found." });

    await protectAdminTarget(staff.userId);

    if (qualifications !== undefined) staff.qualifications = qualifications;
    if (dependents !== undefined) staff.dependents = dependents;
    if (emergencyContacts !== undefined) staff.emergencyContacts = emergencyContacts;
    if (passportNumber !== undefined) staff.passportNumber = passportNumber;
    if (bloodGroup !== undefined) staff.bloodGroup = bloodGroup;
    if (maritalStatus !== undefined) staff.maritalStatus = maritalStatus;
    if (disabilityStatus !== undefined) staff.disabilityStatus = disabilityStatus;
    if (highestDegree !== undefined) staff.highestDegree = highestDegree;
    if (teachingSpecializations !== undefined) staff.teachingSpecializations = teachingSpecializations;
    if (industryExperienceYears !== undefined) staff.industryExperienceYears = industryExperienceYears;
    if (researchProfile !== undefined) staff.researchProfile = researchProfile;

    // A real address change gets logged to addressHistory BEFORE being
    // overwritten — never directly editable by the client, only ever
    // appended to here.
    if (currentAddress !== undefined) {
      const prev = staff.currentAddress;
      const changed =
        !prev ||
        prev.address !== currentAddress.address ||
        prev.city !== currentAddress.city ||
        prev.province !== currentAddress.province ||
        prev.country !== currentAddress.country;
      if (changed && prev && (prev.address || prev.city)) {
        staff.addressHistory.push({
          address: prev.address,
          city: prev.city,
          province: prev.province,
          country: prev.country,
          changedAt: new Date(),
        });
      }
      staff.currentAddress = currentAddress;
    }
    if (permanentAddress !== undefined) staff.permanentAddress = permanentAddress;

    await staff.save();
    res.status(200).json({ success: true, message: "Profile details updated." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================
// 3c. UPDATE CONTRACT — Contract & Roles tab (employment type/dates,
// probation, tenure tracking, concurrent role assignments).
// =========================================================
export const updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employmentType,
      contractStartDate,
      contractEndDate,
      probation,
      tenureTrack,
      roleAssignments,
      shift,
      workingDays,
    } = req.body;

    const staff = await StaffProfile.findById(id);
    if (!staff)
      return res.status(404).json({ success: false, message: "Staff profile not found." });

    await protectAdminTarget(staff.userId);

    if (employmentType !== undefined) staff.employmentType = employmentType;
    if (contractStartDate !== undefined) staff.contractStartDate = contractStartDate || null;
    if (contractEndDate !== undefined) staff.contractEndDate = contractEndDate || null;
    if (probation !== undefined) {
      staff.probation = {
        ...staff.probation?.toObject?.(),
        ...probation,
      };
    }
    if (tenureTrack !== undefined) {
      staff.tenureTrack = {
        ...staff.tenureTrack?.toObject?.(),
        ...tenureTrack,
      };
    }
    if (roleAssignments !== undefined) staff.roleAssignments = roleAssignments;
    if (shift !== undefined) staff.shift = shift;
    if (workingDays !== undefined) staff.workingDays = workingDays;

    await staff.save();
    res.status(200).json({ success: true, message: "Contract & role details updated." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================
// 3d. EMPLOYMENT & PAYROLL INFO (StaffEmploymentInfo) — Payroll tab.
// =========================================================
export const getEmploymentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const info = await StaffEmploymentInfo.findOne({ staffId: id })
      .populate({
        path: "reportingTo",
        select: "employeeId designation",
        populate: { path: "personalInfo", select: "name" },
      })
      .lean();
    res.status(200).json({ success: true, data: info || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmploymentInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await StaffProfile.findById(id).select("_id joiningDate userId");
    if (!staff)
      return res.status(404).json({ success: false, message: "Staff profile not found." });

    await protectAdminTarget(staff.userId);

    const {
      salaryGrade,
      basicSalary,
      bankDetails,
      allowances,
      taxInfo,
      providentFund,
      reportingTo,
    } = req.body;

    // Merge nested sub-objects field-by-field (matches updateContract's
    // probation/tenureTrack merge pattern) rather than replacing them
    // wholesale — a partial { bankDetails: { bankName } } payload should
    // never blow away the other bank fields already on file.
    const existing = await StaffEmploymentInfo.findOne({ staffId: id }).lean();

    const info = await StaffEmploymentInfo.findOneAndUpdate(
      { staffId: id },
      {
        $setOnInsert: { staffId: id, dateOfJoining: staff.joiningDate || new Date() },
        ...(salaryGrade !== undefined && { salaryGrade }),
        ...(basicSalary !== undefined && { basicSalary }),
        ...(bankDetails !== undefined && { bankDetails: { ...existing?.bankDetails, ...bankDetails } }),
        ...(allowances !== undefined && { allowances: { ...existing?.allowances, ...allowances } }),
        ...(taxInfo !== undefined && { taxInfo: { ...existing?.taxInfo, ...taxInfo } }),
        ...(providentFund !== undefined && { providentFund: { ...existing?.providentFund, ...providentFund } }),
        ...(reportingTo !== undefined && { reportingTo: reportingTo || null }),
      },
      { new: true, upsert: true, runValidators: true },
    );

    res.status(200).json({ success: true, message: "Employment & payroll info updated.", data: info });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================
// 3e. ONBOARDING CHECKLIST — the HR task tracker (Step 8).
// =========================================================
export const updateOnboardingChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await StaffProfile.findById(id);
    if (!staff)
      return res.status(404).json({ success: false, message: "Staff profile not found." });

    await protectAdminTarget(staff.userId);

    staff.onboardingChecklist = {
      ...staff.onboardingChecklist?.toObject?.(),
      ...req.body,
    };
    await staff.save();

    res.status(200).json({ success: true, message: "Onboarding checklist updated.", data: staff.onboardingChecklist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================
// REGISTER BIOMETRIC ID — the join key the attendance-device/kiosk punch
// endpoint (staffAttendanceDeviceController.js) matches incoming punches
// against. Uniqueness is pre-checked here for a clean error message; the
// model's unique index is the backstop.
// =========================================================
export const registerBiometricId = async (req, res) => {
  try {
    const { id } = req.params;
    const biometricId = (req.body.biometricId || "").trim();
    if (!biometricId) {
      return res.status(400).json({ success: false, message: "biometricId is required." });
    }

    const staff = await StaffProfile.findById(id);
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff profile not found." });
    }

    const existing = await StaffProfile.findOne({
      biometricId,
      _id: { $ne: staff._id },
    }).populate("personalInfo", "name");
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `This Biometric ID is already assigned to ${existing.personalInfo?.name || existing.employeeId}.`,
      });
    }

    staff.biometricId = biometricId;
    await staff.save();

    res.status(200).json({ success: true, message: "Biometric ID registered.", data: { biometricId: staff.biometricId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================
// 4. UPDATE ROLES (Requires User ID)
// =========================================================
export const updateStaffRoles = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params; // This is StaffProfile ID
    const { roles, departmentId } = req.body;

    if (!Array.isArray(roles)) throw new Error("Roles must be a list.");

    let staff = await StaffProfile.findById(id).session(session);
    if (!staff) throw new Error("Staff profile not found.");

    const user = await protectAdminTarget(staff.userId, session);
    if (String(user._id) === String(req.user?._id)) {
      throw new Error("You can't change your own access.");
    }

    // Only known staff roles can be assigned. Roles the account already
    // holds that are no longer in the schema (old "department",
    // "headofaccount", ...) are carried over untouched rather than silently
    // stripped, which would lock those people out.
    const invalid = roles.filter((r) => !EDITABLE_ROLES.includes(r));
    const legacyKept = user.roles.filter((r) => !EDITABLE_ROLES.includes(r));
    const invalidNew = invalid.filter((r) => !legacyKept.includes(r));
    if (invalidNew.length) {
      throw new Error(`Unknown role(s): ${invalidNew.join(", ")}`);
    }
    const uniqueRoles = Array.from(
      new Set([...roles.filter((r) => EDITABLE_ROLES.includes(r)), ...legacyKept]),
    );

    if (uniqueRoles.some((r) => DEPARTMENT_ROLES.includes(r)) && !departmentId) {
      throw new Error("Select a department for Teacher / HOD roles.");
    }

    // Update Department
    staff.departmentId = departmentId || null;
    await staff.save({ session });

    // Update Roles — updateOne (not save) so a legacy role that no longer
    // passes the enum can't fail the whole request.
    await User.updateOne({ _id: user._id }, { $set: { roles: uniqueRoles } }, { session });

    // Handle HOD Assignment
    if (uniqueRoles.includes("hod") && departmentId) {
      await Department.findByIdAndUpdate(
        departmentId,
        { headOfDepartment: staff._id },
        { session },
      );
    } else {
      await Department.updateMany(
        { headOfDepartment: staff._id },
        { $unset: { headOfDepartment: "" } },
        { session },
      );
    }

    await session.commitTransaction();
    res
      .status(200)
      .json({ success: true, message: "Roles and department updated." });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// =========================================================
// 5. UPDATE STATUS & 6. DELETE (Implementation same logic)
// =========================================================
export const updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params; // StaffProfile ID
    const { status } = req.body;

    const staff = await StaffProfile.findById(id);
    await protectAdminTarget(staff.userId);

    await User.findByIdAndUpdate(staff.userId, { status });
    res
      .status(200)
      .json({ success: true, message: `Status updated to ${status}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStaff = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params; // StaffProfile ID
    const staff = await StaffProfile.findById(id).session(session);

    await protectAdminTarget(staff.userId, session);

    // Unassign HOD if applicable
    await Department.updateMany(
      { headOfDepartment: staff._id },
      { $unset: { headOfDepartment: "" } },
      { session },
    );

    // Document Vault records reference this staffId — collected here so
    // their R2 objects can be cleaned up after the transaction commits
    // (R2 isn't transactional, so that cleanup must never block/risk the
    // DB transaction itself).
    const orphanedDocs = await StaffDocument.find({ staffId: id })
      .select("fileKey")
      .session(session);

    // Delete all related records
    await StaffDocument.deleteMany({ staffId: id }).session(session);
    await StaffEmploymentInfo.deleteOne({ staffId: id }).session(session);
    await StaffProfile.findByIdAndDelete(id).session(session);
    await User.findByIdAndDelete(staff.userId).session(session);
    await Person.deleteOne({ userId: staff.userId }).session(session);

    await session.commitTransaction();

    await Promise.all(orphanedDocs.map((d) => deleteFromR2(d.fileKey)));

    res
      .status(200)
      .json({ success: true, message: "Employee permanently deleted." });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// =========================================================
// 7. DASHBOARD STATS — backs the HR home hub's KPI row.
// =========================================================
export const getHrDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryWindowEnd = new Date();
    expiryWindowEnd.setDate(expiryWindowEnd.getDate() + 30);
    const TIME_BOUND_TYPES = ["Visiting", "Adjunct", "Contract"];

    const [
      activeEmployees,
      totalEmployeeRecords,
      pendingLeaveReviews,
      onLeaveToday,
      openJobPostings,
      probationEndingCount,
      documentExpiringCount,
      contractEndingCount,
      departmentBreakdown,
      employmentTypeBreakdown,
    ] = await Promise.all([
      StaffProfile.countDocuments({ status: "Active" }),
      StaffProfile.countDocuments(),
      StaffLeaveRequest.countDocuments({ status: { $in: ["Pending", "Approved_HOD"] } }),
      StaffLeaveRequest.countDocuments({
        status: "Approved_HR",
        startDate: { $lte: today },
        endDate: { $gte: today },
      }),
      JobPosting.countDocuments({ status: "Published" }),
      StaffProfile.countDocuments({
        "probation.status": "in_progress",
        "probation.endDate": { $gte: today, $lte: expiryWindowEnd },
      }),
      StaffDocument.countDocuments({ expiryDate: { $gte: today, $lte: expiryWindowEnd } }),
      StaffProfile.countDocuments({
        employmentType: { $in: TIME_BOUND_TYPES },
        contractEndDate: { $gte: today, $lte: expiryWindowEnd },
      }),
      StaffProfile.aggregate([
        { $match: { status: "Active" } },
        {
          $lookup: {
            from: "departments",
            localField: "departmentId",
            foreignField: "_id",
            as: "dept",
          },
        },
        { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
        { $group: { _id: { $ifNull: ["$dept.name", "Unassigned"] }, count: { $sum: 1 } } },
        { $project: { _id: 0, name: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),
      StaffProfile.aggregate([
        { $match: { status: "Active" } },
        { $group: { _id: "$employmentType", count: { $sum: 1 } } },
        { $project: { _id: 0, type: "$_id", count: 1 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        activeEmployees,
        totalEmployeeRecords,
        onLeaveToday,
        pendingLeaveReviews,
        openJobPostings,
        expiringSoonCount: probationEndingCount + documentExpiringCount + contractEndingCount,
        departmentBreakdown,
        employmentTypeBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
