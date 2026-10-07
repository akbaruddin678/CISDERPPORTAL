import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const LinkCard = ({
  title,
  path,
  description,
  icon: Icon,
  color,
  bgColor,
  iconColor,
}) => {
  return (
    <Link to={path} className="group block h-full outline-none">
      <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200 p-7 h-full transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 hover:border-slate-300 flex flex-col justify-between">
        {/* Top Gradient Accent Line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        />

        {/* Card Content */}
        <div>
          {/* Icon Container */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${bgColor} ${iconColor} group-hover:scale-110 transition-transform duration-500 shadow-sm border border-white`}
          >
            {Icon ? (
              <Icon size={28} strokeWidth={2} />
            ) : (
              <div className="text-2xl font-black">{title.charAt(0)}</div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">
            {title}
          </h3>

          {/* Contextual Description */}
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            {description || "Manage and configure settings"}
          </p>
        </div>

        {/* Bottom Call to Action */}
        <div className="mt-8 flex items-center text-sm font-black text-slate-400 group-hover:text-indigo-600 transition-colors tracking-wide uppercase">
          <span>Access Module</span>
          <ArrowRight
            size={16}
            className="ml-2 transform group-hover:translate-x-1.5 transition-transform"
          />
        </div>
      </div>
    </Link>
  );
};

export default LinkCard;
