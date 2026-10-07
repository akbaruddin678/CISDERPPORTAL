import React from "react";

const EducationInfoSection = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">
        No education details available.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-xl text-indigo-700 border-b pb-2">
        Education History
      </h3>
      {data.map((edu, index) => {
        // Check if all education data is empty/null
        const isEmptyEducation =
          !edu.educationProgram &&
          !edu.startDate &&
          !edu.endDateOrResultAwaited &&
          !edu.obtainedMarks &&
          !edu.totalMarks &&
          !edu.percentage;
          !edu.institution,
          !edu.board

        // Don't render anything if all data is empty
        if (isEmptyEducation) return null;

        return (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-white to-indigo-50 shadow-sm transition-all hover:shadow-md"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Program" value={edu.educationProgram} />
              <Field
                label="Institutions"
                value={edu.institution ? `${edu.institution}` : "-"}
              />
              <Field
                label="Board"
                value={edu.board ? `${edu.board}` : "-"}
              />
              <Field
                label="Start Date"
                value={edu.startDate ? `${edu.startDate}` : "-"}
              />
           
              <Field
                label="End Date Marks"
                value={
                  edu.endDateOrResultAwaited
                    ? `${edu.endDateOrResultAwaited}`
                    : "-"
                }
              />

              <Field
                label="Obtained Marks"
                value={edu.obtainedMarks ? `${edu.obtainedMarks}` : "-"}
              />
              <Field
                label="Total Marks"
                value={edu.totalMarks ? `${edu.totalMarks}` : "-"}
              />
              <Field
                label="Percentage"
                value={
                  edu.percentage
                    ? `${edu.percentage}%`
                    : edu.obtainedMarks && edu.totalMarks
                    ? `${Math.round(
                        (edu.obtainedMarks / edu.totalMarks) * 100
                      )}%`
                    : "-"
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Field = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
      {label}
    </span>
    <span className="font-medium text-gray-800 truncate">{value ?? "-"}</span>
  </div>
);

export default EducationInfoSection;
