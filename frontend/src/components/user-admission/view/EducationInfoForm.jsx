import React, { useEffect, useCallback } from "react";
import InputField from "../../../shared/shared/InputField/UI/InputField";
import DatePickerField from "../../../shared/DatePicker/view/DatePickerField";
import SelectField from "../../../shared/sharedSelect/container/SelectField";

const EducationInfoForm = ({
  control,
  errors,
  fields,
  addEducation,
  removeEducation,
  watch,
  setValue,
}) => {
  // helper: map nested error message for each field
  const nestedErrorsFor = (namePath, fieldError) =>
    fieldError ? { [namePath]: fieldError } : {};

  // Safe watch function
  const safeWatch = watch || (() => ({}));

  // Calculate percentage for a specific field
  const calculatePercentage = useCallback((obtainedMarks, totalMarks) => {
    const obtained = parseFloat(obtainedMarks);
    const total = parseFloat(totalMarks);
    
    if (!isNaN(obtained) && !isNaN(total) && total > 0) {
      const percentage = (obtained / total) * 100;
      return percentage.toFixed(2);
    }
    return "";
  }, []);

  // Handle marks input changes with debounce
  const handleMarksChange = useCallback((fieldName, value, index) => {
    const numericValue = value === "" ? "" : parseFloat(value);
    
    // Update the field value
    if (numericValue === "" || (!isNaN(numericValue) && numericValue >= 0)) {
      setValue(`educationDetails.${index}.${fieldName}`, numericValue);
      
      // Calculate percentage after a small delay to ensure values are updated
      setTimeout(() => {
        const currentValues = safeWatch();
        const obtained = currentValues?.educationDetails?.[index]?.obtainedMarks;
        const total = currentValues?.educationDetails?.[index]?.totalMarks;
        
        if (obtained !== undefined && obtained !== "" && 
            total !== undefined && total !== "" && total > 0) {
          const percentage = calculatePercentage(obtained, total);
          setValue(`educationDetails.${index}.percentage`, percentage);
        } else {
          setValue(`educationDetails.${index}.percentage`, "");
        }
      }, 100);
    }
  }, [setValue, safeWatch, calculatePercentage]);

  // Watch for marks changes and auto-calculate percentage
  useEffect(() => {
    if (!watch || !setValue) return;

    const subscription = watch((value, { name }) => {
      // Check if the changed field is obtainedMarks or totalMarks
      if (name && (name.includes('obtainedMarks') || name.includes('totalMarks'))) {
        const match = name.match(/educationDetails\.(\d+)\.(obtainedMarks|totalMarks)/);
        if (match) {
          const index = parseInt(match[1]);
          const base = `educationDetails.${index}`;
          
          const obtainedMarks = value.educationDetails?.[index]?.obtainedMarks;
          const totalMarks = value.educationDetails?.[index]?.totalMarks;
          
          // Only calculate if both fields have valid values
          if (obtainedMarks !== undefined && obtainedMarks !== "" && 
              totalMarks !== undefined && totalMarks !== "" && totalMarks > 0) {
            const percentage = calculatePercentage(obtainedMarks, totalMarks);
            setValue(`${base}.percentage`, percentage);
          } else if (obtainedMarks === "" || totalMarks === "" || totalMarks === 0) {
            setValue(`${base}.percentage`, "");
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue, calculatePercentage]);

  // Get current field values safely
  const getFieldValue = (index, fieldName) => {
    const values = safeWatch();
    return values?.educationDetails?.[index]?.[fieldName] || "";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Education Details</h2>
            <p className="text-gray-600 mt-1">Please add your educational details from lowest to highest.</p>
          </div>
          {fields.length < 5 && (
            <button
              type="button"
              onClick={addEducation}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Education</span>
            </button>
          )}
        </div>

        <div className="space-y-6">
          {fields.map((field, index) => {
            const base = `educationDetails.${index}`;
            const isFirst = index === 0;
            const currentPercentage = getFieldValue(index, 'percentage');
            const obtainedMarks = getFieldValue(index, 'obtainedMarks');
            const totalMarks = getFieldValue(index, 'totalMarks');

            return (
              <div
                key={field.id}
                className="relative p-6 border-2 border-gray-100 rounded-xl bg-gradient-to-br from-white to-blue-50/30 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Header with title and remove button */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {isFirst ? "Education 1" : `Education ${index+1}`}
                    </h3>
                  </div>
                  
                  {/* Remove button (don't allow removing the first one) */}
                  {!isFirst && (
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200 border border-red-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="text-sm font-medium">Remove</span>
                    </button>
                  )}
                </div>

                {/* Education Form Grid */}
                <div className="space-y-6">
                  {/* First Row: Program, Board, Institution */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <SelectField
                      name={`${base}.educationProgram`}
                      control={control}
                      label="Education Level *"
                      options={[
                        { label: "SSC (Matric)", value: "SSC" },
                        { label: "HSSC (Intermediate)", value: "HSSC" },
                        { label: "Bachelor's", value: "BACHELORS" },
                        { label: "Master's", value: "MASTERS" },
                        { label: "Other", value: "OTHER" },
                      ]}
                      errors={nestedErrorsFor(
                        `${base}.educationProgram`,
                        errors?.educationDetails?.[index]?.educationProgram
                      )}
                    />
                    
                    <InputField
                      name={`${base}.board`}
                      control={control}
                      label="Board / University *"
                      type="text"
                      placeholder="e.g., Federal Board, University of Punjab"
                      errors={nestedErrorsFor(
                        `${base}.board`,
                        errors?.educationDetails?.[index]?.board
                      )}
                    />
                    
                    <InputField
                      name={`${base}.institution`}
                      control={control}
                      label="Institution Name *"
                      type="text"
                      placeholder="e.g., Government College"
                      errors={nestedErrorsFor(
                        `${base}.institution`,
                        errors?.educationDetails?.[index]?.institution
                      )}
                    />
                  </div>

                  {/* Second Row: Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DatePickerField
                      name={`${base}.startDate`}
                      control={control}
                      label="Start Date *"
                      errors={nestedErrorsFor(
                        `${base}.startDate`,
                        errors?.educationDetails?.[index]?.startDate
                      )}
                    />
                    <DatePickerField
                      name={`${base}.endDateOrResultAwaited`}
                      control={control}
                      label="End Date / Expected *"
                      errors={nestedErrorsFor(
                        `${base}.endDateOrResultAwaited`,
                        errors?.educationDetails?.[index]?.endDateOrResultAwaited
                      )}
                    />
                  </div>

                  {/* Third Row: Marks and Percentage */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                      name={`${base}.obtainedMarks`}
                      control={control}
                      label="Obtained Marks *"
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      onChange={(e) => handleMarksChange('obtainedMarks', e.target.value, index)}
                      errors={nestedErrorsFor(
                        `${base}.obtainedMarks`,
                        errors?.educationDetails?.[index]?.obtainedMarks
                      )}
                    />
                    <InputField
                      name={`${base}.totalMarks`}
                      control={control}
                      label="Total Marks *"
                      type="number"
                      placeholder="0"
                      min="0"
                      step="0.01"
                      onChange={(e) => handleMarksChange('totalMarks', e.target.value, index)}
                      errors={nestedErrorsFor(
                        `${base}.totalMarks`,
                        errors?.educationDetails?.[index]?.totalMarks
                      )}
                    />
                    <div className="relative">
                      <InputField
                        name={`${base}.percentage`}
                        control={control}
                        label="Percentage % *"
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        max="100"
                        readOnly
                        className="bg-gray-50 cursor-not-allowed"
                        errors={nestedErrorsFor(
                          `${base}.percentage`,
                          errors?.educationDetails?.[index]?.percentage
                        )}
                      />
                      {/* Auto-calculated badge */}
                      {currentPercentage && (
                        <div className="absolute top-0 right-0 -mt-2 -mr-2">
                        
                        </div>
                      )}
                    </div>
                  </div>

               
                </div>

                {/* Decorative bottom border */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-b-xl"></div>
              </div>
            );
          })}
        </div>

        {/* Help text */}
        {fields.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9 5m-9-5v10" />
            </svg>
            <p className="text-gray-600 font-medium">No education details added yet</p>
            <p className="text-gray-500 text-sm mt-1">Click the button above to add your first qualification</p>
          </div>
        )}

        {/* Maximum education limit notice */}
        {fields.length >= 5 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm text-center">
              Maximum of 5 education entries allowed
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationInfoForm;