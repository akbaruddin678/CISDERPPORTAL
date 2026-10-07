import { useAuth } from "../../auth/context/AuthContext"; // adjust path
import { getNavLink } from "../services/navLinks";

export const useNavbarStateController = () => {
  const { isLogin , userData } = useAuth(); // from your context
  const navLinks = getNavLink({ isLogin }); // pass isLogin to navLinks
  return {
    navLinks,
    isLoggedIn: isLogin || false,
    userData
  };
};
