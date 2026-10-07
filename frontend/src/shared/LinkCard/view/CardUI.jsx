import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CardUI = ({ title, description, path, icon, color, bg, accent }) => {
  // Logic to determine hover border color
  // If accent is missing, default to indigo-400
  const hoverBorderColor = accent
    ? accent.replace("bg-", "hover:border-")
    : "hover:border-indigo-400";

  // Logic to determine button background color on hover
  const hoverBtnColor = accent
    ? accent.replace("bg-", "group-hover:bg-")
    : "group-hover:bg-indigo-600";

  return (
    <Link
      to={path || "/"}
      className="group relative block h-full w-full outline-none"
    >
      <div
        className={`
          relative h-full flex flex-col justify-between 
          bg-white rounded-[2rem] p-7 
          border border-slate-300 shadow-md
          transition-all duration-300 ease-out 
          hover:-translate-y-2 hover:shadow-2xl ${hoverBorderColor}
          overflow-hidden
        `}
      >
        {/* Decorative Top Accent Line */}
        <div
          className={`absolute top-0 left-0 w-full h-1.5 ${
            accent || "bg-indigo-500"
          } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        />

        {/* Decorative Background Blob */}
        <div
          className={`absolute -right-6 -top-6 w-32 h-32 rounded-full ${bg} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500`}
        />

        <div>
          {/* Icon Section */}
          <div
            className={`inline-flex items-center justify-center p-3.5 rounded-2xl ${bg} ${color} mb-6 border border-slate-100 shadow-sm group-hover:scale-105 transition-transform duration-300`}
          >
            {icon}
          </div>

          {/* Text Content */}
          <div className="space-y-3 z-10 relative">
            <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-slate-800 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {description}
            </p>
          </div>
        </div>

        {/* Footer / Action */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-700 transition-colors">
            Open Module
          </span>

          {/* ARROW CONTAINER */}
          <div
            className={`
            w-8 h-8 rounded-full 
            bg-white border border-slate-300 
            flex items-center justify-center 
            group-hover:text-white group-hover:border-transparent
            transition-all duration-300 
            shadow-sm
            ${hoverBtnColor}
          `}
          >
            <ArrowRight
              size={16}
              className="text-slate-700 group-hover:text-white group-hover:-rotate-45 transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CardUI;
