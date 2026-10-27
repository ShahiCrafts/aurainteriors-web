import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// FE-33: ChatWidget (a) computed totalUnread from ONLY the active
// chat, so unread replies in any other conversation never badged the
// FAB, and (b) resolved the stored active chat ONLY within page 1
// (limit 10) of my-chats, so an active chat older than the 10 most
// recent fell back to the welcome screen (and starting a "new" chat
// then forked the thread, FE-19 interaction).
// Fix: badge = sum of unreadCountCustomer across the fetched list;
// when the stored active chat id is not in the first page, fetch it
// via the existing getChatDetails API (useChatDetails) and open it.

const h = vi.hoisted(() => ({
  user: { _id: "user-1", role: "customer", firstName: "Test" },
  myChatsData: undefined,
  detailsData: undefined,
  detailsCalls: [],
}));

vi.mock("../../src/hooks/chat/useChatTan.js", () => ({
  useMyChats: () => ({ data: h.myChatsData }),
  useChatDetails: (chatId, options = {}) => {
    const enabled = options.enabled !== undefined ? options.enabled : !!chatId;
    h.detailsCalls.push({ chatId, enabled });
    return { data: enabled && chatId ? h.detailsData : undefined };
  },
  useStartChat: () => ({ isPending: false, mutate: vi.fn() }),
  useSendMessage: () => ({ mutate: vi.fn() }),
}));
vi.mock("../../src/store/authStore.js", () => ({ default: () => ({ user: h.user }) }));
vi.mock("../../src/utils/guestSessionStorage.js", () => ({
  getGuestSessionId: () => null,
  setGuestSessionId: vi.fn(),
  clearGuestSession: vi.fn(),
}));
vi.mock("../../src/components/chat/ChatWindow.jsx", () => ({
  default: ({ chat }) => (
    <div data-testid="chat-window">{chat ? `conversation:${chat._id}` : "welcome-screen"}</div>
  ),
}));

import ChatWidget from "../../src/components/chat/ChatWidget.jsx";

const chat = (id, extra = {}) => ({ _id: id, status: "ai_handling", unreadCountCustomer: 0, ...extra });
const chatsPage = (chats) => ({ data: { chats } });

function clickFab(container) {
  const buttons = container.querySelectorAll("button");
  fireEvent.click(buttons[buttons.length - 1]);
}

beforeEach(() => {
  h.myChatsData = undefined;
  h.detailsData = undefined;
  h.detailsCalls = [];
});

describe("ChatWidget unread badge (FE-33)", () => {
  it("badges the SUM of unread across the list — unread in a second, non-active chat counts", () => {
    h.myChatsData = chatsPage([
      chat("chat-a", { unreadCountCustomer: 2 }),
      chat("chat-b", { status: "agent_handling", unreadCountCustomer: 3 }),
      chat("chat-c", { status: "resolved", unreadCountCustomer: undefined }),
    ]);

    const { container } = render(<ChatWidget />);

    // Nothing is active/open yet, so pre-fix totalUnread was 0 and no
    // badge rendered at all. The badge must show 2 + 3 = 5.
    const badge = [...container.querySelectorAll("span")].find((s) => s.textContent === "5");
    expect(badge).toBeTruthy();
  });

  it("shows no badge when every conversation is read", () => {
    h.myChatsData = chatsPage([chat("chat-a"), chat("chat-b")]);
    const { container } = render(<ChatWidget />);
    const badge = [...container.querySelectorAll("span")].find((s) => /^\d+\+?$/.test(s.textContent));
    expect(badge).toBeUndefined();
  });
});

describe("ChatWidget active chat resolution (FE-33)", () => {
  it("a stored active chat that is the 11th most recent still opens the conversation, fetched by id", () => {
    // The active chat starts as the most recent, so opening the
    // widget selects it from the list.
    h.myChatsData = chatsPage([chat("chat-11", { unreadCountCustomer: 1 })]);
    const { container, rerender } = render(<ChatWidget />);
    clickFab(container);
    expect(screen.getByTestId("chat-window")).toHaveTextContent("conversation:chat-11");

    // Ten newer chats then push it out of page 1 (limit 10): the
    // first page no longer contains it. The widget must fetch it by
    // id via getChatDetails instead of dropping to the welcome screen.
    h.myChatsData = chatsPage(
      Array.from({ length: 10 }, (_, i) => chat(`chat-new-${i + 1}`)),
    );
    h.detailsData = { data: { chat: chat("chat-11", { unreadCountCustomer: 1 }) } };
    rerender(<ChatWidget />);

    expect(h.detailsCalls.some((c) => c.chatId === "chat-11" && c.enabled)).toBe(true);
    expect(screen.getByTestId("chat-window")).toHaveTextContent("conversation:chat-11");
    expect(screen.getByTestId("chat-window")).not.toHaveTextContent("welcome-screen");
  });

  it("does not fetch by id when the active chat is already in the first page", () => {
    h.myChatsData = chatsPage([chat("chat-1"), chat("chat-2")]);
    const { container } = render(<ChatWidget />);
    clickFab(container);
    expect(screen.getByTestId("chat-window")).toHaveTextContent("conversation:chat-1");
    expect(h.detailsCalls.filter((c) => c.enabled)).toHaveLength(0);
  });
});
