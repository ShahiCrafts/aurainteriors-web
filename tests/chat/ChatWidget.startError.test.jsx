import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// FE-19: ChatWidget start-chat onError handled ONLY RATE_LIMIT_EXCEEDED
// (via alert(), with a NaN hazard when retryAfter was absent); every
// other failure was silent. Pin: any failure toasts; a rate-limit
// without retryAfter never renders "NaN".

const h = vi.hoisted(() => ({ startError: null, toasts: [] }));

vi.mock("../../src/hooks/chat/useChatTan.js", () => ({
  useMyChats: () => ({ data: undefined }),
  useChatDetails: () => ({ data: undefined }),
  useStartChat: () => ({
    isPending: false,
    mutate: (_vars, opts) => opts?.onError?.(h.startError),
  }),
  useSendMessage: () => ({ mutate: vi.fn() }),
}));
vi.mock("../../src/store/authStore.js", () => ({ default: () => ({ user: null }) }));
vi.mock("../../src/utils/guestSessionStorage.js", () => ({
  getGuestSessionId: () => null,
  setGuestSessionId: vi.fn(),
  clearGuestSession: vi.fn(),
}));
vi.mock("../../src/components/chat/ChatWindow.jsx", () => ({
  default: ({ onStartNew }) => (
    <button type="button" onClick={() => onStartNew()}>
      start-new
    </button>
  ),
}));

import ChatWidget from "../../src/components/chat/ChatWidget.jsx";
import { _registerDispatch } from "../../src/lib/toast.js";

function openAndStart() {
  const { container } = render(<ChatWidget />);
  const buttons = container.querySelectorAll("button");
  fireEvent.click(buttons[buttons.length - 1]); // FAB toggle
  fireEvent.click(screen.getByText("start-new"));
}

beforeEach(() => {
  vi.clearAllMocks();
  h.toasts = [];
  h.startError = null;
  _registerDispatch((t) => h.toasts.push(t));
  vi.spyOn(window, "alert").mockImplementation(() => {});
});

describe("ChatWidget start-chat failures (FE-19)", () => {
  it("a generic start failure produces a toast (not silence)", () => {
    h.startError = { response: { status: 500, data: { message: "Server unavailable" } }, displayMessage: "Server unavailable" };
    openAndStart();
    expect(h.toasts).toHaveLength(1);
    expect(h.toasts[0].message).toMatch(/server unavailable|could not start/i);
    expect(window.alert).not.toHaveBeenCalled();
  });

  it("a rate-limit failure WITH retryAfter reports the wait in minutes", () => {
    h.startError = { response: { status: 429, data: { code: "RATE_LIMIT_EXCEEDED", retryAfter: 120, message: "Too many" } } };
    openAndStart();
    expect(h.toasts).toHaveLength(1);
    expect(h.toasts[0].message).toContain("2 minutes");
    expect(h.toasts[0].message).not.toContain("NaN");
  });

  it("a rate-limit failure WITHOUT retryAfter never shows NaN (pen-test: missing field)", () => {
    h.startError = { response: { status: 429, data: { code: "RATE_LIMIT_EXCEEDED", message: "Too many" } } };
    openAndStart();
    expect(h.toasts).toHaveLength(1);
    expect(h.toasts[0].message).not.toContain("NaN");
    expect(h.toasts[0].message).toMatch(/too many|wait/i);
  });

  it("a status-only 429 (no body code) is still treated as rate-limited (pen-test: code omitted)", () => {
    h.startError = { response: { status: 429, data: { message: "Slow down" } } };
    openAndStart();
    expect(h.toasts[0].message).toMatch(/too many|wait|slow/i);
    expect(h.toasts[0].message).not.toContain("NaN");
  });
});
