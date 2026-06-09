const Api = (() => {
  const DEFAULT_BASE_URL = "http://localhost:8080";
  const STORAGE_KEY = "skillclash_api_base";

  function getBaseUrl() {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_BASE_URL;
  }

  function setBaseUrl(url) {
    const normalized = String(url || DEFAULT_BASE_URL).trim().replace(/\/$/, "");
    localStorage.setItem(STORAGE_KEY, normalized);
    return normalized;
  }

  function buildUrl(path, query = {}) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${getBaseUrl()}${cleanPath}`);

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  }

  async function request(path, options = {}) {
    const token = localStorage.getItem("skillclash_token");
    const headers = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };

    let response;

    try {
      response = await fetch(buildUrl(path, options.query), {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });
    } catch (error) {
      const networkError = new Error("Unable to reach SkillClash API. Check that the backend is running, the API base URL is correct, and CORS allows this frontend origin.");
      networkError.isNetworkError = true;
      throw networkError;
    }

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : await response.text();

    if (isBackendErrorPayload(payload)) {
      throwApiError(payload.message || payload.error || "Request failed.", payload, response.status);
    }

    if (!response.ok) {
      const message = payload?.message || payload?.error || `Request failed with status ${response.status}`;
      throwApiError(message, payload, response.status);
    }

    return payload;
  }

  function isBackendErrorPayload(payload) {
    return Boolean(
      payload &&
      typeof payload === "object" &&
      payload.error &&
      payload.message &&
      Number(payload.status) >= 400
    );
  }

  function throwApiError(message, payload, httpStatus) {
    const error = new Error(message);
    error.payload = payload;
    error.httpStatus = httpStatus;
    error.isApiError = true;
    throw error;
  }

  return {
    getBaseUrl,
    setBaseUrl,
    get: (path, query) => request(path, { query }),
    post: (path, body) => request(path, { method: "POST", body }),
    put: (path, body) => request(path, { method: "PUT", body }),
    delete: (path) => request(path, { method: "DELETE" })
  };
})();
