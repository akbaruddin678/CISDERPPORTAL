import express from "express";
import {
  getAllStudents,
  getStudentDetails,
  getStudentStats,
  updateStudent,
  updateStudentRemark,
  getAllStudentsForPrint,
  getStudentsByDepartmentName,
  resendAdmissionEmail,
} from "../controller/studentController.js";
import { admissionUpload } from "../../core/middleware/upload.js";
import { registerStudents } from "../controller/studentRegistrationControllertemporary.js";
import { protect } from "../../core/middleware/auth.js";

const router = express.Router();
router.post("/register", registerStudents);


router.use(protect);



// 1. Static Routes (MUST COME FIRST)
router.get("/stats", getStudentStats);
router.get("/print-all", getAllStudentsForPrint); 
router.get("/by-department", getStudentsByDepartmentName);


// 2. Root Route (Paginated List)
router.get("/", getAllStudents);


router.get("/:studentId", getStudentDetails);
router.patch("/:studentId/remark", updateStudentRemark);
router.post("/:studentId/resend-admission-email", resendAdmissionEmail);

router.put(
  "/:studentId",
  admissionUpload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "cnicFront", maxCount: 1 },
    { name: "cnicBack", maxCount: 1 },
    { name: "matricCertificate", maxCount: 1 },
    { name: "fscCertificate", maxCount: 1 },
    { name: "domicileDoc", maxCount: 1 },
  ]),
  updateStudent
);

export default router;
