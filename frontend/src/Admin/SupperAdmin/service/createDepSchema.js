import * as yup from "yup";

export const createDepSchema = yup.object().shape({
  name: yup.string().required("Department name is required"),
  code: yup.string().required("Department code is required"),
});