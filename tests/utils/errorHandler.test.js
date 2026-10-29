import { describe, expect, it } from "vitest";

// Unit tests for src/utils/errorHandler.js — the API-error →
// user-message mapping every mutation/query surfaces to the user.
// Behaviour pinned: server messages win when descriptive, technical
// server strings are sanitised, known statuses map to the
// professional copy, network failures get the connectivity copy,
// and anything else falls back to the caller's default.

import { formatError } from "../../src/utils/errorHandler.js";

const DEFAULT = "Something went wrong. Please try again.";
const axiosError = (status, data) => ({
  response: { status, data },
  request: {},
  message: `Request failed with status code ${status}`,
});

describe("formatError", () => {
  it("should return the default message when there is no error", () => {
    expect(formatError(null)).toBe(DEFAULT);
    expect(formatError(undefined, "Custom fallback")).toBe("Custom fallback");
  });

  it("should return the network message when a request was made but no response arrived", () => {
    expect(formatError({ request: {}, message: "Network Error" })).toBe(
      "Network error. Please check your internet connection.",
    );
  });

  it("should return the error's own message when neither request nor response exists", () => {
    expect(formatError(new Error("Boom"))).toBe("Boom");
    expect(formatError({})).toBe(DEFAULT);
  });

  it("should prefer a descriptive server message over the status mapping", () => {
    expect(
      formatError(axiosError(400, { message: "Coupon has expired" })),
    ).toBe("Coupon has expired");
  });

  it("should sanitise a technical server message instead of showing it raw", () => {
    expect(
      formatError(
        axiosError(422, {
          message: "Validation failed: price: Cast to Number failed",
        }),
      ),
    ).toBe(
      "Please check your information. Some fields have invalid or missing data.",
    );
  });

  it("should ignore a server message that is just a status code and use the status mapping", () => {
    expect(formatError(axiosError(404, { message: "404" }))).toBe(
      "We couldn't find what you were looking for. It might have been moved or deleted.",
    );
  });

  it.each([
    [401, "Your session has expired. Please log in again to continue."],
    [403, "You do not have permission to perform this action."],
    [429, "Too many requests. Please slow down and try again in a moment."],
    [500, "Our servers are having a little trouble. Please try again later."],
    [503, "The service is temporarily unavailable. Please try again later."],
  ])(
    "should map status %i to its professional message when no server message is given",
    (status, expected) => {
      expect(formatError(axiosError(status, {}))).toBe(expected);
    },
  );

  it("should return the default message for an unmapped status with no server message", () => {
    expect(formatError(axiosError(418, {}))).toBe(DEFAULT);
    expect(formatError(axiosError(418, {}), "Teapot fallback")).toBe(
      "Teapot fallback",
    );
  });
});
