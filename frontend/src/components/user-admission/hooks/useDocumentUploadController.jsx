import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMemo } from "react";
// FIX: Correctly importing the Named Export
import { getDocumentSchema } from "../services/admissionValidation";

const useDocumentUploadController = (educationDetails = []) => {
  const educationKey = JSON.stringify(educationDetails);

  const schema = useMemo(() => {
    return getDocumentSchema(educationDetails);
  }, [educationKey]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
    getValues,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      profilePhoto: null,
      cnicDoc_front: null,
      cnicDoc_back: null,
      domicileDoc: null,
      matricCertificate: null,
      fscCertificate: null,
    },
  });

  const validateStep = async () => {
    return await trigger();
  };

  return {
    control,
    errors,
    watch,
    setValue,
    validateStep,
    getValues,
  };
};

export default useDocumentUploadController;
