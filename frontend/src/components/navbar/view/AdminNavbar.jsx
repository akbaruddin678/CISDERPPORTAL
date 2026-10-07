import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthButton from "../../../shared/Button/UI/AuthButton";
import Logo from "../../../assets/cisd-logo.png";
import { useAuth } from "../../auth/context/AuthContext";
import { baseUrl } from "../../base/baseurl";
import { getUserData } from "../../user/services/localStorageService";
import { getActiveCampusId, setActiveCampusId } from "../../../shared/campus/campusRequest";

const AdminNavbar = () => {
  const navigate = useNavigate();
  const { userData, dispatchAuthLogout } = useAuth();

  // Dropdown and Modal States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [schools, setSchools] = useState([]);
  const [activeCampusId, setActiveCampus] = useState(getActiveCampusId() || userData?.campusId || "all");
  const dropdownRef = useRef(null);
  const roles = userData?.roles || [];
  const showsCampus = roles.some((role) => ["admin", "accountant", "admission", "headofaccount"].includes(role));
  const canSwitchCampus = userData?.campusAccess === "all";
  const activeSchool = schools.find((school) => String(school.id) === String(activeCampusId)) || userData?.campus;
  const logoSrc = activeSchool?.logoUrl
    ? (activeSchool.logoUrl.startsWith("http") ? activeSchool.logoUrl : `${baseUrl}${activeSchool.logoUrl}`)
    : Logo;

  useEffect(() => {
    if (!showsCampus) return;
    const token = getUserData()?.token;
    fetch(`${baseUrl}/api/schools`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload) => setSchools(payload.data || []))
      .catch(() => setSchools([]));
  }, [showsCampus]);

  const handleCampusChange = (event) => {
    const value = event.target.value;
    setActiveCampus(value);
    setActiveCampusId(value);
    window.location.reload();
  };

  // Close dropdown if user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setShowLogoutConfirm(true); // Trigger the popup
  };

  const confirmLogout = () => {
    dispatchAuthLogout();
    setShowLogoutConfirm(false);
    navigate("/"); // Redirect to home/login
  };

  return (
    <>
      <nav className="cisd-admin-nav bg-white/95 backdrop-blur shadow-sm sticky top-0 z-50 border-b border-slate-100 border-t-4 border-t-[#7ab317]">
        {/* Main Navigation */}
        {/* changed max-w-7xl to w-full with wider padding */}
        <div className="w-full mx-auto px-4 sm:px-8 lg:px-12 py-2">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <Link
              to="/"
              className="flex items-center space-x-3 hover:opacity-90 transition-all duration-200 group"
            >
              <img
                src={logoSrc}
                alt={`${activeSchool?.name || "CISD"} logo`}
                className="h-12 w-auto max-w-[8rem] object-contain group-hover:scale-105 transition-transform"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-extrabold leading-tight text-[#0b2a6b]">
                  {activeSchool?.name || "CISD"}
                </h1>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  Admin Portal
                </p>
              </div>
            </Link>

            {/* Right Section - User Info and Auth */}
            <div className="flex items-center space-x-4">
              {showsCampus && (
                canSwitchCampus ? (
                  <label className="hidden md:flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-slate-700">
                    <span className="text-xs font-semibold">Campus</span>
                    <select value={activeCampusId} onChange={handleCampusChange} className="max-w-52 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-slate-800">
                      <option value="all">All campuses</option>
                      {schools.filter((school) => school.isActive).map((school) => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div className="hidden md:flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700">
                    <span>Campus:</span><span>{activeSchool?.name || "Not assigned"}</span>
                  </div>
                )
              )}
              {/* User Info with Dropdown Wrapper */}
              {userData && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="hidden lg:flex items-center space-x-3 text-slate-800 hover:bg-slate-100 rounded-full px-3 py-1.5 transition-all duration-200 text-left focus:outline-none"
                  >
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {userData.name || "Admin User"}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {userData.roles?.[0]?.replace("_", " ") ||
                          "Administrator"}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-[#0b2a6b] rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {userData.name?.charAt(0)?.toUpperCase() || "A"}
                      </span>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl py-2 border border-gray-100 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          ></path>
                        </svg>
                        My Profile
                      </Link>

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          ></path>
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button className="text-[#0b2a6b] p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* --- LOGOUT CONFIRMATION POP-UP --- */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  ></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Confirm Logout
              </h2>
              <p className="text-gray-500 text-sm">
                Are you sure you want to securely log out of the admin portal?
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-red-200"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNavbar;
