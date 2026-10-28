// FE-25 — Admin SupportChats:
//  1. Tapping Back must STAY on the list (pre-fix the auto-select
//     effect re-selected chats[0] the moment selectedChat became null,
//     and again at every poll).
//  2. The open conversation must be LIVE: selection is stored by id
//     and the chat object derived from the latest polled list, not a
//     snapshot taken at click time.
//  3. AiAssistantPanel's reply callbacks must reach the composer
//     (pre-fix they were console.log stubs in the page).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const hoisted = vi.hoisted(() => ({
  chatsResult: { data: null, isLoading: false, refetch: vi.fn() },
  conversationProps: null,
}));

vi.mock("../../../src/hooks/chat/useChatTan", () => ({
  useAllChats: () => hoisted.chatsResult,
  useWaitingQueue: () => ({ data: null }),
  useSendMessage: () => ({ mutateAsync: vi.fn(async () => {}) }),
}));

vi.mock("../../../src/components/admin/chat/ChatList", () => ({
  default: ({ chats, onSelectChat }) => (
    <div data-testid="chat-list">
      {chats.map((c) => (
        <button key={c._id} onClick={() => onSelectChat(c)}>
          open-{c._id}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../../../src/components/admin/chat/ChatConversation", () => ({
  default: (props) => {
    hoisted.conversationProps = props;
    const { chat, draftReply } = props;
    return (
      <div data-testid="conversation">
        {chat._id}:{chat.status}:draft={draftReply?.text ?? ""}
      </div>
    );
  },
}));

vi.mock("../../../src/components/admin/chat/AiAssistantPanel", () => ({
  default: ({ chat, onUseReply, onEditReply }) => (
    <div data-testid="ai-panel">
      <span data-testid="ai-reply">{chat?.metadata?.suggestedReply ?? ""}</span>
      <button onClick={() => onUseReply?.(chat?.metadata?.suggestedReply)}>
        Send to Input
      </button>
      <button onClick={() => onEditReply?.(chat?.metadata?.suggestedReply)}>
        Edit reply
      </button>
    </div>
  ),
}));

vi.mock("../../../src/api/chatApi.js", () => ({
  uploadChatAttachment: vi.fn(),
}));
vi.mock("../../../src/store/authStore.js", () => {
  const state = { openAuthModal: vi.fn(), user: null };
  const store = (selector) =>
    typeof selector === "function" ? selector(state) : state;
  store.getState = () => state;
  return { default: store };
});

import SupportChats from "../../../src/pages/admin/SupportChats.jsx";
import ChatInput from "../../../src/components/chat/ChatInput.jsx";

const chat = (id, extra = {}) => ({
  _id: id,
  status: "open",
  customer: { firstName: "A", lastName: "B", email: "a@b.c" },
  metadata: {},
  ...extra,
});

// The page's mobile Back control is the arrow button next to the
// "Back to List" label (the label itself is a sibling span).
function clickBack(container) {
  const btn = container
    .querySelector("svg.lucide-arrow-left")
    ?.closest("button");
  expect(btn, "back arrow button").toBeTruthy();
  fireEvent.click(btn);
}

function setChats(chats) {
  hoisted.chatsResult = {
    data: { data: { chats, pagination: {} } },
    isLoading: false,
    refetch: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.conversationProps = null;
  setChats([chat("c1"), chat("c2")]);
});

describe("FE-25 SupportChats selection", () => {
  it("auto-selects the first chat on first load", () => {
    render(<SupportChats />);
    expect(screen.getByTestId("conversation")).toHaveTextContent("c1:open");
  });

  it("Back returns to the list and STAYS there — including after the next poll replaces list identity", () => {
    const { rerender, container } = render(<SupportChats />);
    expect(screen.getByTestId("conversation")).toBeInTheDocument();

    clickBack(container);
    expect(screen.queryByTestId("conversation")).not.toBeInTheDocument();

    // Simulate a poll tick: brand-new array/object identities, same ids.
    setChats([chat("c1"), chat("c2")]);
    rerender(<SupportChats />);
    expect(screen.queryByTestId("conversation")).not.toBeInTheDocument();

    setChats([chat("c1"), chat("c2")]);
    rerender(<SupportChats />);
    expect(screen.queryByTestId("conversation")).not.toBeInTheDocument();
  });

  it("manual selection still works after Back (auto-select does not fight the user either way)", () => {
    const { container } = render(<SupportChats />);
    clickBack(container);
    expect(screen.queryByTestId("conversation")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("open-c2"));
    expect(screen.getByTestId("conversation")).toHaveTextContent("c2:open");
  });

  it("the open conversation reflects polled updates without reselection (no stale snapshot)", () => {
    const { rerender } = render(<SupportChats />);
    expect(screen.getByTestId("conversation")).toHaveTextContent("c1:open");

    setChats([
      chat("c1", {
        status: "resolved",
        metadata: { suggestedReply: "Fresh reply" },
      }),
      chat("c2"),
    ]);
    rerender(<SupportChats />);

    expect(screen.getByTestId("conversation")).toHaveTextContent("c1:resolved");
    expect(screen.getByTestId("ai-reply")).toHaveTextContent("Fresh reply");
  });

  it("AI panel 'Send to Input' delivers the reply to the conversation composer (not console.log)", () => {
    setChats([
      chat("c1", { metadata: { suggestedReply: "Hello, help is here" } }),
    ]);
    render(<SupportChats />);
    fireEvent.click(screen.getByText("Send to Input"));
    expect(hoisted.conversationProps.draftReply?.text).toBe(
      "Hello, help is here",
    );
    expect(screen.getByTestId("conversation")).toHaveTextContent(
      "draft=Hello, help is here",
    );
  });

  it("PEN: repeated polls with changed ordering do not yank the user into a different conversation", () => {
    const { rerender } = render(<SupportChats />);
    fireEvent.click(screen.getByText("open-c2"));
    expect(screen.getByTestId("conversation")).toHaveTextContent("c2:open");

    // Poll returns the list reordered — selection by id must hold c2.
    setChats([chat("c2"), chat("c1")]);
    rerender(<SupportChats />);
    expect(screen.getByTestId("conversation")).toHaveTextContent("c2:open");
  });
});

describe("FE-25 ChatInput draftReply (composer end of the wiring)", () => {
  it("a draftReply prop inserts the text into the composer textarea", () => {
    const { rerender } = render(
      <ChatInput chatId="c1" onTyping={() => {}} draftReply={null} />,
    );
    const textarea = screen.getByPlaceholderText(/type your message/i);
    expect(textarea.value).toBe("");

    rerender(
      <ChatInput
        chatId="c1"
        onTyping={() => {}}
        draftReply={{ text: "Suggested reply text", nonce: 1 }}
      />,
    );
    expect(textarea.value).toBe("Suggested reply text");
  });
});
