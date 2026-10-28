import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// FE-19: ChatWindow never read the messages query error — a failed
// load (refused guest session, 404 deleted chat, network) rendered
// the same "Start a conversation" empty state as a genuinely empty
// chat. These tests pin: error -> distinct error state with retry;
// empty success -> empty state; socket error -> visible banner.

const h = vi.hoisted(() => ({
  messagesState: {},
  socketError: null,
  refetch: vi.fn(),
  sendMutate: vi.fn(),
}));

vi.mock("../../src/hooks/chat/useChatTan.js", () => ({
  useChatMessages: () => h.messagesState,
  useMarkMessagesRead: () => ({ mutate: vi.fn() }),
  useSendMessage: () => ({ mutate: h.sendMutate }),
}));
vi.mock("../../src/hooks/chat/useChatSocket.js", () => ({
  default: () => ({
    typingStatus: { isTyping: false, userRole: null },
    sendTypingIndicator: vi.fn(),
    broadcastRead: vi.fn(),
  }),
}));
vi.mock("../../src/hooks/notification/useNotificationSocket.js", () => ({
  default: () => ({
    socket: null,
    error: h.socketError,
    connected: !h.socketError,
  }),
}));
vi.mock("../../src/store/authStore.js", () => ({
  default: () => ({ user: null, token: null }),
}));
vi.mock("../../src/utils/guestSessionStorage.js", () => ({
  getGuestSessionId: () => "guest_x",
}));
vi.mock("../../src/components/chat/ChatMessageList.jsx", () => ({
  default: ({ messages }) => (
    <div data-testid="msg-list">{messages.length} messages</div>
  ),
}));
vi.mock("../../src/components/chat/ChatInput.jsx", () => ({
  default: () => <div data-testid="chat-input" />,
}));

import ChatWindow from "../../src/components/chat/ChatWindow.jsx";

const chat = { _id: "c1", status: "ai_handling" };

function baseState(overrides = {}) {
  return {
    data: {
      pages: [
        { data: { messages: [], pagination: { page: 1, totalPages: 1 } } },
      ],
    },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    isError: false,
    error: null,
    refetch: h.refetch,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.socketError = null;
  h.messagesState = baseState();
});

describe("ChatWindow load failures (FE-19)", () => {
  it("shows a distinct error state with retry when the messages query fails — not the empty state", () => {
    h.messagesState = baseState({
      data: undefined,
      isError: true,
      error: new Error("Chat not found"),
    });
    render(
      <ChatWindow
        chat={chat}
        onClose={vi.fn()}
        onStartNew={vi.fn()}
        onResetView={vi.fn()}
        isCreatingChat={false}
      />,
    );
    expect(screen.getByText(/could not load messages/i)).toBeInTheDocument();
    expect(screen.queryByText(/start a conversation/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("msg-list")).not.toBeInTheDocument();
  });

  it("retry button calls the query refetch", () => {
    h.messagesState = baseState({
      data: undefined,
      isError: true,
      error: new Error("boom"),
    });
    render(
      <ChatWindow
        chat={chat}
        onClose={vi.fn()}
        onStartNew={vi.fn()}
        onResetView={vi.fn()}
        isCreatingChat={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(h.refetch).toHaveBeenCalledTimes(1);
  });

  it("a successful empty history still shows the message list (empty handled by the list), not an error", () => {
    h.messagesState = baseState();
    render(
      <ChatWindow
        chat={chat}
        onClose={vi.fn()}
        onStartNew={vi.fn()}
        onResetView={vi.fn()}
        isCreatingChat={false}
      />,
    );
    expect(screen.getByTestId("msg-list")).toBeInTheDocument();
    expect(
      screen.queryByText(/could not load messages/i),
    ).not.toBeInTheDocument();
  });

  it("surfaces a socket connection error in the widget instead of storing it unread", () => {
    h.socketError = "Connection failed";
    h.messagesState = baseState();
    render(
      <ChatWindow
        chat={chat}
        onClose={vi.fn()}
        onStartNew={vi.fn()}
        onResetView={vi.fn()}
        isCreatingChat={false}
      />,
    );
    expect(screen.getByText(/connection/i)).toBeInTheDocument();
  });
});
