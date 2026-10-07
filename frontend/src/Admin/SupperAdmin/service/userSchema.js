import * as yup from "yup";

export const getUserSchema = (isEditMode) =>
  yup.object().shape({
    name: yup.string().required("Name is required"),
    email: yup
      .string()
      .email("Invalid email format")
      .required("Email is required"),
    role: yup.string().required("Role is required"),
    campusId: yup.string().when("role", {
      is: (role) => ["accountant", "admission"].includes(role),
      then: (schema) => schema.required("A school/campus is required for this login"),
      otherwise: (schema) => schema.optional(),
    }),
    password: yup
      .string()
      .test("password-required", "Password is required", function (value) {
        // If we are creating a new user, password is REQUIRED
        if (!isEditMode && (!value || value.trim() === "")) return false;
        return true;
      })
      .test(
        "password-length",
        "Password must be at least 8 characters",
        function (value) {
          // If a value is provided, it must be >= 8 chars, even in edit mode
          if (value && value.trim() !== "" && value.length < 8) return false;
          return true;
        },
      ),
    confirmPassword: yup
      .string()
      .test("passwords-match", "Passwords must match", function (value) {
        return this.parent.password === value;
      }),
  });
