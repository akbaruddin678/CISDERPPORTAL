import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useNavigate } from "react-router-dom"; // Import navigate
import { useGlobalAlert } from "../../../shared/Alert/context/AlertContext";
import { useLoginUserMutation } from "../api/userApi";
import { loginSchema } from "../services/loginValidation";
import { useAuth } from "../../auth/context/AuthContext";
import { SetBackendValidation } from "../../../shared/validation/BackendValidtion/CustomValidation";
import { saveUserData } from "../services/localStorageService"; // Import storage
import { setActiveCampusId } from "../../../shared/campus/campusRequest";

const useLoginStateController = () => {
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const { openAlert, AlertComponent } = useGlobalAlert();
  const { dispatchAuthLogin } = useAuth();
  const navigate = useNavigate();

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setError,
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (formData) => {
    try {
      const result = await loginUser(formData).unwrap();
  
      if (result?.user) {
        setActiveCampusId(result.user.campusAccess === "all" ? "all" : (result.user.campusId || ""));
        // 1. Save to Local Storage
        saveUserData({ userData: result.user, token: result.token });

        // 2. Update Context
        dispatchAuthLogin({
          userData: result.user,
          token: result.token,
        });

        openAlert({
          message: result?.message || "Logged in successfully!",
          severity: "success",
        });
        reset();

        // 3. Redirect to Dashboard
        navigate("/");
      }
    } catch (err) {
      const type = err?.data?.type || "SERVER_ERROR";
      const message = err?.data?.message || "Something went wrong!";

      // --- ERROR HANDLING LOGIC ---
      if (type === "USER_NOT_FOUND") {
        SetBackendValidation(setError, "email", "Email not found.");
      } else if (type === "INVALID_CREDENTIALS") {
        SetBackendValidation(setError, "password", "Incorrect password.");
      
      // 🔒 HANDLE BLOCKED USER
      } else if (type === "NOT_VERIFIED") {
        openAlert({
          message: "Account not active. Please check your email to verify.",
          severity: "warning",
        });
      } else {
        openAlert({ message, severity: "error" });
      }
    }
  };

  return {
    onSubmit: handleSubmit(onSubmit),
    control,
    errors,
    loginLoading: isLoading,
    AlertComponent,
  };
};

export default useLoginStateController;
