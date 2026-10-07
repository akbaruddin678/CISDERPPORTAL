import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { educationSchema } from "../services/admissionValidation";

const useEducationDetailsController = () => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
    reset,
        watch, 
    setValue, 
  } = useForm({
    resolver: yupResolver(educationSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      educationDetails: [
        {
          educationProgram: "",
          session: "",
          startDate: null,
          endDateOrResultAwaited: null,
          obtainedMarks: "",
          totalMarks: "",
          percentage: "",
        },
      ],
    },
  });

  // Hook for managing array of education details
  const { fields, append, remove } = useFieldArray({
    control,
    name: "educationDetails",
  });

  // Helper: add a new education record
  const addEducation = () => {
    append({
      educationProgram: "",
      session: "",
      startDate: null,
      endDateOrResultAwaited: null,
      obtainedMarks: "",
      totalMarks: "",
      percentage: "",
    });
  };

  // Helper: remove education by index
  const removeEducation = (index) => {
    remove(index);
  };

  const validateStep = async () => await trigger();

  return {
    control,
    errors,
    handleSubmit,
    validateStep,
    getValues,
    reset,
    fields,
    addEducation,
    removeEducation,
        watch, 
    setValue, 
  };
};

export default useEducationDetailsController;
