import axios from 'axios';
import { getAuthToken } from '../lib/tokenSource.js';
import { API_V1_URL } from '../config/constants';
import { toast } from '../lib/toast.js';

const api = axios.create({
    baseURL: API_V1_URL,
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        // FE-59: read through the tokenSource leaf at REQUEST time
        // (the auth store registers its getter there; this module no
        // longer imports the store, so there is no cycle).
        const token = getAuthToken();
        if (token && token !== "cookie") {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ---------------------------------------------------------------------------
// FE-20: global HTTP 429 handling.
//
// Before this, the shared instance had no 429 path at all: every caller
// improvised (chat used a modal fed by the body field, start-chat used
// alert(), most callers stayed silent) and the Retry-After header was
// never read. Now the response interceptor:
//   - resolves the effective retryAfter — Retry-After HEADER first
//     (delta-seconds or HTTP-date), then the body's retryAfter field
//     (the server's rate-limit handlers send { code, retryAfter },
//     see the server rateLimit middleware / error middleware);
//   - stamps it on the error as error.retryAfter so callers (the chat
//     composer's RateLimitModal path) count down the server's value;
//   - records a deadline so any UI can read the live remaining
//     seconds via getRateLimitRetryAfterSeconds();
//   - broadcasts a `aura:rate-limit` window event with
//     { retryAfter, message, status } for surfaces that listen;
//   - surfaces the server's body message via toast EXACTLY ONCE per
//     dedupe window (3s): a burst of concurrent 429s (parallel queries
//     all failing together) produces one toast, not a stack. A 429
//     after the window toasts again — suppression is never permanent,
//     and even a deduped 429 still updates retryAfter/deadline/event.
// Non-429 errors pass through untouched apart from the pre-existing
// displayMessage attachment.
// ---------------------------------------------------------------------------

export const RATE_LIMIT_EVENT = 'aura:rate-limit';
export const RATE_LIMIT_DEDUPE_MS = 3000;
const FALLBACK_429_MESSAGE = 'Too many requests. Please slow down and try again in a moment.';

let lastRateLimitToastAt = 0;
let rateLimitDeadlineMs = null;

export const parseRetryAfterSeconds = (headers, data, now = Date.now()) => {
    const headerRaw = headers?.['retry-after'] ?? headers?.['Retry-After'];
    if (headerRaw != null && headerRaw !== '') {
        const asSeconds = Number(headerRaw);
        if (Number.isFinite(asSeconds) && asSeconds >= 0) return Math.ceil(asSeconds);
        const asDate = Date.parse(String(headerRaw));
        if (Number.isFinite(asDate)) return Math.max(0, Math.ceil((asDate - now) / 1000));
        // An unparseable header falls through to the body value rather
        // than masking a usable one.
    }
    const bodyValue = Number(data?.retryAfter);
    if (Number.isFinite(bodyValue) && bodyValue >= 0) return Math.ceil(bodyValue);
    return null;
};

export const getRateLimitRetryAfterSeconds = (now = Date.now()) => {
    if (rateLimitDeadlineMs == null) return null;
    return Math.max(0, Math.ceil((rateLimitDeadlineMs - now) / 1000));
};

export const __resetRateLimitState = () => {
    lastRateLimitToastAt = 0;
    rateLimitDeadlineMs = null;
};

export const handleResponseError = (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    // You can attach the message to the error object if needed
    error.displayMessage = message;

    if (error.response?.status === 429) {
        const now = Date.now();
        const retryAfter = parseRetryAfterSeconds(error.response.headers, error.response.data, now);
        error.retryAfter = retryAfter;
        if (retryAfter != null) {
            rateLimitDeadlineMs = now + retryAfter * 1000;
        }
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(new CustomEvent(RATE_LIMIT_EVENT, {
                detail: { retryAfter, message: error.response.data?.message || FALLBACK_429_MESSAGE, status: 429 },
            }));
        }
        if (now - lastRateLimitToastAt >= RATE_LIMIT_DEDUPE_MS) {
            lastRateLimitToastAt = now;
            toast.error(error.response.data?.message || FALLBACK_429_MESSAGE);
        }
    }
    return Promise.reject(error);
};

api.interceptors.response.use(
    (response) => {
        return response;
    },
    handleResponseError
);

export default api;
