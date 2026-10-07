import React from "react";
import StudentChallanManagementController from "../controller/StudentChallanManagementController";
import DashboardView from "../view/Challan/DashboardView";
import StudentDetailView from "../view/Challan/StudentDetailView";

const StudentChallanManagementContainer = () => {
  return (
    <StudentChallanManagementController>
      {(data) => (
        <div className="min-h-screen bg-slate-50/50 p-6 font-sans text-slate-900">
          <div className="max-w-[1600px] mx-auto">
            {data.selectedStudent ? (
              <StudentDetailView data={data} />
            ) : (
              <DashboardView data={data} />
            )}
          </div>
        </div>
      )}
    </StudentChallanManagementController>
  );
};

export default StudentChallanManagementContainer;
