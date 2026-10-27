import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// FE-20b: the shared axios instance had NO 429 handling — every caller
// improvised (or stayed silent), and the Retry-After header was never
// read. Pin the interceptor contract:
//   - a 429 surfaces the server body's message via toast EXACTLY once
//   - concurrent 429s inside a 3s window dedupe to one toast
//   - the Retry-After header wins over the body and is exposed on the
//     error + via getRateLimitRetryAfterSeconds() for UI countdowns
//   - non-429 errors pass through with no toast from this path
//   - a 429 after the window toasts again (no permanent suppression)

vi.mock("../../src/lib/toast.js", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() },
  _registerDispatch: vi.fn(),
  ToastContainer: () => null,
  default: { error: vi.fn() },
}));

import { toast } from "../../src/lib/toast.js";
import {
  handleResponseError,
  parseRetryAfterSeconds,
  getRateLimitRetryAfterSeconds,
  __resetRateLimitState,
  RATE_LIMIT_EVENT,
} from "../../src/api/index.js";

let nowMs;
const T0 = new Date("2026-01-01T00:00:00Z").getTime();

function err429({ body = {}, headers = {} } = {}) {
  return {
    message: "Request failed with status code 429",
    response: { status: 429, data: { message: "Too many requests. Please try again later.", ...body }, headers },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  __resetRateLimitState();
  nowMs = T0;
  vi.spyOn(Date, "now").mockImplementation(() => nowMs);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("shared axios 429 handling (FE-20)", () => {
  it("a single 429 toasts exactly once, carrying the server body message", async () => {
    const err = err429({ body: { retryAfter: 90 } });
    await expect(handleResponseError(err)).rejects.toBe(err);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Too many requests. Please try again later.");
    expect(err.displayMessage).toBe("Too many requests. Please try again later.");
    expect(err.retryAfter).toBe(90);
  });

  it("three concurrent 429s dedupe into a single toast", async () => {
    await expect(handleResponseError(err429())).rejects.toBeTruthy();
    await expect(handleResponseError(err429())).rejects.toBeTruthy();
    await expect(handleResponseError(err429())).rejects.toBeTruthy();
    expect(toast.error).toHaveBeenCalledTimes(1);
  });

  it("the Retry-After header wins over the body retryAfter and is exposed for countdowns", async () => {
    const err = err429({ body: { retryAfter: 900 }, headers: { "retry-after": "45" } });
    await expect(handleResponseError(err)).rejects.toBe(err);
    expect(err.retryAfter).toBe(45);
    expect(getRateLimitRetryAfterSeconds()).toBe(45);
    nowMs += 10_000;
    expect(getRateLimitRetryAfterSeconds()).toBe(35);
  });

  it("parses a Retry-After HTTP-date header into seconds", () => {
    const date = new Date(T0 + 120_000).toUTCString();
    expect(parseRetryAfterSeconds({ "retry-after": date }, {}, T0)).toBe(120);
    expect(parseRetryAfterSeconds({ "retry-after": "30" }, {}, T0)).toBe(30);
    expect(parseRetryAfterSeconds({}, { retryAfter: 75 }, T0)).toBe(75);
    expect(parseRetryAfterSeconds({}, {}, T0)).toBeNull();
    expect(parseRetryAfterSeconds({ "retry-after": "garbage" }, {}, T0)).toBeNull();
  });

  it("dispatches a rate-limit event carrying retryAfter + message for UI countdowns", async () => {
    const seen = [];
    const listener = (e) => seen.push(e.detail);
    window.addEventListener(RATE_LIMIT_EVENT, listener);
    try {
      await expect(handleResponseError(err429({ body: { retryAfter: 33 } }))).rejects.toBeTruthy();
    } finally {
      window.removeEventListener(RATE_LIMIT_EVENT, listener);
    }
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ retryAfter: 33, message: "Too many requests. Please try again later." });
  });

  it("a non-429 error passes through untouched by this path (no toast, no retryAfter)", async () => {
    const err = { message: "Request failed with status code 500", response: { status: 500, data: { message: "Server boom" }, headers: {} } };
    await expect(handleResponseError(err)).rejects.toBe(err);
    expect(toast.error).not.toHaveBeenCalled();
    expect(err.retryAfter).toBeUndefined();
    expect(err.displayMessage).toBe("Server boom");
  });

  it("a network error (no response) passes through with no toast", async () => {
    const err = { message: "Network Error" };
    await expect(handleResponseError(err)).rejects.toBe(err);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("a 429 after the dedupe window toasts again — no permanent suppression (pen-test)", async () => {
    await expect(handleResponseError(err429())).rejects.toBeTruthy();
    expect(toast.error).toHaveBeenCalledTimes(1);
    nowMs += 3_001;
    await expect(handleResponseError(err429())).rejects.toBeTruthy();
    expect(toast.error).toHaveBeenCalledTimes(2);
  });

  it("a deduped 429 still updates the exposed retryAfter (pen-test: suppression must not hide a longer limit)", async () => {
    await expect(handleResponseError(err429({ body: { retryAfter: 10 } }))).rejects.toBeTruthy();
    const second = err429({ body: { retryAfter: 600 } });
    await expect(handleResponseError(second)).rejects.toBe(second);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(second.retryAfter).toBe(600);
    expect(getRateLimitRetryAfterSeconds()).toBe(600);
  });
});
