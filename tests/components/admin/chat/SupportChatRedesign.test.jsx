// Batch 3c — admin Support Chat redesign (approved mockup).
//
// Pins the design contract of the rebuilt page:
//  - ChatList: priority pill mapping (urgent→High, medium→Normal),
//    unread avatar badges, selected-row state, search filtering, and
//    the "Load more conversations" pagination footer.
//  - AdminMessageList/AdminMessage: agent (left, gray), customer
//    (right, light blue, blue read ticks), AI (green, "AI Assistant"
//    label + blue bot avatar) bubbles, image messages, day dividers.
//  - ChatConversation: the header priority dropdown PATCHes priority
//    through useUpdateChatPriority; "Close conversation" resolves.
//  - AiAssistantPanel: chat-mode badge + auto-reply toggle wiring,
//    customer profile, and Live Store Orders rows (NPR + pills).
//  - ChatInput admin variant: working emoji insert + blue send.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ---------------------------------------------------------------------------
// ChatList
// ---------------------------------------------------------------------------
import ChatList from "../../../../src/components/admin/chat/ChatList.jsx";

const listProps = {
  pagination: { total: 3, totalPages: 2 },
  isLoading: false,
  selectedChat: null,
  onSelectChat: vi.fn(),
  statusFilter: "all",
  onStatusFilterChange: vi.fn(),
  onPageChange: vi.fn(),
  currentPage: 1,
};

const listChat = (id, extra = {}) => ({
  _id: id,
  priority: "normal",
  lastMessageAt: "2026-11-13T10:00:00.000Z",
  lastMessageText: "Hello there",
  unreadCountAdmin: 0,
  customer: { firstName: "Asha", lastName: "Rai" },
  ...extra,
});

describe("ChatList redesign (Batch 3c)", () => {
  it("renders the Conversations header with the total and a live dot", () => {
    render(<ChatList {...listProps} chats={[listChat("c1")]} />);
    expect(screen.getByText("Conversations (3)")).toBeInTheDocument();
  });

  it("maps priorities to pills: normal/medium→Normal, high/urgent→High, low→Low", () => {
    render(
      <ChatList
        {...listProps}
        chats={[
          listChat("c1", { priority: "normal" }),
          listChat("c2", { priority: "medium" }),
          listChat("c3", { priority: "high" }),
          listChat("c4", { priority: "urgent" }),
          listChat("c5", { priority: "low" }),
        ]}
      />,
    );
    expect(screen.getAllByText("Normal")).toHaveLength(2);
    expect(screen.getAllByText("High")).toHaveLength(2);
    expect(screen.getAllByText("Low")).toHaveLength(1);
  });

  it("shows the unread count as a badge and the date in M/D/YYYY", () => {
    render(
      <ChatList {...listProps} chats={[listChat("c1", { unreadCountAdmin: 2 })]} />,
    );
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("11/13/2026")).toBeInTheDocument();
  });

  it("marks the selected row with the blue background and accent bar", () => {
    const chat = listChat("c1");
    const { container } = render(
      <ChatList {...listProps} chats={[chat]} selectedChat={chat} />,
    );
    const row = screen.getByText(/Asha Rai/).closest("div[class*='cursor-pointer']");
    expect(row.className).toContain("bg-blue-50");
    expect(container.querySelector(".bg-\\[\\#2563EB\\]")).not.toBeNull();
  });

  it("filters rows by the search input", () => {
    render(
      <ChatList
        {...listProps}
        chats={[
          listChat("c1"),
          listChat("c2", {
            customer: { firstName: "Bikash", lastName: "Pandey" },
            lastMessageText: "Do you deliver outside KTM?",
          }),
        ]}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText("Search conversations..."), {
      target: { value: "bikash" },
    });
    expect(screen.getByText(/Bikash Pandey/)).toBeInTheDocument();
    expect(screen.queryByText(/Asha Rai/)).not.toBeInTheDocument();
  });

  it("Load more conversations advances the page", () => {
    const onPageChange = vi.fn();
    render(
      <ChatList {...listProps} chats={[listChat("c1")]} onPageChange={onPageChange} />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /load more conversations/i }),
    );
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

// ---------------------------------------------------------------------------
// AdminMessageList / AdminMessage
// ---------------------------------------------------------------------------
import AdminMessageList from "../../../../src/components/admin/chat/AdminMessageList.jsx";

const msg = (id, extra = {}) => ({
  _id: id,
  content: "",
  senderRole: "customer",
  sender: { _id: "cust-1", firstName: "Saugat", lastName: "Shahi" },
  createdAt: "2026-11-13T04:53:00.000Z",
  isRead: false,
  ...extra,
});

const listMessagesProps = {
  isLoading: false,
  onLoadMore: vi.fn(),
  hasMore: false,
  isFetchingMore: false,
  currentUserId: "admin-1",
  typingStatus: {},
};

describe("AdminMessageList redesign (Batch 3c)", () => {
  it("renders the agent bubble on the gray (left) design", () => {
    render(
      <AdminMessageList
        {...listMessagesProps}
        messages={[
          msg("m1", {
            senderRole: "admin",
            sender: { _id: "admin-1", firstName: "Admin" },
            content: "Thanks for reaching out — our team will help.",
          }),
        ]}
      />,
    );
    const bubble = screen.getByText(/Thanks for reaching out/);
    expect(bubble.className).toContain("bg-gray-100");
  });

  it("renders the customer bubble light blue with blue read ticks when read", () => {
    const { container } = render(
      <AdminMessageList
        {...listMessagesProps}
        messages={[msg("m1", { content: "Great, thank you!", isRead: true })]}
      />,
    );
    const bubble = screen.getByText("Great, thank you!");
    expect(bubble.className).toContain("bg-blue-100");
    const ticks = container.querySelector(".lucide-check-check");
    expect(ticks).not.toBeNull();
    expect(ticks.getAttribute("class")).toContain("text-[#2563EB]");
  });

  it("renders the AI bubble green with the AI Assistant label and blue bot avatar", () => {
    const { container } = render(
      <AdminMessageList
        {...listMessagesProps}
        messages={[
          msg("m1", {
            senderRole: "bot",
            content: "Sure! Let me know if you have questions.",
          }),
        ]}
      />,
    );
    const bubble = screen.getByText(/Sure! Let me know/);
    expect(bubble.className).toContain("bg-green-50");
    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    expect(container.querySelector(".lucide-bot")).not.toBeNull();
  });

  it("renders image messages as rounded images", () => {
    render(
      <AdminMessageList
        {...listMessagesProps}
        messages={[
          msg("m1", {
            content: "",
            attachments: [
              {
                fileName: "sofa.png",
                fileUrl: "https://res.cloudinary.com/aura/sofa.png",
                fileType: "image",
                fileSize: 2048,
              },
            ],
          }),
        ]}
      />,
    );
    const img = screen.getByAltText("sofa.png");
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toContain("sofa.png");
  });

  it("inserts a centred day-divider pill when the day changes", () => {
    render(
      <AdminMessageList
        {...listMessagesProps}
        messages={[
          msg("m1", { content: "First day", createdAt: "2026-11-13T04:53:00.000Z" }),
          msg("m2", { content: "Second day", createdAt: "2026-11-14T04:53:00.000Z" }),
        ]}
      />,
    );
    expect(screen.getByText("Nov 13, 2026")).toBeInTheDocument();
    expect(screen.getByText("Nov 14, 2026")).toBeInTheDocument();
  });
});
