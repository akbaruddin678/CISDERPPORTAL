import React, { useRef, useState } from "react";
import { Controller } from "react-hook-form";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";

const ImageUpload = ({ name, control, label, errors, accept = "image/*" }) => {
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null); // Ref to trigger file input click

  const handlePreview = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <label className="block text-sm text-left font-medium text-gray-700 mb-1">
        {label}
      </label>

      <div
        onClick={handleClick}
        className="w-24 h-24 border rounded-md overflow-hidden flex items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <AddAPhotoIcon style={{ fontSize: 32, color: "#6b7280" }} />
        )}
      </div>

      <Controller
        name={name}
        control={control}
        defaultValue={null}
        render={({ field: { onChange } }) => (
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              onChange(file);
              handlePreview(file);
            }}
          />
        )}
      />

      {errors?.[name]?.message && (
        <p className="text-red-600 text-[10px] font-[800] mt-1 text-center">
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
