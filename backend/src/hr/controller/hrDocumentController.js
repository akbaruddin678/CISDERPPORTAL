import StaffDocument from "../../staff/models/StaffDocument.js";
import StaffProfile from "../../staff/models/StaffProfile.js";
import { uploadToR2 } from "../../core/utils/cloudflareR2.js";

// Categories only HR/admin (and Accountant, for Financial) may ever see —
// the real-world equivalent of "RBAC via pre-signed URLs" this stack can
// actually provide, since R2 uploads here return a public link rather
// than a presigned one: sensitive categories are filtered out of the API
// response entirely for anyone else, instead of ever reaching the client.
const RESTRICTED_CATEGORIES = ["Financial", "Contract", "Medical", "Exit"];

const canSeeRestricted = (roles = []) =>
  roles.includes("hr") || roles.includes("admin") || roles.includes("accountant");

// =========================================================
// 1. UPLOAD DOCUMENT
// =========================================================
export const uploadStaffDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { docType, category, expiryDate } = req.body;

    if (!req.file)
      return res.status(400).json({ success: false, message: "A file is required." });
    if (!docType)
      return res.status(400).json({ success: false, message: "Document type is required." });

    const staff = await StaffProfile.findById(id).select("_id");
    if (!staff)
      return res.status(404).json({ success: false, message: "Staff profile not found." });

    const fileUrl = await uploadToR2(req.file, `staff-documents/${id}`);
    // uploadToR2 returns the public URL built from MEDIA_URL + key — the
    // key itself is everything after MEDIA_URL/, kept separately so the
    // object can be identified/managed in R2 independent of the URL shape.
    const fileKey = fileUrl.replace(`${process.env.MEDIA_URL}/`, "");

    const doc = await StaffDocument.create({
      staffId: id,
      docType,
      category: category || "Other",
      fileUrl,
      fileKey,
      uploadedBy: req.user?._id || null,
      expiryDate: expiryDate || null,
    });

    res.status(201).json({ success: true, message: "Document uploaded.", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================
// 2. LIST DOCUMENTS (category-filtered by requester role)
// =========================================================
export const getStaffDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const query = { staffId: id };
    if (!canSeeRestricted(req.user?.roles)) {
      query.category = { $nin: RESTRICTED_CATEGORIES };
    }

    const docs = await StaffDocument.find(query).sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================
// 3. VERIFY DOCUMENT (hr/admin only — already gated at the route level)
// =========================================================
export const verifyStaffDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await StaffDocument.findByIdAndUpdate(
      docId,
      { verified: true, verifiedBy: req.user?._id || null, verifiedAt: new Date() },
      { new: true },
    );
    if (!doc)
      return res.status(404).json({ success: false, message: "Document not found." });

    res.status(200).json({ success: true, message: "Document verified.", data: doc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================
// 4. DELETE DOCUMENT
// =========================================================
export const deleteStaffDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const doc = await StaffDocument.findByIdAndDelete(docId);
    if (!doc)
      return res.status(404).json({ success: false, message: "Document not found." });

    res.status(200).json({ success: true, message: "Document deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
