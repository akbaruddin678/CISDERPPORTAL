// AssignInstallmentModal.jsx
export const AssignInstallmentModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold mb-4">Assign Plan</h2>
        <p className="text-slate-500 mb-6">
          Student selection logic goes here.
        </p>
        <button
          onClick={onClose}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};
export default AssignInstallmentModal;
