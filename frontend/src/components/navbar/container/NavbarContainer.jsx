import LogoutNavbar from "../../LandingPage/LogoutHeader";
import { useNavbarStateController } from "../controller/useNavbarController";
import AdminNavbar from "../view/AdminNavbar";

import NavbarView from "../view/NavbarView";

const NavbarContainer = () => {
  const controller = useNavbarStateController();

  if (!controller?.isLoggedIn) {
    return <LogoutNavbar />;
  } else if (controller?.userData?.roles[0] === "student") {
    return <NavbarView {...controller} />;
  }
  return <AdminNavbar />;
};

export default NavbarContainer;
