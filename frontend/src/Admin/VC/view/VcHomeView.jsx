import React from "react";
import { VcLinks } from "../services/VcLinks";
import LinkCard from "../../../shared/LinkCard/container/CardContainer";

const VcHomeView = ({ stats, isLoading }) => {
  const links = VcLinks();

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-6 sm:px-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-300 pb-8">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              Vice Chancellor Office
            </h1>
            <p className="text-lg text-slate-600 font-medium max-w-2xl">
              Executive oversight, final academic approvals, and university
              analytics.
            </p>
          </div>

          {!isLoading && (
            <div className="flex flex-wrap gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Active Students
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.totalActiveStudents.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Staff
                </p>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.totalStaff.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Fee Collection Rate
                </p>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.collectionRate}%
                </p>
              </div>
              {stats.activeCampaign && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-bold">
                    Active Admission Campaign
                  </p>
                  <p className="text-lg font-bold text-amber-600">
                    {stats.activeCampaign.title}
                  </p>
                </div>
              )}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
          {links.map((link, index) => (
            <div key={index} className="h-full">
              <LinkCard {...link} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VcHomeView;
