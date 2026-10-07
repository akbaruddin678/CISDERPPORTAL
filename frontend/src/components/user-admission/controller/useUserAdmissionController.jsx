import { useState, useEffect, useRef } from "react";
import {
  useGetMyAdmissionQuery,
  useSaveDraftMutation,
  useSubmitAdmissionMutation,
} from "../api/admissionApi";
import usePersonalInfoController from "../hooks/usePersonalInfoController";
import useEducationDetailsController from "../hooks/useEducationDetailsController";
import useDocumentUploadController from "../hooks/useDocumentUploadController";
import useDeclarationController from "../hooks/useDeclarationController";
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const useUserAdmissionController = () => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const alert = useGlobalAlert();
  const navigate = useNavigate();

  const isDataPopulated = useRef(false);

  const { data: draftResponse, isLoading: isLoadingDraft } =
    useGetMyAdmissionQuery();
  const [saveDraft, { isLoading: isSaving }] = useSaveDraftMutation();
  const [submitFinal, { isLoading: isSubmitting }] =
    useSubmitAdmissionMutation();

  const personalInfo = usePersonalInfoController();
  const educationDetails = useEducationDetailsController();
  const currentEducation = educationDetails.watch("educationDetails") || [];
  const documentUpload = useDocumentUploadController(currentEducation);
  const declaration = useDeclarationController();

  // --- POPULATE DATA (RESUME) ---
  useEffect(() => {
    if (draftResponse?.data && !isDataPopulated.current) {
      const d = draftResponse.data;
      if (d.status !== "draft") {
        navigate("/profile");
        return;
      }
      isDataPopulated.current = true;

      if (d.currentStep) setStep(d.currentStep);

      // Restore Personal
      const personalFields = [
        "fullName",
        "fatherName",
        "phone",
        "cnic",
        "gender",
        "dob",
        "fatherCnic",
        "motherName",
        "motherCnic",
        "guardianPhone",
        "guardianDesignation",
        "incomeBracket",
        "fathersProfession",
        "fatherStatus",
      ];
      personalFields.forEach((f) => {
        if (d[f]) personalInfo.setValue(f, d[f], { shouldValidate: true });
      });
      if (d.dob) personalInfo.setValue("dob", dayjs(d.dob));

      // Restore Catalogs (Fix for Dropdowns)
      const getId = (val) => (val && typeof val === "object" ? val._id : val);
      if (d.academicDepartment)
        personalInfo.setValue(
          "applyingForDepartment",
          getId(d.academicDepartment)
        );
      if (d.applyingForProgram)
        personalInfo.setValue(
          "applyingForProgram",
          getId(d.applyingForProgram)
        );
      if (d.applyingSession)
        personalInfo.setValue("applyingSession", getId(d.applyingSession));

      // Restore Addresses
      const addrFields = [
        "currentAddress",
        "currentDistrict",
        "currentProvince",
        "currentCountry",
        "permanentAddress",
        "permanentDistrict",
        "permanentProvince",
        "permanentCountry",
      ];
      addrFields.forEach((f) => {
        if (d[f]) personalInfo.setValue(f, d[f]);
      });

      // Restore Education
      if (d.educationDetails?.length > 0) {
        const cleanEdu = d.educationDetails.map((e) => ({
          ...e,
          startDate: e.startDate ? dayjs(e.startDate) : null,
          endDateOrResultAwaited:
            e.endDateOrResultAwaited &&
            e.endDateOrResultAwaited !== "Result Awaited"
              ? dayjs(e.endDateOrResultAwaited)
              : e.endDateOrResultAwaited,
        }));
        educationDetails.setValue("educationDetails", cleanEdu);
      }

      // Restore Documents
      const docFields = [
        "profilePhoto",
        "cnicDoc_front",
        "cnicDoc_back",
        "domicileDoc",
        "matricCertificate",
        "fscCertificate",
      ];
      docFields.forEach((f) => {
        if (d[f]) documentUpload.setValue(f, d[f]);
      });

      if (d.agreeDeclaration) declaration.setValue("agreeDeclaration", "yes");
    }
  }, [draftResponse, navigate]);

  // --- NAVIGATION ---
  const goNext = async () => {
    let isValid = false;
    let dataToSave = {};

    if (step === 1) {
      isValid = await personalInfo.validateStep();
      const vals = personalInfo.getValues();
      dataToSave = {
        ...vals,
        dob: vals.dob ? new Date(vals.dob).toISOString() : null,
      };
    } else if (step === 2) {
      isValid = await educationDetails.validateStep();
      const rawEdu = educationDetails.getValues().educationDetails || [];
      const cleanEdu = rawEdu.map((e) => ({
        ...e,
        startDate: e.startDate ? new Date(e.startDate).toISOString() : null,
        endDateOrResultAwaited:
          e.endDateOrResultAwaited &&
          e.endDateOrResultAwaited !== "Result Awaited"
            ? new Date(e.endDateOrResultAwaited).toISOString()
            : e.endDateOrResultAwaited,
      }));
      dataToSave = { educationDetails: cleanEdu };
    } else if (step === 3) {
      isValid = await documentUpload.validateStep();
      const rawDocs = documentUpload.getValues();

      // --- CRITICAL FIX: PREVENT SENDING FILE OBJECTS ---
      const pendingFiles = Object.values(rawDocs).some(
        (val) => val && typeof val === "object"
      );

      if (pendingFiles) {
        alert.openAlert({
          message:
            "Please wait for files to finish uploading (Green border or View link).",
          severity: "warning",
        });
        return; // STOP execution
      }

      // Filter: Send only URL strings
      dataToSave = {};
      Object.keys(rawDocs).forEach((key) => {
        if (typeof rawDocs[key] === "string") {
          dataToSave[key] = rawDocs[key];
        }
      });
    } else if (step === 4) {
      isValid = await declaration.validateStep();
      dataToSave = declaration.getValues();
    }

    if (!isValid) {
      alert.openAlert({
        message: "Please fill all required fields.",
        severity: "error",
      });
      return;
    }

    // Save Current Step
    try {
      await saveDraft({ step, data: dataToSave }).unwrap();

      if (step < totalSteps) {
        setStep((prev) => prev + 1);
      } else {
        await handleFinalSubmit();
      }
    } catch (err) {
      console.error(err);
      alert.openAlert({
        message: "Failed to save progress.",
        severity: "error",
      });
    }
  };

  const goBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  const handleFinalSubmit = async () => {
    try {
      const declarationData = declaration.getValues();
      await saveDraft({ step: 4, data: declarationData }).unwrap();
      await submitFinal().unwrap();

      alert.openAlert({
        message: "Application submitted successfully!",
        severity: "success",
      });
      navigate("/profile");
    } catch (error) {
      alert.openAlert({
        message: error?.data?.error || "Submission Failed",
        severity: "error",
      });
    }
  };

  return {
    step,
    totalSteps,
    goNext,
    goBack,
    submitting: isSaving || isSubmitting || isLoadingDraft,
    personalInfo,
    educationDetails,
    documentUpload,
    declaration,
    handleFinalSubmit,
  };
};

export default useUserAdmissionController;
