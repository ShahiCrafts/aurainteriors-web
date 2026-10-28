import { describe, it, expect, vi, beforeEach } from "vitest";

// FE-40 — guest chat GET reads must send the session id as the
// x-guest-session-id header and must NOT put it in any GET URL.
//
// Server contract (verified read-only in ~/workspace/aura-audit/work,
// controllers/chat.controller.js:15-18, getGuestSessionId):
//   req.headers['x-guest-session-id'] FIRST, then cookie, then body;
//   the query value is honoured ONLY when GUEST_SESSION_ALLOW_QUERY=1
//   (off by default). The header is always accepted, not flag-gated.
//
// Mocking pattern follows tests/store/authStore.test.js /
// tests/pages/customer/trackOrder.contract.test.jsx: the axios
// instance in src/api/index.js is vi.mock'ed, and the guest-session
// storage accessor is vi.mock'ed so each scenario controls the id
// (including URL-hostile ids the real storage format would reject).

vi.mock("../../src/api/index.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("../../src/utils/guestSessionStorage.js", () => ({
  getGuestSessionId: vi.fn(),
}));

import api from "../../src/api/index.js";
import { getGuestSessionId } from "../../src/utils/guestSessionStorage.js";
import {
  getMyChats,
  getChatDetails,
  getChatMessages,
  uploadChatAttachment,
} from "../../src/api/chatApi.js";

const GUEST_ID = `guest_${"a".repeat(64)}`;

function lastGetCall() {
  expect(api.get).toHaveBeenCalledTimes(1);
  const [url, config] = api.get.mock.calls[0];
  return { url, config };
}

function expectNoGuestIdInUrl(url, config, id) {
  expect(typeof url).toBe("string");
  expect(url).not.toContain("guestSessionId");
  expect(url).not.toContain(id);
  expect(url).not.toContain(encodeURIComponent(id));
  if (config?.params) {
    const paramsStr =
      typeof config.params === "string"
        ? config.params
        : JSON.stringify(config.params);
    expect(paramsStr).not.toContain("guestSessionId");
    expect(paramsStr).not.toContain(id);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ data: { success: true, data: {} } });
  api.post.mockResolvedValue({
    data: { data: { attachment: { fileUrl: "https://example.com/x.txt" } } },
  });
  getGuestSessionId.mockReturnValue(GUEST_ID);
});

describe("FE-40: guest chat GETs send x-guest-session-id header, never query", () => {
  it("getMyChats sends the header and no guestSessionId in the URL/params", async () => {
    await getMyChats({ page: 1, limit: 20 });
    const { url, config } = lastGetCall();
    expect(config?.headers?.["x-guest-session-id"]).toBe(GUEST_ID);
    expectNoGuestIdInUrl(url, config, GUEST_ID);
    // Pagination params still ride in the URL.
    expect(url).toContain("page=1");
    expect(url).toContain("limit=20");
  });

  it("getChatDetails sends the header and no guestSessionId in the URL/params", async () => {
    await getChatDetails("chat-123");
    const { url, config } = lastGetCall();
    expect(url).toContain("/chats/chat-123");
    expect(config?.headers?.["x-guest-session-id"]).toBe(GUEST_ID);
    expectNoGuestIdInUrl(url, config, GUEST_ID);
  });

  it("getChatMessages sends the header and no guestSessionId in the URL/params", async () => {
    await getChatMessages({ chatId: "chat-123", page: 2, limit: 50 });
    const { url, config } = lastGetCall();
    expect(url).toContain("/chats/chat-123/messages");
    expect(config?.headers?.["x-guest-session-id"]).toBe(GUEST_ID);
    expectNoGuestIdInUrl(url, config, GUEST_ID);
    expect(url).toContain("page=2");
    expect(url).toContain("limit=50");
  });
});

describe("FE-40: no stored guest session -> no header", () => {
  beforeEach(() => {
    getGuestSessionId.mockReturnValue(null);
  });

  it("getMyChats sends no header", async () => {
    await getMyChats({});
    const { url, config } = lastGetCall();
    expect(config?.headers?.["x-guest-session-id"]).toBeUndefined();
    expect(url).not.toContain("guestSessionId");
  });

  it("getChatDetails sends no header", async () => {
    await getChatDetails("chat-123");
    const { config } = lastGetCall();
    expect(config?.headers?.["x-guest-session-id"]).toBeUndefined();
    if (config?.params)
      expect(JSON.stringify(config.params)).not.toContain("guestSessionId");
  });

  it("getChatMessages sends no header", async () => {
    await getChatMessages({ chatId: "chat-123" });
    const { url, config } = lastGetCall();
    expect(config?.headers?.["x-guest-session-id"]).toBeUndefined();
    expect(url).not.toContain("guestSessionId");
  });
});

describe("FE-40 pen-test: URL-hostile guest id never appears in a GET URL", () => {
  const HOSTILE_ID = "guest_a&guestSessionId=pwned#frag?x=1/y\\z w";

  beforeEach(() => {
    getGuestSessionId.mockReturnValue(HOSTILE_ID);
  });

  it("getMyChats: hostile id is only in the header", async () => {
    await getMyChats({});
    const { url, config } = lastGetCall();
    expect(config?.headers?.["x-guest-session-id"]).toBe(HOSTILE_ID);
    expectNoGuestIdInUrl(url, config, HOSTILE_ID);
  });

  it("getChatDetails: hostile id is only in the header", async () => {
    await getChatDetails("chat-123");
    const { url, config } = lastGetCall();
    expect(config?.headers?.["x-guest-session-id"]).toBe(HOSTILE_ID);
    expectNoGuestIdInUrl(url, config, HOSTILE_ID);
  });

  it("getChatMessages: hostile id is only in the header", async () => {
    await getChatMessages({ chatId: "chat-123" });
    const { url, config } = lastGetCall();
    expect(config?.headers?.["x-guest-session-id"]).toBe(HOSTILE_ID);
    expectNoGuestIdInUrl(url, config, HOSTILE_ID);
  });
});

describe("VULN-001: uploads use the header, never the query param", () => {
  // Replaces the former FE-40/SR-1 scope pin ("uploads still use the
  // query param"): the server upload authoriser now uses the shared
  // gated extractor (utils/guestSession.js), the query source is off
  // by default, and the header is always accepted — so the upload
  // follows the same transport rule as every other guest chat call.
  it("uploadChatAttachment sends guestSessionId as a header and not as a query param", async () => {
    // Non-image file: compressFileIfNeeded returns it as-is, so this
    // test exercises upload transport without the canvas pipeline.
    // FE-11: the upload path now content-sniffs first, so the fixture
    // is a genuine PDF (an allowed non-image type) instead of the
    // text/plain file the old advisory-only validation waved through.
    const file = new File(["%PDF-1.7\nhello"], "doc.pdf", {
      type: "application/pdf",
    });
    await uploadChatAttachment("chat-123", file);
    expect(api.post).toHaveBeenCalledTimes(1);
    const [url, , config] = api.post.mock.calls[0];
    expect(url).toBe("/chats/chat-123/attachments");
    expect(config?.headers?.["x-guest-session-id"]).toBe(GUEST_ID);
    expectNoGuestIdInUrl(url, config, GUEST_ID);
  });

  it("uploadChatAttachment with no guest session sends no header and no query param", async () => {
    getGuestSessionId.mockReturnValue(null);
    const file = new File(["%PDF-1.7\nhello"], "doc.pdf", {
      type: "application/pdf",
    });
    await uploadChatAttachment("chat-123", file);
    const [, , config] = api.post.mock.calls[0];
    expect(config?.headers?.["x-guest-session-id"]).toBeUndefined();
    expect(config?.params).toBeUndefined();
  });
});
