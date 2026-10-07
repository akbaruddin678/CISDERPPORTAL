import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { personalInfoSchema } from "../services/admissionValidation";

const usePersonalInfoController = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
    watch, 
     setValue,
  } = useForm({
    resolver: yupResolver(personalInfoSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      // Personal Information
      fullName: "",
      fatherName: "",
      phone: "",
      cnic: "",
      dob: null,
      gender: "",

      // Address Information
      currentAddress: "",
      currentDistrict: "",
      currentProvince: "",
      currentCountry: "",
      permanentAddress: "",
      permanentDistrict: "",
      permanentProvince: "",
      permanentCountry: "",

      // Family Information
      fatherCnic: "",
      motherName: "",
      motherCnic: "",
      fatherStatus: "",
      guardianPhone: "",
      fathersProfession: "",
      guardianDesignation: "",
      familyIncome: "",

      // Applied For
      applyingForDepartment: "",
      applyingForProgram: "",
      applyingSession: "",
    },
  });

  // Validate the step before proceeding
  const validateStep = async () => await trigger();

  // Get all the values of the form
  const getAllPersonalData = () => {
    const data = getValues();
    return data;
  };

  return {
    control,
    errors,
    handleSubmit,
    validateStep,
    getValues,
    getAllPersonalData,
    watch, 
    setValue, // Return setValue
  };
};

export default usePersonalInfoController;