import React from "react";
import { useNavigate } from "react-router-dom";

const BackButton = ({
  text = "Back",
  onClick,
  className = "",
  variant = "default", // options: default, filled, outline
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  const baseClasses =
    "flex items-center transition-colors duration-200 rounded-lg px-4 py-2";

  const variants = {
    default: "text-slate-300 hover:text-white",
    filled: "bg-blue-600 text-white hover:bg-blue-700",
    outline:
      "border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white",
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      aria-label={text}
    >
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
          clipRule="evenodd"
        />
      </svg>
      <span>{text}</span>
    </button>
  );
};

export default BackButton;
