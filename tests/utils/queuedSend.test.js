// FE-41 — queued send flows must report the truth.
//
// Server shapes (verified read-only in ~/workspace/aura-audit/work):
//   Promotion send (controllers/promotion.controller.js:87-101):
//     inline 200 { status:'success', message, data:{ metrics } }
//     queue  202 { status:'success', message, data:{ jobId, queued:true } }
//   Announcement publish (controllers/announcement.controller.js:121-128):
//     inline 200 { status:'success', data:{ announcement } }
//     queue  202 { status:'success',
//                  message:'Announcement published; notifications queued',
//                  data:{ announcement, jobId, queued:true } }
//     — the announcement IS published; only notifications are queued.
//   Newsletter send (controllers/newsletter.controller.js:130-156):
//     inline 200 { success:true, message:'Trend emails sent successfully',
//                  data: result } — result carries successful/failed counts
//     queue  202 { success:true, message:'Trend emails queued',
//                  data:{ jobId, queued:true } }
//   Job progress (services/broadcastJobs.service.js):
//     promotion → { stage:'done', sent, failed } (counts may be null) or
//                 { stage:'done', alreadySent:true }
//     announcement → { stage:'done' } — NO counts are recorded
//     newsletter → { sent, failed, total }
//
// reportSendOutcome(body, { kind, toast, pollJob }) is the single place all
// three flows report through, so every scenario is exercised per kind.
import { describe, it, expect, vi } from "vitest";
import { reportSendOutcome, isQueuedResponse } from "../../src/utils/queuedSend.js";

function makeToast() {
  return { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
}

function allToastText(toast) {
  return [...toast.success.mock.calls, ...toast.error.mock.calls, ...toast.info.mock.calls]
    .flat()
    .join("\n");
}

function expectNoBogusNumbers(toast) {
  const text = allToastText(toast);
  expect(text).not.toMatch(/undefined/);
  expect(text).not.toMatch(/NaN/);
}

const completedJob = (progress) => ({ id: "job-1", status: "completed", progress });

describe("isQueuedResponse", () => {
  it("detects the queued flag in data", () => {
    expect(isQueuedResponse({ data: { jobId: "j", queued: true } })).toBe(true);
    expect(isQueuedResponse({ data: { metrics: {} } })).toBe(false);
    expect(isQueuedResponse({ data: { announcement: {} } })).toBe(false);
    expect(isQueuedResponse(null)).toBe(false);
    expect(isQueuedResponse(undefined)).toBe(false);
  });
});

describe("newsletter flow", () => {
  const kind = "newsletter";

  it("(a) inline 200 with counts keeps today's success message with the real count", async () => {
    const toast = makeToast();
    const pollJob = vi.fn();
    await reportSendOutcome(
      { success: true, message: "Trend emails sent successfully", data: { successful: 42, failed: 1 } },
      { kind, toast, pollJob }
    );
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success.mock.calls[0][0]).toContain("42");
    expect(toast.success.mock.calls[0][0]).toMatch(/subscribers/);
    expect(toast.error).not.toHaveBeenCalled();
    expect(pollJob).not.toHaveBeenCalled();
    expectNoBogusNumbers(toast);
  });

  it("(b) inline 200 with a missing count field never prints 'undefined'", async () => {
    const toast = makeToast();
    await reportSendOutcome(
      { success: true, message: "Trend emails sent successfully", data: {} },
      { kind, toast, pollJob: vi.fn() }
    );
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success.mock.calls[0][0]).toBe("Trend emails sent successfully");
    expectNoBogusNumbers(toast);
  });

  it("(c) 202 queued → polls to completion and reports the REAL sent/failed counts", async () => {
    const toast = makeToast();
    const pollJob = vi
      .fn()
      .mockResolvedValue(completedJob({ sent: 37, failed: 2, total: 39 }));
    const outcome = await reportSendOutcome(
      { success: true, message: "Trend emails queued", data: { jobId: "job-1", queued: true } },
      { kind, toast, pollJob }
    );
    expect(pollJob).toHaveBeenCalledWith("job-1", expect.anything());
    expect(toast.info).toHaveBeenCalledTimes(1);
    expect(toast.info.mock.calls[0][0]).toMatch(/queued/i);
    expect(toast.success).toHaveBeenCalledTimes(1);
    const msg = toast.success.mock.calls[0][0];
    expect(msg).toContain("37");
    expect(msg).toContain("2");
    expect(outcome.queued).toBe(true);
    expectNoBogusNumbers(toast);
  });

  it("(d) 202 → job 'dead' with lastError → error surfaced, NO success toast", async () => {
    const toast = makeToast();
    const dead = new Error("Background job failed: SMTP connection refused");
    dead.job = { id: "job-1", status: "dead", lastError: "SMTP connection refused" };
    const pollJob = vi.fn().mockRejectedValue(dead);
    await reportSendOutcome(
      { success: true, message: "Trend emails queued", data: { jobId: "job-1", queued: true } },
      { kind, toast, pollJob }
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error.mock.calls[0][0]).toContain("SMTP connection refused");
    expectNoBogusNumbers(toast);
  });

  it("(f) 202 → poll 404 → honest error, no success claim", async () => {
    const toast = makeToast();
    const pollJob = vi.fn().mockRejectedValue(new Error("Job not found"));
    await reportSendOutcome(
      { success: true, message: "Trend emails queued", data: { jobId: "job-1", queued: true } },
      { kind, toast, pollJob }
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error.mock.calls[0][0]).toMatch(/could not confirm/i);
    expectNoBogusNumbers(toast);
  });

  it("pen-test: queued:true but missing jobId → honest non-success, no poll, no hang", async () => {
    const toast = makeToast();
    const pollJob = vi.fn();
    const outcome = await reportSendOutcome(
      { success: true, message: "Trend emails queued", data: { queued: true } },
      { kind, toast, pollJob }
    );
    expect(pollJob).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(outcome.tracked).toBe(false);
    expectNoBogusNumbers(toast);
  });

  it("pen-test: poll timeout → honest non-success state", async () => {
    const toast = makeToast();
    const pollJob = vi
      .fn()
      .mockRejectedValue(new Error("Timed out waiting for the background job to finish"));
    await reportSendOutcome(
      { success: true, message: "Trend emails queued", data: { jobId: "job-1", queued: true } },
      { kind, toast, pollJob }
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error.mock.calls[0][0]).toMatch(/timed out/i);
  });

  it("completed job with null counts falls back to a count-free success (no 'null'/'undefined')", async () => {
    const toast = makeToast();
    const pollJob = vi.fn().mockResolvedValue(completedJob({ sent: null, failed: null, total: null }));
    await reportSendOutcome(
      { success: true, message: "Trend emails queued", data: { jobId: "job-1", queued: true } },
      { kind, toast, pollJob }
    );
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success.mock.calls[0][0]).not.toMatch(/\d/);
    expectNoBogusNumbers(toast);
    expect(allToastText(toast)).not.toMatch(/null/);
  });
});

describe("promotion flow", () => {
  const kind = "promotion";

  it("(a) inline 200 keeps today's behaviour: the server message is shown", async () => {
    const toast = makeToast();
    await reportSendOutcome(
      { status: "success", message: "Promotion sent to 12 users", data: { metrics: { sentCount: 12 } } },
      { kind, toast, pollJob: vi.fn() }
    );
    expect(toast.success).toHaveBeenCalledWith("Promotion sent to 12 users");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("(a2) inline 200 without a message falls back to a count-free success", async () => {
    const toast = makeToast();
    await reportSendOutcome(
      { status: "success", data: { metrics: {} } },
      { kind, toast, pollJob: vi.fn() }
    );
    expect(toast.success).toHaveBeenCalledTimes(1);
    expectNoBogusNumbers(toast);
  });

  it("(c) 202 queued → completed with counts → real sent/failed reported", async () => {
    const toast = makeToast();
    const pollJob = vi
      .fn()
      .mockResolvedValue(completedJob({ stage: "done", sent: 120, failed: 3 }));
    await reportSendOutcome(
      { status: "success", message: "Promotion queued", data: { jobId: "job-9", queued: true } },
      { kind, toast, pollJob }
    );
    expect(toast.info.mock.calls[0][0]).toMatch(/queued/i);
    expect(toast.success).toHaveBeenCalledTimes(1);
    const msg = toast.success.mock.calls[0][0];
    expect(msg).toContain("120");
    expect(msg).toContain("3");
    expectNoBogusNumbers(toast);
  });

  it("(c2) 202 → completed with alreadySent → 'already sent' wording, no invented counts", async () => {
    const toast = makeToast();
    const pollJob = vi
      .fn()
      .mockResolvedValue(completedJob({ stage: "done", alreadySent: true }));
    await reportSendOutcome(
      { status: "success", message: "Promotion queued", data: { jobId: "job-9", queued: true } },
      { kind, toast, pollJob }
    );
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success.mock.calls[0][0]).toMatch(/already sent/i);
    expectNoBogusNumbers(toast);
  });

  it("(c3) 202 → completed with null counts → count-free success", async () => {
    const toast = makeToast();
    const pollJob = vi
      .fn()
      .mockResolvedValue(completedJob({ stage: "done", sent: null, failed: null }));
    await reportSendOutcome(
      { status: "success", message: "Promotion queued", data: { jobId: "job-9", queued: true } },
      { kind, toast, pollJob }
    );
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success.mock.calls[0][0]).not.toMatch(/\d/);
    expectNoBogusNumbers(toast);
  });

  it("(d) 202 → job dead → error with lastError, no success toast", async () => {
    const toast = makeToast();
    const dead = new Error("Background job failed: template render exploded");
    const pollJob = vi.fn().mockRejectedValue(dead);
    await reportSendOutcome(
      { status: "success", message: "Promotion queued", data: { jobId: "job-9", queued: true } },
      { kind, toast, pollJob }
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error.mock.calls[0][0]).toContain("template render exploded");
  });
});

describe("announcement flow", () => {
  const kind = "announcement";

  it("(a) inline 200 keeps today's success message", async () => {
    const toast = makeToast();
    await reportSendOutcome(
      { status: "success", data: { announcement: { _id: "a1" } } },
      { kind, toast, pollJob: vi.fn() }
    );
    expect(toast.success).toHaveBeenCalledWith("Announcement published successfully");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("(e) 202 → published + notifications queued copy, completion has NO number claim", async () => {
    const toast = makeToast();
    const pollJob = vi.fn().mockResolvedValue(completedJob({ stage: "done" }));
    await reportSendOutcome(
      {
        status: "success",
        message: "Announcement published; notifications queued",
        data: { announcement: { _id: "a1" }, jobId: "job-7", queued: true },
      },
      { kind, toast, pollJob }
    );
    expect(toast.info).toHaveBeenCalledTimes(1);
    const queuedMsg = toast.info.mock.calls[0][0];
    expect(queuedMsg).toMatch(/published/i);
    expect(queuedMsg).toMatch(/notifications queued/i);
    expect(toast.success).toHaveBeenCalledTimes(1);
    const doneMsg = toast.success.mock.calls[0][0];
    // The server records NO counts for announcement jobs — inventing one
    // would be fabrication.
    expect(doneMsg).not.toMatch(/\d/);
    expect(doneMsg).toMatch(/published/i);
    expectNoBogusNumbers(toast);
  });

  it("(d) 202 → job dead → error surfaced, no success toast", async () => {
    const toast = makeToast();
    const pollJob = vi
      .fn()
      .mockRejectedValue(new Error("Background job failed: push gateway down"));
    await reportSendOutcome(
      {
        status: "success",
        message: "Announcement published; notifications queued",
        data: { announcement: { _id: "a1" }, jobId: "job-7", queued: true },
      },
      { kind, toast, pollJob }
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error.mock.calls[0][0]).toContain("push gateway down");
  });
});
