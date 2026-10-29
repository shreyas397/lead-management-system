// Same-origin requests: Vite proxies /api locally; Spring serves React in production.
export async function api(path, options = {}) {
  const headers = { ...options.headers };
  if (options.method && options.method !== "GET") {
    const response = await fetch("/api/auth/csrf", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error("Cannot establish a secure session. Please retry.");
    const csrf = await response.json();
    headers[csrf.headerName] = csrf.token;
  }
  if (options.body && !(options.body instanceof URLSearchParams))
    headers["Content-Type"] = "application/json";
  const response = await fetch("/api" + path, {
    ...options,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({
      message: "The server could not complete this request.",
    }));
    const error = new Error(data.message || "Request failed");
    error.fields = data.errors || {};
    error.status = response.status;
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("session-expired"));
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
