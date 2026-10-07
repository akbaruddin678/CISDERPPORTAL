import multer from "multer";

const storage = multer.memoryStorage();

// Export the MULTER INSTANCE, not the middleware
export const admissionUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!allowed.includes(file.mimetype))
      return cb(new Error("Invalid file type"), false);
    cb(null, true);
  },
});
