import api from "./index";

// Background-job status for queued sends (FE-41).
//
// Server contract (~/workspace/aura-audit/work, read-only reference):
//   routes/job.routes.js mounted at app.js:213 under /api/v1/jobs
//   (admin-only): GET /api/v1/jobs/:id →
//     200 { success:true, data:{ job:{ id, type, status, attempts,
//           maxAttempts, lastError, progress, createdAt, updatedAt,
//           completedAt } } }
//     404 { success:false, message:'Job not found' }
//   models/job.model.js — status enum: 'pending' | 'processing' |
//   'completed' | 'dead' ('dead' is terminally failed; lastError explains).

export const getJob = async (id) => {
  const response = await api.get(`/jobs/${encodeURIComponent(id)}`);
  return response.data?.data?.job;
};

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Poll a background job until it completes.
 *
 * Resolves with the job object once its status is 'completed'.
 * Rejects with an honest error when:
 *   - no job id is given,
 *   - the job is 'dead' (error.code === 'JOB_DEAD', error.job attached,
 *     lastError included in the message when the server recorded one),
 *   - the status request fails (e.g. 404 'Job not found'),
 *   - the job is still running after `timeoutMs` (no infinite polling).
 *
 * Timing is injectable for tests: { intervalMs = 2000, timeoutMs = 300000,
 * sleep } — production defaults poll every ~2 s for up to ~5 minutes.
 */
export const pollJob = async (
  id,
  { intervalMs = 2000, timeoutMs = 5 * 60 * 1000, sleep = defaultSleep } = {}
) => {
  if (!id) {
    throw new Error("Cannot poll a background job without a job id");
  }

  const maxAttempts = Math.max(1, Math.ceil(timeoutMs / intervalMs));

  for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
    let job;
    try {
      job = await getJob(id);
    } catch (error) {
      // 404 and transport failures are terminal for polling purposes:
      // the send's outcome cannot be confirmed from here.
      const notFound =
        error?.response?.status === 404 || error?.response?.data?.success === false;
      const detail =
        error?.displayMessage || error?.response?.data?.message || error?.message;
      const wrapped = new Error(
        notFound
          ? `Job not found (job ${id} could not be tracked)`
          : `Could not check the background job status: ${detail || "request failed"}`
      );
      wrapped.code = notFound ? "JOB_NOT_FOUND" : "JOB_POLL_FAILED";
      wrapped.cause = error;
      throw wrapped;
    }

    if (!job || typeof job !== "object") {
      const wrapped = new Error(`Job status response carried no job data (job ${id})`);
      wrapped.code = "JOB_POLL_FAILED";
      throw wrapped;
    }

    if (job.status === "completed") {
      return job;
    }

    if (job.status === "dead") {
      const wrapped = new Error(
        job.lastError
          ? `Background job failed: ${job.lastError}`
          : "Background job failed without a recorded error"
      );
      wrapped.code = "JOB_DEAD";
      wrapped.job = job;
      throw wrapped;
    }

    // 'pending' / 'processing' (or an unexpected status): keep waiting
    // until the attempt budget is spent, then give up honestly.
    if (attempt < maxAttempts) {
      await sleep(intervalMs);
    }
  }

  const wrapped = new Error(
    "Timed out waiting for the background job to finish"
  );
  wrapped.code = "JOB_POLL_TIMEOUT";
  throw wrapped;
};

export default { getJob, pollJob };
