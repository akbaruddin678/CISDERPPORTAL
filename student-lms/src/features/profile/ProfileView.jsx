import React from "react";
import { useSelector } from "react-redux";
import { User, Mail, Hash, BookOpen, GraduationCap } from "lucide-react";

const ProfileView = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Student Profile
        </h1>
        <p className="text-slate-500 mt-1 font-medium">
          Your personal and academic information.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-12 text-center sm:text-left sm:flex items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg mx-auto sm:mx-0 flex items-center justify-center text-blue-600 overflow-hidden">
            {user?.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={64} />
            )}
          </div>
          <div className="text-white mt-6 sm:mt-0">
            <h2 className="text-3xl font-black">
              {user?.name || "Student Name"}
            </h2>
            <p className="text-blue-100 font-medium text-lg mt-1 flex items-center justify-center sm:justify-start gap-2">
              <GraduationCap size={20} />{" "}
              {user?.program || "Unassigned Program"}
            </p>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">
            Account Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Hash size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                  Registration / Roll No
                </p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {user?.rollNumber || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                  Email Address
                </p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {user?.email || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                  Academic Program
                </p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {user?.program || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <User size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                  Account Status
                </p>
                <p className="text-lg font-bold text-green-600 mt-1">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
