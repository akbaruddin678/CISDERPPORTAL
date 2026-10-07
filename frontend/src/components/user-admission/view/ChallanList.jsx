import { useNavigate } from "react-router-dom";
import { useChallanController } from "../controller/useChallanController";

const ChallanList = () => {
  const { challans, isLoading, isError } = useChallanController();
  const navigate = useNavigate();
  const handleChallanClick = (challan) => {
    
    navigate(`/challan-detail/${challan?._id}`);
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-8 text-red-500">
        Error loading challans. Please try again later.
      </div>
    );

  if (challans.length === 0)
    return (
      <div className="text-center py-8 text-gray-500">No challans found.</div>
    );

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-6">My Challans</h2>

      <div className="space-y-4">
        {challans.map((challan) => (
          <div
            key={challan._id}
            onClick={() => handleChallanClick(challan)}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">{challan.challanNo}</h3>
                <p className="text-gray-600">{challan.name}</p>
              </div>
              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    challan.status === "paid"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {challan.status}
                </span>
                <p className="text-gray-500 text-sm mt-1">
                  {new Date(challan.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChallanList;
