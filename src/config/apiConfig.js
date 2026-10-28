export function resolveApiConfig(env) {
  const configured = env.VITE_API_BASE_URL || env.VITE_API_URL;
  if (!configured && env.PROD)
    throw new Error("VITE_API_BASE_URL is required for production builds");
  const raw = configured || "http://localhost:3001";
  const url = new URL(raw);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "API URL must be an absolute HTTP(S) URL without credentials, query or fragment",
    );
  }
  const base = url.href.replace(/\/+$/, "");
  const socketUrl = base.replace(/\/api\/v1$/, "");
  return {
    API_BASE_URL: base,
    API_V1_URL: `${socketUrl}/api/v1`,
    SOCKET_URL: socketUrl,
  };
}
