// FE-41 — useSendTrendEmail wiring: the hook must route its result through
// the honest queued-send reporting (src/utils/queuedSend.js) instead of
// interpolating data.data.successful unconditionally (undefined on a 202).
//
// Server shapes: see tests/utils/queuedSend.test.js header. The api layer
// (src/api/newsletterApi.js) and the job poller (src/api/jobApi.js) are
// mocked; the toast module is mocked so assertions read the exact strings
// an admin would see.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../../src/api/newsletterApi.js", () => ({
  subscribeNewsletter: vi.fn(),
  unsubscribeNewsletter: vi.fn(),
  getNewsletterSubscribers: vi.fn(),
  sendTrendEmail: vi.fn(),
  getNewsletterStats: vi.fn(),
}));

vi.mock("../../src/api/jobApi.js", () => ({
  getJob: vi.fn(),
  pollJob: vi.fn(),
}));

vi.mock("../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

import { sendTrendEmail } from "../../src/api/newsletterApi.js";
import { pollJob } from "../../src/api/jobApi.js";
import { toast } from "../../src/lib/toast.js";
import { useSendTrendEmail } from "../../src/hooks/newsletter/useNewsletterTan.js";

function wrapper({ children }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSendTrendEmail (FE-41)", () => {
  it("inline 200 with counts → success toast with the real count", async () => {
    sendTrendEmail.mockResolvedValue({
      success: true,
      message: "Trend emails sent successfully",
      data: { successful: 17, failed: 0 },
    });
    const { result } = renderHook(() => useSendTrendEmail(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ subject: "Hi", htmlContent: "<p>x</p>" });
    });
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success.mock.calls[0][0]).toContain("17");
    expect(toast.success.mock.calls[0][0]).not.toMatch(/undefined/);
    expect(pollJob).not.toHaveBeenCalled();
  });

  it("inline 200 with missing count → falls back to the server message, never 'undefined'", async () => {
    sendTrendEmail.mockResolvedValue({
      success: true,
      message: "Trend emails sent successfully",
      data: {},
    });
    const { result } = renderHook(() => useSendTrendEmail(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ subject: "Hi", htmlContent: "<p>x</p>" });
    });
    expect(toast.success).toHaveBeenCalledWith("Trend emails sent successfully");
  });

  it("202 queued → polls and reports the job's real counts", async () => {
    sendTrendEmail.mockResolvedValue({
      success: true,
      message: "Trend emails queued",
      data: { jobId: "job-42", queued: true },
    });
    pollJob.mockResolvedValue({
      id: "job-42",
      status: "completed",
      progress: { sent: 25, failed: 1, total: 26 },
    });
    const { result } = renderHook(() => useSendTrendEmail(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ subject: "Hi", htmlContent: "<p>x</p>" });
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(pollJob).toHaveBeenCalledWith("job-42", expect.anything());
    expect(toast.info.mock.calls[0][0]).toMatch(/queued/i);
    const msg = toast.success.mock.calls[0][0];
    expect(msg).toContain("25");
    expect(msg).not.toMatch(/undefined/);
  });

  it("202 queued → job dead → error toast, no success toast", async () => {
    sendTrendEmail.mockResolvedValue({
      success: true,
      message: "Trend emails queued",
      data: { jobId: "job-42", queued: true },
    });
    const dead = new Error("Background job failed: SMTP connection refused");
    dead.code = "JOB_DEAD";
    dead.job = { id: "job-42", status: "dead", lastError: "SMTP connection refused" };
    pollJob.mockRejectedValue(dead);
    const { result } = renderHook(() => useSendTrendEmail(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ subject: "Hi", htmlContent: "<p>x</p>" });
    });
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error.mock.calls[0][0]).toContain("SMTP connection refused");
  });
});
