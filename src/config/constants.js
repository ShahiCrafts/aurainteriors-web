import { resolveApiConfig } from "./apiConfig";
const config = resolveApiConfig(import.meta.env);
export const { API_BASE_URL, API_V1_URL, SOCKET_URL } = config;
