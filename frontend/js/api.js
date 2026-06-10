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
        credentials: "include",
        body: options.body ? JSON.stringify(options.body) : undefined
      });
    } catch (error) {
      const networkError = new Error("Unable to reach the SkillClash game server. Please check the server address or try again in a moment.");
      networkError.isNetworkError = true;
      throw networkError;
    }

    const payload = parseResponseBody(await response.text());

    if (isBackendErrorPayload(payload)) {
      throwApiError(payload.message || payload.error || "Request failed.", payload, response.status);
    }

    if (!response.ok) {
      const message = payload?.message || payload?.error || (typeof payload === "string" && payload) || defaultErrorMessage(response.status);
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

  function parseResponseBody(body) {
    const trimmedBody = body.trim();
    if (!trimmedBody) return "";
    if (!["{", "["].includes(trimmedBody[0])) return body;

    try {
      return JSON.parse(trimmedBody);
    } catch (error) {
      return body;
    }
  }

  function throwApiError(message, payload, httpStatus) {
    const error = new Error(message);
    error.payload = payload;
    error.httpStatus = httpStatus;
    error.isApiError = true;
    throw error;
  }

  function defaultErrorMessage(status) {
    if (status === 403) return "You are not allowed to perform this action. Please login again and try once more.";
    return `Request failed with status ${status}`;
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
