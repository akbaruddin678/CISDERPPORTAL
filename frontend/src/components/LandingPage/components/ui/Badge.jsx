// src/components/ui/Badge.jsx
import React from "react";

const Badge = ({ children, variant = "default", className = "" }) => {
  const baseStyles = "px-2 py-1 rounded-full text-xs font-semibold";
  const variants = {
    default: "bg-gray-200 text-gray-800",
    success: "bg-green-200 text-green-800",
    danger: "bg-red-200 text-red-800",
    info: "bg-blue-200 text-blue-800",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
