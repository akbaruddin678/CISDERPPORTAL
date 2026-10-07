import React from "react";
import { Controller } from "react-hook-form";

const FileInput = ({ name, control, label, errors, accept }) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <Controller
      name={name}
      control={control}
      defaultValue={null}
      render={({ field: { onChange } }) => (
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files)}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      )}
    />
    {errors?.[name]?.message && (
      <p className="text-red-600 text-[10px] text-center font-[800] mt-1">
        {errors[name]?.message}
      </p>
    )}
  </div>
);

export default FileInput;
