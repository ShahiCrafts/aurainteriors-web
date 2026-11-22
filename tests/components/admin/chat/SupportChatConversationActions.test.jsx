// Batch 3c — ChatConversation header/composer actions in the redesign:
// the priority dropdown pill PATCHes priority via useUpdateChatPriority
// (new PATCH /chats/:id/priority endpoint), and the outlined "Close
// conversation" button below the composer resolves the chat.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../../../src/hooks/chat/useChatTan.js", () => ({
  useChatMessages: vi.fn(),
  useMarkMessagesRead: vi.fn(),
  useResolveChat: vi.fn(),
  useUpdateChatPriority: vi.fn(),
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

// Thread + composer are not under test here.
vi.mock("../../../../src/components/admin/chat/AdminMessageList.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../../src/components/chat/ChatInput.jsx", () => ({
  default: () => null,
}));

import {
  useChatMessages,
  useMarkMessagesRead,
  useResolveChat,
  useUpdateChatPriority,
} from "../../../../src/hooks/chat/useChatTan.js";
import ChatConversation from "../../../../src/components/admin/chat/ChatConversation.jsx";

const chat = {
  _id: "chat-1",
  status: "agent_handling",
  priority: "normal",
  unreadCountAdmin: 0,
  customer: {
    firstName: "Saugat",
    lastName: "Shahi",
    email: "dev.shahi.apps@gmail.com",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
};

const resolveMutate = vi.fn();
const priorityMutate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  useChatMessages.mockReturnValue({
    data: { pages: [] },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
  });
  useMarkMessagesRead.mockReturnValue({ mutate: vi.fn() });
  useResolveChat.mockReturnValue({ mutate: resolveMutate, isPending: false });
  useUpdateChatPriority.mockReturnValue({
    mutate: priorityMutate,
    isPending: false,
  });
});

describe("ChatConversation redesign actions (Batch 3c)", () => {
  it("renders the header identity and the priority dropdown pill", () => {
    render(<ChatConversation chat={chat} />);
    expect(screen.getByText("Saugat Shahi")).toBeInTheDocument();
    expect(screen.getByText(/Customer since 2026/)).toBeInTheDocument();
    const select = screen.getByLabelText("Conversation priority");
    expect(select.value).toBe("normal");
  });

  it("changing the priority dropdown PATCHes the new priority", () => {
    render(<ChatConversation chat={chat} />);
    fireEvent.change(screen.getByLabelText("Conversation priority"), {
      target: { value: "high" },
    });
    expect(priorityMutate).toHaveBeenCalledTimes(1);
    expect(priorityMutate.mock.calls[0][0]).toEqual({
      chatId: "chat-1",
      priority: "high",
    });
  });

  it("the Close conversation button below the composer resolves the chat", () => {
    render(<ChatConversation chat={chat} />);
    fireEvent.click(
      screen.getByRole("button", { name: /close conversation/i }),
    );
    expect(resolveMutate).toHaveBeenCalledTimes(1);
    expect(resolveMutate.mock.calls[0][0]).toBe("chat-1");
  });

  it("the kebab menu also offers the wired Close conversation action", () => {
    render(<ChatConversation chat={chat} />);
    fireEvent.click(screen.getByLabelText("Conversation actions"));
    const menuItems = screen.getAllByRole("button", {
      name: /close conversation/i,
    });
    expect(menuItems.length).toBeGreaterThanOrEqual(2);
  });
});
