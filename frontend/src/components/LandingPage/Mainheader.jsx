import React from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/cisd-logo.png";
import { useAuth } from "../auth/context/AuthContext";

const MainHeader = () => {
  const { isLogin, authLoading } = useAuth();

  return (
    <header
      style={{ border: "none" }}
      className="bg-[#616161] backdrop-blur-md border-b sticky top-0 z-50"
    >
      <div className="container mx-auto px-2 py-0">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-0 group">
            <img
              src={Logo}
              alt="University Icon"
              className="object-cover group-hover:scale-105 transition"
              style={{ height: "90px", width: "90px" }}
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-white/80 hover:text-university-navy transition-colors"
            >
              Home
            </Link>
            <Link
              to="/profile"
              className="text-white/80 hover:text-university-navy transition-colors"
            >
              Admissions
            </Link>
            <Link
              to="/about"
              className="text-white/80 hover:text-university-navy transition-colors"
            >
              About CISD
            </Link>
            <Link
              to="/contact"
              className="text-white/80 hover:text-university-navy transition-colors"
            >
              Contact
            </Link>

            {/* Conditional Button */}
            {!authLoading &&
              (isLogin ? (
                <Link
                  to="/profile"
                  className="shadow-md bg-white text-black px-4 py-2 rounded transition hover:scale-105"
                >
                  Apply Now
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="shadow-md bg-white text-black px-4 py-2 rounded transition hover:scale-105"
                >
                  Login
                </Link>
              ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default MainHeader;
