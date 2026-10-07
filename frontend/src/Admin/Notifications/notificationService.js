import { baseUrl } from "../../components/base/baseurl";
import { getAuthToken } from "../teacher/services/getAuthToken";

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}/api/notifications${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || payload.error || "Request failed.");
  return payload;
};

export const notificationService = {
  list: (page = 1) => request(`/?page=${page}&limit=10`),
  recipients: ({ role, search = "", page = 1 }) =>
    request(`/recipients?role=${encodeURIComponent(role)}&search=${encodeURIComponent(search)}&page=${page}&limit=12`),
  create: (payload) => request("/", { method: "POST", body: JSON.stringify(payload) }),
  setActive: (id, active) => request(`/${id}/active`, { method: "PATCH", body: JSON.stringify({ active }) }),
  mine: () => request("/mine"),
};
