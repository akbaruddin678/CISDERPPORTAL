import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

// Fetch Defaulters List based on filters
export const getSemesterDefaulters = async (programId, semesterId) => {
  const token = getAuthToken();
  // Ensure filters are passed
  if (!programId || !semesterId) return [];

  const response = await fetch(
    `${baseUrl}/api/requests/defaulters?programId=${programId}&semesterId=${semesterId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Failed to fetch");
  return result.data;
};

// Toggle Exemption Status & Save Remark
export const toggleStudentExemption = async (payload) => {
  const token = getAuthToken();
  const response = await fetch(`${baseUrl}/api/requests/toggle-exemption`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Update failed");
  return result;
};
