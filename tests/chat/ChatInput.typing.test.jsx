import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// FE-31 (typing): handleTypingChange called onTyping(true) on EVERY
// keystroke — only the OFF signal was debounced — flooding the socket
// with chat:typing events. Pin: leading-edge episode throttle — a
// continuous burst emits true once; the debounced off still fires;
// a new episode after the off may emit again.

vi.mock("../../src/hooks/chat/useChatTan.js", () => ({
  useSendMessage: () => ({ mutateAsync: vi.fn(async () => {}) }),
}));
vi.mock("../../src/api/chatApi.js", () => ({ uploadChatAttachment: vi.fn() }));
vi.mock("../../src/store/authStore.js", () => {
  const state = { openAuthModal: vi.fn(), user: null };
  const store = (selector) => (typeof selector === "function" ? selector(state) : state);
  store.getState = () => state;
  return { default: store };
});

import ChatInput from "../../src/components/chat/ChatInput.jsx";

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe("ChatInput typing throttle (FE-31)", () => {
  it("50 rapid keystrokes emit typing=true once, not 50 times (pen-test: flood)", () => {
    const onTyping = vi.fn();
    render(<ChatInput chatId="c1" onTyping={onTyping} />);
    const textarea = screen.getByPlaceholderText(/type your message/i);
    for (let i = 0; i < 50; i += 1) {
      fireEvent.change(textarea, { target: { value: `x`.repeat(i + 1) } });
      act(() => { vi.advanceTimersByTime(50); }); // 50ms apart: continuous typing, off never fires
    }
    const trueCalls = onTyping.mock.calls.filter(([v]) => v === true);
    expect(trueCalls.length).toBe(1);
    expect(trueCalls.length).toBeLessThanOrEqual(5); // finding's 10s budget, scaled
  });

  it("the debounced typing=false still fires after typing stops", () => {
    const onTyping = vi.fn();
    render(<ChatInput chatId="c1" onTyping={onTyping} />);
    const textarea = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(textarea, { target: { value: "hi" } });
    act(() => { vi.advanceTimersByTime(1_000); });
    expect(onTyping).toHaveBeenCalledWith(false);
  });

  it("a new typing episode after the off signal emits true again", () => {
    const onTyping = vi.fn();
    render(<ChatInput chatId="c1" onTyping={onTyping} />);
    const textarea = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(textarea, { target: { value: "a" } });
    act(() => { vi.advanceTimersByTime(1_000); }); // off fires
    fireEvent.change(textarea, { target: { value: "ab" } });
    const trueCalls = onTyping.mock.calls.filter(([v]) => v === true);
    expect(trueCalls.length).toBe(2);
  });
});
