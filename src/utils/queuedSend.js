import { pollJob as defaultPollJob } from "../api/jobApi";

// FE-41 — queued send flows must report the truth.
//
// When the server runs with BROADCAST_MODE=queue / EMAIL_MODE=outbox, the
// promotion / announcement / newsletter sends answer HTTP 202 with
// { jobId, queued:true } in `data` instead of doing the work inline
// (server: controllers/promotion.controller.js:87-101,
// controllers/announcement.controller.js:121-128,
// controllers/newsletter.controller.js:130-137). The API layer returns the
// parsed body only, so `data.queued` is the queue signal available here.
//
// reportSendOutcome(body, { kind, toast, pollJob }) is the single place
// all three flows report through:
//   - inline (default) responses keep today's success behaviour, except
//     every interpolated count is guarded by finiteCount() — a count is
//     printed only when it is a finite number, so "undefined"/"NaN" can
//     never appear in a toast from these flows;
//   - queued responses toast that the send is queued / running in the
//     background, poll GET /api/v1/jobs/:id (src/api/jobApi.js), and then
//     report the job's REAL outcome from its progress
//     (services/broadcastJobs.service.js):
//       promotion    → { stage:'done', sent, failed } (may be null) or
//                      { stage:'done', alreadySent:true }
//       announcement → { stage:'done' } — the server records NO counts,
//                      so completion is reported without inventing any
//       newsletter   → { sent, failed, total }
//   - a 'dead' job or a failed/timed-out poll produces an ERROR toast that
//     never claims success; a queued body without a jobId is an honest
//     untracked error, never a success and never an infinite poll.

export const finiteCount = (value) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export const isQueuedResponse = (body) => body?.data?.queued === true;

const withFailedSuffix = (base, failed) =>
  failed !== null && failed > 0 ? `${base} (${failed} failed)` : base;

const INLINE_SUCCESS = {
  promotion: (body) => body?.message || "Promotion sent successfully",
  announcement: () => "Announcement published successfully",
  newsletter: (body) => {
    const successful = finiteCount(body?.data?.successful);
    if (successful !== null) {
      return `Email sent successfully to ${successful} subscribers`;
    }
    return body?.message || "Email sent successfully";
  },
};

const QUEUED_INFO = {
  promotion: "Promotion queued — sending in the background…",
  announcement:
    "Announcement published; notifications queued — sending in the background…",
  newsletter: "Trend emails queued — sending in the background…",
};

const COMPLETION_SUCCESS = {
  promotion: (job) => {
    const progress = job?.progress || {};
    if (progress.alreadySent) return "Promotion was already sent";
    const sent = finiteCount(progress.sent);
    if (sent !== null) {
      return withFailedSuffix(
        `Promotion sent to ${sent} recipients`,
        finiteCount(progress.failed)
      );
    }
    return "Promotion sent successfully";
  },
  announcement: () => "Announcement published; notifications sent",
  newsletter: (job) => {
    const progress = job?.progress || {};
    const sent = finiteCount(progress.sent);
    if (sent !== null) {
      return withFailedSuffix(
        `Email sent successfully to ${sent} subscribers`,
        finiteCount(progress.failed)
      );
    }
    return "Trend emails sent successfully";
  },
};

const KIND_NOUN = {
  promotion: "promotion",
  announcement: "announcement notifications",
  newsletter: "newsletter",
};

const DEAD_LABEL = {
  promotion: "Promotion send failed",
  announcement: "Announcement notification job failed",
  newsletter: "Trend email job failed",
};

/**
 * Report the outcome of a promotion/announcement/newsletter send.
 *
 * @param {object} body  Parsed response body from the API layer.
 * @param {object} deps  { kind: 'promotion'|'announcement'|'newsletter',
 *                         toast: { success, error, info },
 *                         pollJob?: (id, options?) => Promise<job>,
 *                         pollOptions?: object }
 * @returns {Promise<{queued:boolean, tracked?:boolean, job?:object, error?:Error}>}
 */
export async function reportSendOutcome(body, { kind, toast, pollJob, pollOptions = {} } = {}) {
  const poll = pollJob || defaultPollJob;

  if (!isQueuedResponse(body)) {
    const message = (INLINE_SUCCESS[kind] || INLINE_SUCCESS.promotion)(body);
    toast.success(message);
    return { queued: false };
  }

  const jobId = body?.data?.jobId;
  if (!jobId) {
    // Pen-test guard: a queued body without a jobId cannot be tracked.
    // Claiming success here would be a lie; polling nothing would hang.
    toast.error(
      `The ${KIND_NOUN[kind]} send was queued, but the server returned no job reference, so delivery could not be confirmed. It has not been verified as sent.`
    );
    return { queued: true, tracked: false };
  }

  toast.info(QUEUED_INFO[kind]);

  try {
    const job = await poll(jobId, pollOptions);
    toast.success(COMPLETION_SUCCESS[kind](job));
    return { queued: true, tracked: true, job };
  } catch (error) {
    const isDead = error?.code === "JOB_DEAD" || error?.job?.status === "dead";
    if (isDead) {
      const lastError = error?.job?.lastError;
      toast.error(
        lastError
          ? `${DEAD_LABEL[kind]}: ${lastError}`
          : `${DEAD_LABEL[kind]}: ${error?.message || "the background job failed"}`
      );
    } else {
      toast.error(
        `Could not confirm ${KIND_NOUN[kind]} delivery: ${error?.message || "job status unknown"}. The send was queued, but its final status is unknown.`
      );
    }
    return { queued: true, tracked: true, error };
  }
}

export default reportSendOutcome;
