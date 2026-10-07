import React from "react";
import { HeadofAcademiaLinks } from "../services/HeadofAcademiaLinks";
import LinkCard from "../../../shared/LinkCard/container/CardContainer";

const HeadOfAcademiaMainContainer = () => {
  const links = HeadofAcademiaLinks();

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-6 sm:px-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="border-b border-slate-300 pb-8">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              Head of Academia
            </h1>
            <p className="text-lg text-slate-600 font-medium max-w-2xl">
              Oversee university curriculum, ensure academic standards, and
              review new course proposals.
            </p>
          </div>
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

export default HeadOfAcademiaMainContainer;
