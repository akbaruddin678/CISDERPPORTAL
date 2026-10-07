import axios from "axios";

export const CAMPUS_STORAGE_KEY = "cisd_active_campus";

export function getActiveCampusId() {
  return localStorage.getItem(CAMPUS_STORAGE_KEY) || "";
}

export function setActiveCampusId(campusId) {
  if (campusId) localStorage.setItem(CAMPUS_STORAGE_KEY, campusId);
  else localStorage.removeItem(CAMPUS_STORAGE_KEY);
}

// RTK Query uses window.fetch while several older screens use axios. Keeping
// the campus header here makes the selector apply consistently to both.
export function installCampusRequestScope() {
  axios.interceptors.request.use((config) => {
    const target = `${config.baseURL || ""}${config.url || ""}`;
    if (target.includes("/api/") || String(config.url || "").startsWith("/api")) {
      config.headers = config.headers || {};
      config.headers["x-campus-id"] = getActiveCampusId() || "all";
    }
    return config;
  });
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const target = typeof input === "string" ? input : input.url;
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    if ((target.includes("/api/") || target.startsWith("/api")) && !headers.has("x-campus-id")) {
      headers.set("x-campus-id", getActiveCampusId() || "all");
    }
    return nativeFetch(input, { ...init, headers });
  };
}
