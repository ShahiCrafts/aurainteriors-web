// FE-41 — job polling for queued send flows.
//
// Server contract (verified read-only in ~/workspace/aura-audit/work):
//   routes/job.routes.js mounted at app.js:213 under /api/v1/jobs (admin-only)
//     GET /api/v1/jobs/:id → 200 { success:true, data:{ job:{ id, type,
//       status, attempts, maxAttempts, lastError, progress, createdAt,
//       updatedAt, completedAt } } }
//     404 { success:false, message:'Job not found' }
//   models/job.model.js — status enum: 'pending' | 'processing' |
//     'completed' | 'dead' ('dead' = terminally failed, lastError explains).
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/api/index.js", () => ({
  default: { get: vi.fn() },
}));

import api from "../../src/api/index.js";
import { getJob, pollJob } from "../../src/api/jobApi.js";

const noSleep = () => Promise.resolve();
const fast = { intervalMs: 1, timeoutMs: 60_000, sleep: noSleep };

function jobBody(job) {
  return { success: true, data: { job } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getJob", () => {
  it("fetches /jobs/:id and unwraps data.job", async () => {
    const job = { id: "j1", type: "promotion", status: "pending", progress: {} };
    api.get.mockResolvedValue({ data: jobBody(job) });
    await expect(getJob("j1")).resolves.toEqual(job);
    expect(api.get).toHaveBeenCalledWith("/jobs/j1");
  });
});

describe("pollJob", () => {
  it("resolves with the job once it completes", async () => {
    api.get
      .mockResolvedValueOnce({ data: jobBody({ id: "j1", status: "processing", progress: {} }) })
      .mockResolvedValueOnce({
        data: jobBody({ id: "j1", status: "completed", progress: { stage: "done", sent: 3, failed: 0 } }),
      });
    const job = await pollJob("j1", fast);
    expect(job.status).toBe("completed");
    expect(job.progress.sent).toBe(3);
    expect(api.get).toHaveBeenCalledTimes(2);
  });

  it("rejects on 'dead' and surfaces lastError", async () => {
    api.get.mockResolvedValue({
      data: jobBody({ id: "j1", status: "dead", lastError: "SMTP connection refused", progress: {} }),
    });
    await expect(pollJob("j1", fast)).rejects.toThrow(/SMTP connection refused/);
  });

  it("rejects on 'dead' even without a lastError", async () => {
    api.get.mockResolvedValue({
      data: jobBody({ id: "j1", status: "dead", lastError: null, progress: {} }),
    });
    await expect(pollJob("j1", fast)).rejects.toThrow(/fail/i);
  });

  it("rejects honestly on 404 (job not found)", async () => {
    const err = new Error("Request failed with status code 404");
    err.response = { status: 404, data: { success: false, message: "Job not found" } };
    err.displayMessage = "Job not found";
    api.get.mockRejectedValue(err);
    await expect(pollJob("j1", fast)).rejects.toThrow(/not found/i);
  });

  it("times out instead of polling forever while a job stays 'processing'", async () => {
    api.get.mockResolvedValue({
      data: jobBody({ id: "j1", status: "processing", progress: {} }),
    });
    await expect(
      pollJob("j1", { intervalMs: 10, timeoutMs: 25, sleep: noSleep })
    ).rejects.toThrow(/timed out/i);
    // Bounded: it must have stopped polling.
    const callsAtReject = api.get.mock.calls.length;
    expect(callsAtReject).toBeGreaterThan(0);
    expect(callsAtReject).toBeLessThan(10);
  });

  it("rejects immediately when no job id is given (pen-test: queued body without jobId)", async () => {
    await expect(pollJob(undefined, fast)).rejects.toThrow(/job id/i);
    await expect(pollJob("", fast)).rejects.toThrow(/job id/i);
    expect(api.get).not.toHaveBeenCalled();
  });

  it("rejects when the response carries no job object", async () => {
    api.get.mockResolvedValue({ data: { success: true, data: {} } });
    await expect(pollJob("j1", fast)).rejects.toThrow(/no job/i);
  });
});
