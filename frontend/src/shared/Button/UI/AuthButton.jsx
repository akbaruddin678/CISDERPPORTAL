import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../components/auth/context/AuthContext";

const AuthButton = () => {
  const navigate = useNavigate();
  const { userData, isLogin } = useAuth();

  const handleClick = () => {
    if (isLogin) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 rounded-lg transition-all duration-200"
      style={{
        background: isLogin
          ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
          : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: "white",
        fontWeight: 500,
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        minWidth: "100px",
      }}
    >
      {isLogin ? "Profile" : "Login"}
    </button>
  );
};

export default AuthButton;
