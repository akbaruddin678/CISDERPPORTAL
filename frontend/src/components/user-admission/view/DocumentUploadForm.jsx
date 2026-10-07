import React, { useCallback, useState, useEffect } from "react";
// REMOVED: Custom FileInput import to avoid conflict
// import FileInput from "../../../shared/sharedFileInput/container/FileInput";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useUploadFileMutation } from "../api/admissionApi";

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const SUPPORTED_DOCUMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const DocumentUploadForm = ({
  control,
  errors,
  setValue,
  getValues,
  educationDetails = [],
}) => {
  const alert = useGlobalAlert();
  const [previews, setPreviews] = useState({});
  const [uploadFile] = useUploadFileMutation();

  // --- 1. RESTORE PREVIEWS ON MOUNT (RUNS ONCE) ---
  useEffect(() => {
    const fileFields = [
      "profilePhoto",
      "cnicDoc_front",
      "cnicDoc_back",
      "domicileDoc",
      "matricCertificate",
      "fscCertificate",
    ];

    const currentValues =
      getValues && typeof getValues === "function" ? getValues() : {};
    let initialPreviews = {};

    fileFields.forEach((key) => {
      const val = currentValues[key];
      // Only show preview if it is a valid Server URL string
      if (typeof val === "string" && val.startsWith("http")) {
        const isImg =
          val.match(/\.(jpeg|jpg|png)/i) || val.includes("profile-photos");
        initialPreviews[key] = {
          url: val,
          type: isImg ? "image" : "pdf",
          name: "Saved Document",
          uploading: false,
        };
      }
    });

    setPreviews(initialPreviews);
  }, []); // Empty dependency array prevents infinite loops

  // --- 2. HANDLE FILE SELECTION ---
  const handleFileChange = async (name, e, isImage = false) => {
    // 1. Get the file directly from the event
    const file = e.target.files?.[0];

    // Reset input value so the same file can be selected again if needed
    e.target.value = "";

    // Handle Cancel/No File
    if (!file) return;

    // 2. Validate
    const acceptedTypes = isImage
      ? SUPPORTED_IMAGE_TYPES
      : SUPPORTED_DOCUMENT_TYPES;

    if (!acceptedTypes.includes(file.type)) {
      alert.openAlert({
        message: isImage
          ? "Only JPG/PNG images allowed."
          : "Only PDF, JPG, or PNG allowed.",
        severity: "error",
      });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert.openAlert({
        message: "File is too large. Maximum size is 500KB.",
        severity: "error",
      });
      return;
    }

    // 3. Set Loading State (Optimistic UI)
    const objectUrl = URL.createObjectURL(file);
    setPreviews((prev) => ({
      ...prev,
      [name]: {
        url: objectUrl,
        type: file.type.includes("image") ? "image" : "pdf",
        name: file.name,
        uploading: true, // Triggers the blue progress bar
      },
    }));

    // 4. Upload to Server
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadFile(formData).unwrap();

      if (res.url) {
        // SUCCESS: Save the Server URL to the Form
        setValue(name, res.url, { shouldValidate: true, shouldDirty: true });

        // Update Preview to "Done" state
        setPreviews((prev) => ({
          ...prev,
          [name]: {
            ...prev[name],
            uploading: false,
            url: res.url,
          },
        }));
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert.openAlert({
        message: "Upload failed. Please check your internet connection.",
        severity: "error",
      });

      // FAILURE: Clear the preview and the form value
      setValue(name, null);
      setPreviews((prev) => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    }
  };

  const handleRemove = (name) => {
    setValue(name, null, { shouldValidate: true, shouldDirty: true });
    setPreviews((prev) => {
      const n = { ...prev };
      delete n[name];
      return n;
    });
  };

  // --- 3. UI COMPONENT ---
  const UploadCard = ({
    name,
    label,
    isImage,
    isProfilePhoto = false,
    isOptional = false,
  }) => {
    const preview = previews[name];
    const hasError = !!errors[name];

    return (
      <div
        className={`relative bg-white border-2 rounded-xl p-4 transition-all duration-200 group/card ${
          hasError
            ? "border-red-300 bg-red-50"
            : preview
            ? "border-green-500 bg-green-50"
            : "border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50"
        } ${
          isProfilePhoto
            ? "col-span-full md:col-span-1 md:row-span-2 h-full flex flex-col justify-center"
            : ""
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            {label}{" "}
            {isOptional && (
              <span className="text-gray-400 font-normal text-xs">
                (Optional)
              </span>
            )}
          </label>
          {preview && !preview.uploading && (
            <button
              type="button"
              onClick={() => handleRemove(name)}
              className="text-xs text-red-600 border px-2 py-1 rounded bg-white hover:bg-red-50 z-20 relative"
            >
              Remove
            </button>
          )}
        </div>

        <div className="flex flex-col items-center justify-center min-h-[140px] relative w-full">
          {/* --- LOADING STATE --- */}
          {preview?.uploading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 rounded-lg">
              <div className="w-3/4 h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-600 w-full animate-pulse"></div>
              </div>
              <span className="text-xs font-bold text-blue-600 animate-pulse">
                Uploading...
              </span>
            </div>
          )}

          {/* --- PREVIEW STATE --- */}
          {preview ? (
            <div className="w-full flex flex-col items-center">
              {preview.type === "image" || isProfilePhoto ? (
                <div className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                  <img
                    src={preview.url}
                    alt="Preview"
                    className={`object-cover ${
                      isProfilePhoto
                        ? "w-32 h-32 rounded-full border-4 border-white shadow-md"
                        : "w-full h-36 rounded-lg"
                    }`}
                  />
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium"
                  >
                    View Image
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-32 bg-gray-100 rounded-lg border p-2">
                  <span className="text-3xl mb-1">📄</span>
                  <a
                    href={preview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate w-full text-center"
                  >
                    View Document
                  </a>
                </div>
              )}
            </div>
          ) : (
            // --- EMPTY STATE (INPUT) ---
            <div className="text-center w-full h-full flex flex-col items-center justify-center group-hover/card:scale-105 transition-transform">
              <div
                className={`mb-3 bg-blue-50 rounded-full flex items-center justify-center ${
                  isProfilePhoto ? "w-20 h-20" : "w-12 h-12"
                }`}
              >
                <svg
                  className={`text-blue-500 ${
                    isProfilePhoto ? "w-8 h-8" : "w-6 h-6"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isProfilePhoto ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  )}
                </svg>
              </div>
              <div className="relative">
                {/* STANDARD HTML INPUT - Guarantees onChange fires */}
                <input
                  type="file"
                  id={`file-input-${name}`}
                  accept={isImage ? ".jpg,.jpeg,.png" : ".pdf,.jpg,.jpeg,.png"}
                  onChange={(e) => handleFileChange(name, e, isImage)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <button className="text-sm text-blue-600 bg-white border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors shadow-sm">
                  Select File
                </button>
              </div>
              <p className="mt-2 text-[10px] text-gray-400">Max 500KB</p>
            </div>
          )}
        </div>
        {hasError && (
          <p className="text-xs text-red-500 font-medium mt-2 text-center animate-pulse">
            {errors[name]?.message}
          </p>
        )}
      </div>
    );
  };

  const showMatric = educationDetails.some((e) => e.educationProgram === "SSC");
  const showInter = educationDetails.some((e) => e.educationProgram === "HSSC");

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Document Upload</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Please upload clear scans or photos (Max 500KB).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UploadCard
          name="profilePhoto"
          label="Profile Photograph"
          isImage={true}
          isProfilePhoto={true}
        />
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UploadCard
            name="cnicDoc_front"
            label="CNIC (Front)"
            isImage={true}
          />
          <UploadCard name="cnicDoc_back" label="CNIC (Back)" isImage={true} />
        </div>
        <div className="md:col-span-3">
          <h3 className="text-lg font-semibold mb-4 pl-2 border-l-4 border-blue-500">
            Academic Certificates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <UploadCard
              name="domicileDoc"
              label="Domicile Certificate"
              isOptional={true}
            />
            {showMatric && (
              <UploadCard
                name="matricCertificate"
                label="Matric / SSC Certificate"
              />
            )}
            {showInter && (
              <UploadCard
                name="fscCertificate"
                label="Intermediate / HSSC Certificate"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadForm;
