import React, { useState, useEffect } from "react";
import InputField from "../../../shared/shared/InputField/UI/InputField";
import DatePickerField from "../../../shared/DatePicker/view/DatePickerField";
import SelectField from "../../../shared/sharedSelect/container/SelectField";
import { useGetCompleteCatalogQuery } from "../api/catalogApi";

const PersonalInfoForm = ({ control, errors, watch, setValue, getValues }) => {
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [isSameAddress, setIsSameAddress] = useState(false);

  // --- API QUERIES ---
  // excludeLevel: "HSSC" scopes departments/programs/terms to university
  // level only — this form is the university admission form, so College
  // (HSSC/Intermediate) departments and programs must never appear here.
  const { data: catalogData } = useGetCompleteCatalogQuery({
    excludeLevel: "HSSC",
  });

  // --- SAFE DATA EXTRACTION ---
  const departments = Array.isArray(catalogData?.data?.departments)
    ? catalogData.data.departments
    : [];
  const programs = Array.isArray(catalogData?.data?.programs)
    ? catalogData.data.programs
    : [];
  const allTerms = Array.isArray(catalogData?.data?.terms)
    ? catalogData.data.terms
    : [];
  // Only the 2026 Spring and Fall sessions are open for this admission
  // cycle — Term has no dedicated year/season field, so this matches on
  // the established "<Season> <Year>" naming convention (e.g. "Fall 2026").
  const terms = allTerms.filter((t) => {
    const name = (t.name || "").toLowerCase();
    return (
      name.includes("2026") &&
      (name.includes("spring") || name.includes("fall"))
    );
  });

  // --- 1. CRITICAL FIX: HANDLE OBJECTS VS STRINGS ---
  // When data loads from backend, it might be an Object ({_id, name}).
  // When user selects from dropdown, it is a String ID.
  const rawDepartment = watch("applyingForDepartment");

  const currentDepartmentId =
    rawDepartment && typeof rawDepartment === "object"
      ? rawDepartment._id // Extract ID if it's an object
      : rawDepartment; // Use as-is if it's a string

  // --- 2. FILTER PROGRAMS EFFECT ---
  useEffect(() => {
    if (currentDepartmentId && programs.length > 0) {
      const filtered = programs.filter((program) => {
        const programDeptId = program.departmentId?._id || program.departmentId;
        return programDeptId === currentDepartmentId;
      });
      setFilteredPrograms(filtered);
    } else {
      setFilteredPrograms([]);
    }
    // Added JSON.stringify to prevents infinite loops on array dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDepartmentId, JSON.stringify(programs)]);

  // --- 3. HANDLE DEPARTMENT CHANGE ---
  const handleDepartmentChange = (value) => {
    // When manually changing, we reset the program
    setValue("applyingForDepartment", value);
    setValue("applyingForProgram", "");
  };

  // --- 4. ADDRESS SYNC LOGIC ---
  const permanentValues = watch([
    "permanentAddress",
    "permanentDistrict",
    "permanentProvince",
    "permanentCountry",
  ]);

  const handleSameAddressChange = (e) => {
    const checked = e.target.checked;
    setIsSameAddress(checked);

    if (checked) {
      const values = getValues();
      setValue("currentAddress", values.permanentAddress || "");
      setValue("currentDistrict", values.permanentDistrict || "");
      setValue("currentProvince", values.permanentProvince || "");
      setValue("currentCountry", values.permanentCountry || "");
    } else {
      setValue("currentAddress", "");
      setValue("currentDistrict", "");
      setValue("currentProvince", "");
      setValue("currentCountry", "");
    }
  };

  useEffect(() => {
    if (isSameAddress) {
      setValue("currentAddress", permanentValues[0] || "");
      setValue("currentDistrict", permanentValues[1] || "");
      setValue("currentProvince", permanentValues[2] || "");
      setValue("currentCountry", permanentValues[3] || "");
    }
  }, [isSameAddress, ...permanentValues, setValue]);

  // --- OPTIONS ---
  const departmentOptions = departments.map((dept) => ({
    label: dept.name,
    value: dept._id,
  }));

  const programOptions = filteredPrograms.map((prog) => ({
    label: prog.name,
    value: prog._id,
  }));

  const termOptions = terms.map((term) => ({
    label: term.name,
    value: term._id,
  }));

  return (
    <div className="space-y-6">
      {/* Applied For Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          Choose Your Program
        </h2>
        <div className="mb-4">
          <SelectField
            name="applyingForDepartment"
            control={control}
            label={
              <>
                Select Department <span className="text-red-500">*</span>
              </>
            }
            options={departmentOptions}
            errors={errors}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <SelectField
            name="applyingForProgram"
            control={control}
            label={
              <>
                Select Program <span className="text-red-500">*</span>
              </>
            }
            options={programOptions}
            errors={errors}
            disabled={!currentDepartmentId || programOptions.length === 0}
            required
          />
        </div>
        <div>
          <SelectField
            name="applyingSession"
            control={control}
            label={
              <>
                Select Session <span className="text-red-500">*</span>
              </>
            }
            options={termOptions}
            errors={errors}
            required
          />
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            name="fullName"
            control={control}
            label={
              <>
                Full Name <span className="text-red-500">*</span>
              </>
            }
            errors={errors}
            required
          />
          <InputField
            name="fatherName"
            control={control}
            label={
              <>
                Father Name <span className="text-red-500">*</span>
              </>
            }
            errors={errors}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <InputField
            name="phone"
            control={control}
            label={
              <>
                Phone <span className="text-red-500">*</span>
              </>
            }
            errors={errors}
            required
          />
          <InputField
            name="cnic"
            control={control}
            label={
              <>
                CNIC <span className="text-red-500">*</span>
              </>
            }
            errors={errors}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <DatePickerField
            name="dob"
            control={control}
            label={
              <>
                Date of Birth <span className="text-red-500">*</span>
              </>
            }
            errors={errors}
            required
          />
          <SelectField
            name="gender"
            control={control}
            label={
              <>
                Gender <span className="text-red-500">*</span>
              </>
            }
            options={[
              { label: "Male", value: "male" },
              { label: "Female", value: "female" },
              { label: "Other", value: "other" },
            ]}
            errors={errors}
            required
          />
        </div>
      </div>

      {/* Address Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          Address Information
        </h2>

        {/* 1. Permanent Address */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            Permanent Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              name="permanentAddress"
              control={control}
              label={
                <>
                  Permanent Address <span className="text-red-500">*</span>
                </>
              }
              errors={errors}
              required
            />
            <InputField
              name="permanentDistrict"
              control={control}
              label={
                <>
                  Permanent District <span className="text-red-500">*</span>
                </>
              }
              errors={errors}
              required
            />
            <InputField
              name="permanentProvince"
              control={control}
              label={
                <>
                  Permanent Province <span className="text-red-500">*</span>
                </>
              }
              errors={errors}
              required
            />
            <InputField
              name="permanentCountry"
              control={control}
              label={
                <>
                  Permanent Country <span className="text-red-500">*</span>
                </>
              }
              errors={errors}
              required
            />
          </div>
        </div>

        {/* Checkbox */}
        <div className="flex items-center mb-6 pl-1">
          <input
            type="checkbox"
            id="sameAddress"
            checked={isSameAddress}
            onChange={handleSameAddressChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
          />
          <label
            htmlFor="sameAddress"
            className="ml-2 block text-sm text-gray-900 cursor-pointer font-medium"
          >
            Current address is same as permanent address
          </label>
        </div>

        {/* 2. Current Address */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">
            Current Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              name="currentAddress"
              control={control}
              label={
                <>
                  Current Address <span className="text-red-500">*</span>
                </>
              }
              errors={errors}
              required
              disabled={isSameAddress}
            />
            <InputField
              name="currentDistrict"
              control={control}
              label={
                <>
                  Current District <span className="text-red-500">*</span>
                </>
              }
              errors={errors}
              required
              disabled={isSameAddress}
            />
            <InputField
              name="currentProvince"
              control={control}
              label={
                <>
                  Current Province <span className="text-red-500">*</span>
                </>
              }
              errors={errors}
              required
              disabled={isSameAddress}
            />
            <InputField
              name="currentCountry"
              control={control}
              label={
                <>
                  Current Country <span className="text-red-500">*</span>
                </>
              }
              errors={errors}
              required
              disabled={isSameAddress}
            />
          </div>
        </div>
      </div>

      {/* Family Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">
          Family Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            name="fatherCnic"
            control={control}
            label={
              <>
                Father CNIC <span className="text-red-500">*</span>
              </>
            }
            errors={errors}
            required
          />
          <InputField
            name="motherName"
            control={control}
            label={
              <>
                Mother Name <span className="text-red-500">*</span>
              </>
            }
            errors={errors}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <InputField
            name="motherCnic"
            control={control}
            label={
              <>
                Mother CNIC <span className="text-red-500">*</span>
              </>
            }
            errors={errors}
            required
          />
          <SelectField
            name="fatherStatus"
            control={control}
            label={
              <>
                Father Status <span className="text-red-500">*</span>
              </>
            }
            options={[
              { label: "Alive", value: "alive" },
              { label: "Deceased", value: "deceased" },
            ]}
            errors={errors}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <InputField
            name="guardianPhone"
            control={control}
            label={
              <>
                Guardian Phone <span className="text-red-500">*</span>
              </>
            }
            errors={errors}
            required
          />
          <SelectField
            name="fathersProfession"
            control={control}
            label={
              <>
                Profession <span className="text-red-500">*</span>
              </>
            }
            options={[
              { label: "Self Employed", value: "self_employed" },
              { label: "Serving Armed Forces", value: "serving_armed_forces" },
              {
                label: "Serving Civil Government",
                value: "serving_civil_government",
              },
              {
                label: "Retd Civil Government",
                value: "retd_civil_government",
              },
              { label: "Retd Armed Forces", value: "retd_armed_forces" },
              { label: "Other", value: "other" },
            ]}
            errors={errors}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <InputField
            name="guardianDesignation"
            control={control}
            label={
              <>
                Designation <span className="text-red-500">*</span>
              </>
            }
            errors={errors}
            required
          />
          <SelectField
            name="familyIncome"
            control={control}
            label={
              <>
                Family Income <span className="text-red-500">*</span>
              </>
            }
            options={[
              { label: "Less than 40,000", value: "less_than_40000" },
              { label: "40,000 - 100,000", value: "40000_to_100000" },
              { label: "Above 100,000", value: "above_100000" },
            ]}
            errors={errors}
            required
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
