// FE-14 — ChatConversation's header showed the literal "Order #12931" for
// every customer. Server evidence (read-only, server tree): the Chat
// schema (models/chat.model.js) has NO order reference field at all — no
// orderId, no related order — so there is no real order reference to
// render and the element must be omitted entirely. The fabricated-case
// assertion below FAILS on the pre-fix component.
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

// Shared chat children are not under test here.
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
import ChatConversation from "../../../../src/components/admin/chat/ChatConversation.jsx";

const chat = {
  _id: "chat-1",
  status: "agent_handling",
  priority: "high",
  unreadCountAdmin: 0,
  customer: {
    firstName: "Asha",
    lastName: "Rai",
    email: "asha@example.com",
    createdAt: "2023-05-01T00:00:00.000Z",
  },
};

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

describe("ChatConversation header (FE-14)", () => {
  it("does not show the fabricated 'Order #12931' or any order reference", () => {
    const { container } = render(<ChatConversation chat={chat} />);

    expect(screen.queryByText(/Order #12931/)).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Order #\d+/);
  });

  it("still renders the real customer identity and tenure unchanged", () => {
    render(<ChatConversation chat={chat} />);

    expect(screen.getByText("Asha Rai")).toBeInTheDocument();
    expect(screen.getByText(/Customer since 2023/)).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});

// FE-38 — the 'Transfer' button rendered with no onClick and there is
// no transfer feature to wire it to: the client chat API has no
// transfer call and the server chat routes (read-only check of
// routes/chat.routes.js) define no transfer/assign endpoint (only
// read/close/toggle-bot/resolve/attachments/messages). Disposition:
// REMOVE. The neighbouring Close button is wired (resolve mutation)
// and must stay.
describe("ChatConversation dead controls (FE-38)", () => {
  it("renders no Transfer button", () => {
    render(<ChatConversation chat={chat} />);
    expect(
      screen.queryByRole("button", { name: /transfer/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Transfer/)).not.toBeInTheDocument();
  });

  it("keeps the wired Close button", () => {
    render(<ChatConversation chat={chat} />);
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });
});
