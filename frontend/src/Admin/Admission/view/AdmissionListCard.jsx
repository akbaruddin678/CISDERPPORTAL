// src/components/view/AdmissionListCard.jsx
import React, { memo, useCallback } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const AdmissionListCard = ({ style, admission }) => {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    if (admission?.id) {
      navigate(`/admission-details/${admission.id}`);
    }
  }, [admission, navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
      case "accepted":
        return "bg-green-100 text-green-700";
      case "submitted":
        return "bg-blue-100 text-blue-700";
      case "pending":
      case "under_review":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div
      style={style}
      onClick={handleClick}
      className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
    >
      {/* Student Information */}
      <div className="w-1/3 flex flex-col text-sm">
        <span className="font-semibold text-gray-900">
          {admission?.name || "N/A"}
        </span>
        <span className="text-gray-600">
          Father: {admission?.fatherName || "N/A"}
        </span>
        <span className="text-xs text-gray-400">
          {admission?.cnic} • {admission?.phone}
        </span>
      </div>

      {/* Academic Information */}
      <div className="w-1/3 flex flex-col text-sm text-center">
        <span className="text-gray-700">{admission?.program || "N/A"}</span>
        <span className="text-gray-600">{admission?.session || "N/A"}</span>
        <span className="text-xs text-gray-500">
          {admission?.department || "N/A"}
        </span>
      </div>

      {/* Status & Date */}
      <div className="w-1/3 text-right">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
            admission?.status
          )}`}
        >
          {admission?.status || "unknown"}
        </span>
        <div className="text-xs text-gray-500 mt-1">
          {format(new Date(admission?.appliedDate), "dd MMM yyyy")}
        </div>
      </div>
    </div>
  );
};

export default memo(AdmissionListCard);