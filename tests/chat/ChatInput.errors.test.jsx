import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// FE-19: ChatInput mapped send errors ONLY on the body code, never the
// HTTP status — a 429/401 with a missing/renamed code fell through to
// a generic toast and never opened the rate-limit / auth modal.
// Pin: status alone drives the modal; body code still works.

const h = vi.hoisted(() => ({ sendError: null }));

vi.mock("../../src/hooks/chat/useChatTan.js", () => ({
  useSendMessage: () => ({ mutateAsync: vi.fn(async () => { throw h.sendError; }) }),
}));
vi.mock("../../src/api/chatApi.js", () => ({ uploadChatAttachment: vi.fn() }));
vi.mock("../../src/store/authStore.js", () => {
  // AuthRequiredModal calls useAuthStore((state) => state.openAuthModal);
  // honour the selector so the modal renders.
  const state = { openAuthModal: vi.fn(), user: null };
  const store = (selector) => (typeof selector === "function" ? selector(state) : state);
  store.getState = () => state;
  return { default: store };
});

import ChatInput from "../../src/components/chat/ChatInput.jsx";

async function typeAndSend() {
  render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
  const textarea = screen.getByPlaceholderText(/type your message/i);
  fireEvent.change(textarea, { target: { value: "hello" } });
  const sendBtn = textarea.closest("div").parentElement.querySelectorAll("button");
  // Send is the last button in the composer row.
  fireEvent.click(sendBtn[sendBtn.length - 1]);
}

beforeEach(() => {
  vi.clearAllMocks();
  h.sendError = null;
});

describe("ChatInput send-error mapping (FE-19)", () => {
  it("status-only 429 (no body code) opens the rate-limit modal with the body retryAfter", async () => {
    h.sendError = { response: { status: 429, data: { message: "Too many requests", retryAfter: 60 } } };
    await typeAndSend();
    expect(await screen.findByText(/slow down/i)).toBeInTheDocument();
    // The exact countdown value (01:00, synced from retryAfter) is
    // pinned by the FE-20 RateLimitModal tests — the modal previously
    // kept its mount-time 900s here, which is the FE-20 defect.
  });

  it("body-code RATE_LIMIT_EXCEEDED still opens the rate-limit modal", async () => {
    h.sendError = { response: { status: 200, data: { code: "RATE_LIMIT_EXCEEDED", retryAfter: 120 } } };
    // status 200 is artificial; the code path is what is pinned here.
    await typeAndSend();
    expect(await screen.findByText(/slow down/i)).toBeInTheDocument();
  });

  it("a 429 with no retryAfter anywhere falls back to the 900s default, never NaN", async () => {
    h.sendError = { response: { status: 429, data: { message: "Too many" } } };
    await typeAndSend();
    expect(await screen.findByText(/slow down/i)).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(await screen.findByText("15:00")).toBeInTheDocument();
  });
});
