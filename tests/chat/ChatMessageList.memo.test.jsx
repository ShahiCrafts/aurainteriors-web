import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// FE-52: neither ChatMessageList nor ChatMessage was memoised, and
// typing state lives in ChatWindow — every typing start/stop
// re-rendered every row and re-ran the micromark parse for EVERY bot
// message in history. Pin with a parse/render count: re-rendering the
// list (e.g. a typing-status change) with the same message objects
// must NOT re-invoke the bot-markdown renderer for existing
// messages; changing one message re-renders only that one.

const h = vi.hoisted(() => ({ botRenders: 0 }));

vi.mock("../../src/components/chat/BotMarkdown.jsx", async () => {
  const React = await import("react");
  return {
    default: ({ content }) => {
      h.botRenders += 1;
      return React.createElement("div", { "data-testid": "bot-md" }, content);
    },
  };
});
vi.mock("../../src/store/authStore.js", () => ({
  default: () => ({ user: { _id: "u1", role: "customer" } }),
}));

import ChatMessageList from "../../src/components/chat/ChatMessageList.jsx";

const botMsg = (id, content) => ({
  _id: id,
  content,
  senderRole: "bot",
  sender: undefined,
  createdAt: "2026-01-01T10:30:00.000Z",
  attachments: [],
});

const messages = [
  botMsg("b1", "first bot answer"),
  botMsg("b2", "second bot answer"),
  botMsg("b3", "third bot answer"),
];

// Stable callbacks mirror the production wiring (ChatWindow passes a
// useCallback retry handler); a fresh closure per render would defeat
// row memoization by construction, in the app and in this test alike.
const stableLoadMore = () => {};
const stableRetry = () => {};
const listProps = (overrides = {}) => ({
  messages,
  isLoading: false,
  onLoadMore: stableLoadMore,
  hasMore: false,
  isFetchingMore: false,
  currentUserId: "u1",
  typingStatus: { isTyping: false, userRole: null },
  onRetryMessage: stableRetry,
  ...overrides,
});

beforeEach(() => {
  h.botRenders = 0;
});

// Bot content renders through React.lazy: the Suspense fallback shows
// the raw text first, so findByText alone can resolve BEFORE the
// markdown component has rendered (and its one resolution re-render
// would be miscounted as a rerender regression). Wait for the actual
// markdown elements and flush the lazy resolution before counting.
async function settledRenderCount() {
  await screen.findAllByTestId("bot-md");
  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });
  return h.botRenders;
}

describe("ChatMessageList memoization (FE-52)", () => {
  it("typing-status re-renders do not re-parse existing bot markdown", async () => {
    const { rerender } = render(<ChatMessageList {...listProps()} />);
    const afterMount = await settledRenderCount();
    expect(afterMount).toBe(3);

    // Typing starts and stops in the parent — the list re-renders
    // (typing bubble), but existing rows must skip entirely.
    rerender(
      <ChatMessageList
        {...listProps({ typingStatus: { isTyping: true, userRole: "admin" } })}
      />,
    );
    rerender(
      <ChatMessageList
        {...listProps({ typingStatus: { isTyping: false, userRole: null } })}
      />,
    );
    expect(h.botRenders).toBe(afterMount);
  });

  it("a new array containing the same message objects still skips rows (pen-test: identity churn)", async () => {
    const { rerender } = render(<ChatMessageList {...listProps()} />);
    const afterMount = await settledRenderCount();
    rerender(<ChatMessageList {...listProps({ messages: [...messages] })} />);
    expect(h.botRenders).toBe(afterMount);
  });

  it("changing one message re-renders only that message's markdown", async () => {
    const { rerender } = render(<ChatMessageList {...listProps()} />);
    const afterMount = await settledRenderCount();
    const changed = [
      messages[0],
      botMsg("b2", "second bot answer — edited"),
      messages[2],
    ];
    rerender(<ChatMessageList {...listProps({ messages: changed })} />);
    await screen.findByText("second bot answer — edited");
    expect(h.botRenders).toBe(afterMount + 1);
  });
});
