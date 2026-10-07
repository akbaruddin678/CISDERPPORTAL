import React from "react";
import LinkCard from "../../../shared/LinkCard/container/CardContainer.jsx";
import { TransportLinks } from "../services/TransportLink.jsx";

const TransportHomeView = () => {
  const links = TransportLinks();

  return (
    // Changed bg-slate-50 -> bg-slate-100 for better contrast
    <div className="min-h-screen bg-slate-100 py-12 px-6 sm:px-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* 1. Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-300 pb-8">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              CISD
            </h1>
            <p className="text-lg text-slate-600 font-medium max-w-2xl">
              Transport Management System
            </p>
          </div>
        </header>

        {/* 2. Systems Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
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

export default TransportHomeView;
