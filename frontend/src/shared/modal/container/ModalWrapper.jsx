import React from "react";
import { Modal } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const ModalWrapper = ({
  modalState,
  onClose,
  children,
  maxWidth = "sm",
  title = "",
  openName = "",
  showCloseButton = true,
}) => {
  const isOpen = modalState?.isOpen && modalState?.name === openName;
  const maxWidthClasses = {
    xs: "max-w-[400px]",
    sm: "max-w-[600px]",
    md: "max-w-[800px]",
    lg: "max-w-[1000px]",
    xl: "max-w-[1200px]",
  };
  const handleClose = (event, reason) => {
    if (reason === "backdropClick") {
      return; // Prevent closing on backdrop click
    }
    onClose(); // Still allow closing via other methods (ESC key, etc.)
  };
  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      keepMounted={false}
    >
      <div
        className={`
        fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[calc(100%-32px)] ${maxWidthClasses[maxWidth]}
        bg-white shadow-2xl rounded-lg
        max-h-[90vh] flex flex-col
      `}
      >
        {/* Fixed Header */}
        <div
          className="
          sticky top-0 z-10
          bg-blue-900 border-b border-gray-200
          rounded-t-lg px-6 py-4
          flex items-center justify-between
        "
        >
          <h2
            id="modal-title"
            className="text-xl text-yellow-50 font-semibold text-center flex-grow"
          >
            {title}
          </h2>

          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="close"
              className="
                absolute right-4
                text-gray-500 hover:text-gray-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                rounded-full p-1
              "
            >
              <CloseIcon className="h-6 w-6" sx={{ color: "white" }} />
            </button>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div id="modal-description" className="overflow-y-auto flex-1 p-6">
          {children}
        </div>
      </div>
    </Modal>
  );
};

export default ModalWrapper;
