import React from "react";
import { baseUrl } from "../../base/baseurl";

const VoucherView = ({ voucher, isLoading, isError }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        Loading...
      </div>
    );
  }

  if (isError || !voucher) {
    return (
      <div className="text-red-500 text-center">Failed to load voucher.</div>
    );
  }

  const handleDownload = () => {
    const fileUrl = `${baseUrl}/uploads/vouchers/${
      voucher.fileName
    }`;
   
    window.open(fileUrl, "_blank");
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded shadow-md max-w-lg mx-auto">
      <div className="flex justify-between">
        <span className="font-semibold">Voucher #:</span>
        <span>{voucher.voucherNumber}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">Amount:</span>
        <span>{voucher.amount} PKR</span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">Status:</span>
        <span
          className={
            voucher.status === "paid" ? "text-green-600" : "text-red-500"
          }
        >
          {voucher.status}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">Issue Date:</span>
        <span>{new Date(voucher.issueDate).toLocaleDateString()}</span>
      </div>
      <div className="flex justify-between">
        <span className="font-semibold">Due Date:</span>
        <span>{new Date(voucher.dueDate).toLocaleDateString()}</span>
      </div>
      
    </div>
  );
};

export default VoucherView;
