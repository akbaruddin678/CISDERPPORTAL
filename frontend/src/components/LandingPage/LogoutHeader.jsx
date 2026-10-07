import React from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/cisd-logo.png";
import { useAuth } from "../auth/context/AuthContext";

const LogoutNavbar = () => {
  const { isLogin, authLoading } = useAuth();

  return (
    <header className="bg-gradient-to-r from-[#616161] to-[#757575] shadow-lg sticky top-0 z-50 border-b border-gray-300">
      {/* Top Bar */}
      <div className="bg-[#f9f9f9] text-black py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>admissions@cisd.edu.pk</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-Green-300 font-semibold">🎓 Admissions Open Spring 2026</span>
              <div className="hidden lg:flex items-center space-x-3 text-xs">
                <span>📍 B/17, Islamabad Pakistan</span>
                <span>⏰ Mon-Fri: 8AM-6PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between ">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src={Logo}
              alt="CISD Logo"
              className="object-cover bg-white group-hover:scale-105 rounded-xl transition-transform duration-300"
              style={{ height: "80px", width: "80px" }}
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white">CISD</h1>
              <p className="text-gray-200 text-sm">Transforming Education, Empowering Futures</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Main Navigation Items */}
            <Link 
              to="/programs" 
              className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium flex items-center space-x-1"
            >
              {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg> */}
              <span>Programs</span>
            </Link>

            <Link 
              to="/admissions" 
              className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium flex items-center space-x-1"
            >
              {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg> */}
              <span>Admissions</span>
            </Link>

            <Link 
              to="/campus" 
              className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium flex items-center space-x-1"
            >
              {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg> */}
              <span>Campus Life</span>
            </Link>

            <Link 
              to="/about" 
              className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium flex items-center space-x-1"
            >
              {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg> */}
              <span>About</span>
            </Link>

            {/* Conditional Action Button */}
            {!authLoading && (
              <div className="ml-4">
                {isLogin ? (
                  <Link
                    to="/profile"
                    className="bg-gradient-to-r from-white to-gray-100 text-[#616161] px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 border border-gray-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Continue Application</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="bg-gradient-to-r from-white ml-8 to-gray-100 text-[#616161] px-6 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2 border border-gray-200"
                  >
                    {/* <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg> */}
                    <span> Login</span>
                  </Link>
                )}
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

    </header>
  );
};

export default LogoutNavbar;

