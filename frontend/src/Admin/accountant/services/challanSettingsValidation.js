import * as yup from "yup";

export const academicFeeValidationSchema = yup.object().shape({
  academicLevel: yup.string().default("SEMESTER"),
  
  // Transform NaN to 0
  totalRecurringFee: yup.number().transform((v) => (isNaN(v) ? 0 : v)).default(0),
  totalOneTimeFee: yup.number().transform((v) => (isNaN(v) ? 0 : v)).default(0),
  securityFee: yup.number().transform((v) => (isNaN(v) ? 0 : v)).default(0),
  miscellaneousFee: yup.number().transform((v) => (isNaN(v) ? 0 : v)).default(0),
  
  // New Fields for Exam/Re-Admission
  totalAmount: yup.number().transform((v) => (isNaN(v) ? 0 : v)).default(0),
  levelNumber: yup.mixed().nullable(), 

  semesterNumber: yup.mixed().nullable(),
  miscellaneousRemark: yup.string().nullable(),

  feeItems: yup.array().of(
    yup.object().shape({
      headId: yup.string().nullable(), 
      amount: yup.number(),
    })
  ),
});