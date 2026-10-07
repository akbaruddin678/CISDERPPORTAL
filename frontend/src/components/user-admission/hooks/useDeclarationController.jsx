// src/components/user-admission/hooks/useDeclarationController.js
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { declarationSchema } from "../services/admissionValidation";

const useDeclarationController = () => {
  const {
    control,
    formState: { errors },
    trigger,
    getValues,
        watch,
    setValue, 
  } = useForm({
    resolver: yupResolver(declarationSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      applyingFor: "", // program select
      agreeDeclaration: "", // "yes" when agreed

    },
  });

  const validateStep = async () => await trigger();

  return { control, errors, validateStep, getValues,     watch, 
    setValue  };
};

export default useDeclarationController;
