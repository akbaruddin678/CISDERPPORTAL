import { Link, useLocation } from "react-router-dom";
import MainHeader from "../../LandingPage/Mainheader";

const NavbarView = ({ navLinks, isLoggedIn }) => {
  const { pathname } = useLocation(); // Track current route

  return <MainHeader />;
};

export default NavbarView;
