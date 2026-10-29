import { describe, expect, it } from "vitest";

// Unit tests for src/config/apiConfig.js — resolveApiConfig is the
// fail-fast gate between the environment and every API/socket call:
// production builds must refuse to run without a configured API
// base URL, and malformed URLs (credentials, query, non-HTTP
// schemes) must be rejected instead of silently used.

import { resolveApiConfig } from "../../src/config/apiConfig.js";

describe("resolveApiConfig", () => {
  it("should throw naming the missing variable when a production env has no API URL", () => {
    expect(() => resolveApiConfig({ PROD: true })).toThrow(
      "VITE_API_BASE_URL is required for production builds",
    );
  });

  it("should fall back to the local dev API when a non-production env has no API URL", () => {
    const config = resolveApiConfig({ PROD: false });

    expect(config.API_BASE_URL).toBe("http://localhost:3001");
    expect(config.API_V1_URL).toBe("http://localhost:3001/api/v1");
    expect(config.SOCKET_URL).toBe("http://localhost:3001");
  });

  it("should derive the v1 and socket URLs from the configured base", () => {
    const config = resolveApiConfig({
      PROD: true,
      VITE_API_BASE_URL: "https://api.example.com",
    });

    expect(config.API_BASE_URL).toBe("https://api.example.com");
    expect(config.API_V1_URL).toBe("https://api.example.com/api/v1");
    expect(config.SOCKET_URL).toBe("https://api.example.com");
  });

  it("should strip a trailing /api/v1 from the socket origin and trim trailing slashes", () => {
    const config = resolveApiConfig({
      PROD: true,
      VITE_API_BASE_URL: "https://api.example.com/api/v1/",
    });

    expect(config.API_BASE_URL).toBe("https://api.example.com/api/v1");
    expect(config.API_V1_URL).toBe("https://api.example.com/api/v1");
    expect(config.SOCKET_URL).toBe("https://api.example.com");
  });

  it("should accept the legacy VITE_API_URL variable as an alias", () => {
    const config = resolveApiConfig({
      PROD: true,
      VITE_API_URL: "https://legacy.example.com",
    });

    expect(config.API_BASE_URL).toBe("https://legacy.example.com");
  });

  it.each([
    ["a non-HTTP scheme", "ftp://api.example.com"],
    ["embedded credentials", "https://user:pass@api.example.com"],
    ["a query string", "https://api.example.com?tenant=1"],
    ["a fragment", "https://api.example.com#frag"],
    ["a non-URL value", "not a url"],
  ])("should reject %s", (_label, value) => {
    expect(() =>
      resolveApiConfig({ PROD: true, VITE_API_BASE_URL: value }),
    ).toThrow();
  });
});
