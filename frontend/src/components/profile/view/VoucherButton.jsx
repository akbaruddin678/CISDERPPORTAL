import React from "react";
import { useNavigate } from "react-router-dom";

export const VoucherButton = ({ admissionId }) => {
  const navigate = useNavigate();

  const handleDownload = () => {
    navigate(`/voucher`);
  };

  return (
    <></>
    // <button
    //   onClick={handleDownload}
    //   className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center"
    // >
    //   <svg
    //     xmlns="http://www.w3.org/2000/svg"
    //     className="h-5 w-5 mr-2"
    //     viewBox="0 0 20 20"
    //     fill="currentColor"
    //   >
    //     <path
    //       fillRule="evenodd"
    //       d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
    //       clipRule="evenodd"
    //     />
    //   </svg>
    //   Download Voucher
    // </button>
  );
};
