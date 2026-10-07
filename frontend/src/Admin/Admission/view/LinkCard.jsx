import React from "react";
import { Link } from "react-router-dom";

const LinkCard = ({ title, path, color }) => {
  return (
    <Link
      to={path}
      className={`flex-1 min-w-[250px] h-32 
        rounded-xl shadow-md p-6 flex items-center
         justify-center transition-all hover:shadow-lg
          hover:scale-105 ${color}`}
    >
      <h3 className="text-xl font-semibold text-white text-center">{title}</h3>
    </Link>
  );
};

export default LinkCard;