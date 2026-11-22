// Batch 3c — SupportChats list pages ACCUMULATE: the redesigned
// list's "Load more conversations" footer appends the next page to
// the conversations already shown instead of replacing them (the
// pagination API itself is unchanged).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Result objects are pre-built ONCE per page: the page's accumulate
// effect keys off the query result identity (as React Query's stable
// results do in the app), so the mock must return a stable reference
// per page — a fresh object per render would re-trigger the effect
// forever.
const hoisted = vi.hoisted(() => {
  const makeResult = (chats) => ({
    data: { data: { chats, pagination: { total: 2, totalPages: 2 } } },
    isLoading: false,
    refetch: () => {},
  });
  return {
    results: {
      1: makeResult([
        { _id: "c1", status: "agent_handling", customer: { firstName: "A", lastName: "B" }, metadata: {} },
      ]),
      2: makeResult([
        { _id: "c2", status: "agent_handling", customer: { firstName: "C", lastName: "D" }, metadata: {} },
      ]),
    },
  };
});

vi.mock("../../../src/hooks/chat/useChatTan", () => ({
  useAllChats: ({ page = 1 } = {}) => hoisted.results[page] || hoisted.results[1],
  useWaitingQueue: () => ({ data: null }),
}));

vi.mock("../../../src/components/admin/chat/ChatList", () => ({
  default: ({ chats, onPageChange, currentPage }) => (
    <div data-testid="chat-list">
      {chats.map((c) => (
        <span key={c._id}>row-{c._id}</span>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)}>
        Load more conversations
      </button>
    </div>
  ),
}));

vi.mock("../../../src/components/admin/chat/ChatConversation", () => ({
  default: ({ chat }) => <div data-testid="conversation">{chat._id}</div>,
}));

vi.mock("../../../src/components/admin/chat/AiAssistantPanel", () => ({
  default: () => <div data-testid="ai-panel" />,
}));

import SupportChats from "../../../src/pages/admin/SupportChats.jsx";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SupportChats Load more accumulation (Batch 3c)", () => {
  it("appends page 2 to page 1 instead of replacing it", () => {
    render(<SupportChats />);
    expect(screen.getByText("row-c1")).toBeInTheDocument();
    expect(screen.queryByText("row-c2")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /load more conversations/i }),
    );

    expect(screen.getByText("row-c1")).toBeInTheDocument();
    expect(screen.getByText("row-c2")).toBeInTheDocument();
  });

  it("renders the redesigned page header", () => {
    render(<SupportChats />);
    expect(
      screen.getByRole("heading", { name: "Support Chat" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Help your customers with AI-powered support"),
    ).toBeInTheDocument();
  });
});
