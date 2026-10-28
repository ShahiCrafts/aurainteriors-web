import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// FE-38 — ChatInput rendered an emoji button (Smile icon) with no
// onClick and no emoji picker anywhere in the app. Disposition:
// REMOVE (the task brief is explicit: do not invent an emoji picker).
// The wired controls — attach (opens the file input) and send — must
// stay. The emoji button had no accessible name, so absence is pinned
// by the composer button inventory: pre-fix there are 3 buttons in
// the composer row (attach, emoji, send); post-fix exactly 2.

vi.mock("../../src/hooks/chat/useChatTan.js", () => ({
  useSendMessage: () => ({ mutateAsync: vi.fn(async () => {}) }),
}));
vi.mock("../../src/api/chatApi.js", () => ({ uploadChatAttachment: vi.fn() }));
vi.mock("../../src/store/authStore.js", () => {
  const state = { openAuthModal: vi.fn(), user: null };
  const store = (selector) =>
    typeof selector === "function" ? selector(state) : state;
  store.getState = () => state;
  return { default: store };
});

import ChatInput from "../../src/components/chat/ChatInput.jsx";

describe("ChatInput dead controls (FE-38)", () => {
  it("renders no dead emoji button — only the wired attach and send controls", () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    const composer = screen
      .getByPlaceholderText(/type your message/i)
      .closest("div").parentElement;
    const buttons = composer.querySelectorAll("button");
    expect(buttons).toHaveLength(2);
    // No button in the whole composer is nameless/dead.
    for (const btn of container.querySelectorAll("button")) {
      expect(
        btn.onclick !== null || btn.getAttribute("type") === "button",
      ).toBe(true);
    }
  });

  it("the attach control still exists (it opens the hidden file input)", () => {
    const { container } = render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
  });
});
