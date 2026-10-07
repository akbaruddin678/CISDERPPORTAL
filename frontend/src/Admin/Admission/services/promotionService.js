import { baseUrl } from "../../../components/base/baseurl";
import { getAuthToken } from "../../../Admin/Admission/services/getAuthToken";

export const bulkMoveStudents = async (payload) => {
  const token = getAuthToken();
  const response = await fetch(`${baseUrl}/api/promotion/bulk-move`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || "Failed");
    error.data = result.data; // Pass defaulters list
    throw error;
  }
  return result;
};

export const requestAccountOverride = async (payload) => {
  const token = getAuthToken();
  const response = await fetch(`${baseUrl}/api/requests/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
};
