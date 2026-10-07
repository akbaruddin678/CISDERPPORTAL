import React from "react";
import LinkCard from "../../../shared/LinkCard/container/CardContainer.jsx";
import { DepartmentLink } from "../services/DepartmentLink.jsx";

const DepartmentHomeView = ({ stats, isLoading }) => {
  const links = DepartmentLink();

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-6 sm:px-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-300 pb-8">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              Class Portal
            </h1>
            <p className="text-lg text-slate-600 font-medium max-w-2xl">
              Manage your organizational unit, courses, students, and faculty.
            </p>
          </div>

          {/* Quick Stats Display */}
          {!isLoading && (
            <div className="flex flex-wrap gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 min-w-[120px]">
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Total Students
                </p>
                <p className="text-2xl font-bold text-cyan-600">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 min-w-[120px]">
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Faculty
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.totalFaculty}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 min-w-[120px]">
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Active Courses
                </p>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.activeCourses}
                </p>
              </div>
            </div>
          )}
        </header>

        {/* Systems Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {links.map((link, index) => (
            <div key={index} className="h-full">
              <LinkCard
                title={link.title}
                description={link.description}
                path={link.path}
                icon={link.icon}
                color={link.color}
                bg={link.bg}
                accent={link.accent}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepartmentHomeView;
