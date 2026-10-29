// FE-17 — ChatList chats.filter on an undefined prop, and ChatConversation's
// footer dereferencing chat.status/chat._id on a null chat. Both must render
// a placeholder instead of throwing. Both fail pre-fix.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../../../../src/hooks/chat/useChatTan.js", () => ({
  useChatMessages: vi.fn(),
  useMarkMessagesRead: vi.fn(),
  useResolveChat: vi.fn(),
}));
vi.mock("../../../../src/hooks/chat/useChatSocket.js", () => ({
  default: () => ({
    typingStatus: {},
    sendTypingIndicator: vi.fn(),
    broadcastRead: vi.fn(),
  }),
}));
vi.mock("../../../../src/hooks/notification/useNotificationSocket.js", () => ({
  default: () => ({ socket: null }),
}));
vi.mock("../../../../src/store/authStore.js", () => ({
  default: () => ({ user: { _id: "admin-1" }, token: "test-token" }),
}));
vi.mock("../../../../src/components/chat/ChatMessageList.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../../src/components/chat/ChatInput.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../../src/components/chat/TypingIndicator.jsx", () => ({
  default: () => null,
}));

import {
  useChatMessages,
  useMarkMessagesRead,
  useResolveChat,
} from "../../../../src/hooks/chat/useChatTan.js";
import ChatList from "../../../../src/components/admin/chat/ChatList.jsx";
import ChatConversation from "../../../../src/components/admin/chat/ChatConversation.jsx";

beforeEach(() => {
  useChatMessages.mockReturnValue({
    data: { pages: [] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
  });
  useMarkMessagesRead.mockReturnValue({ mutate: vi.fn() });
  useResolveChat.mockReturnValue({ mutate: vi.fn(), isPending: false });
});

describe("FE-17 chat guards", () => {
  it("ChatList renders the empty state with undefined chats", () => {
    render(
      <ChatList
        chats={undefined}
        pagination={{ total: 0, totalPages: 1 }}
        isLoading={false}
        selectedChat={null}
        onSelectChat={vi.fn()}
        statusFilter="all"
        onStatusFilterChange={vi.fn()}
        onPageChange={vi.fn()}
        currentPage={1}
      />,
    );
    expect(screen.getByText("No conversations")).toBeInTheDocument();
  });

  it("ChatConversation renders with a null chat (footer must not dereference it)", () => {
    const { container } = render(<ChatConversation chat={null} />);
    expect(container.firstChild).not.toBeNull();
  });
});
