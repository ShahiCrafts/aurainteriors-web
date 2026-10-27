// FE-14 — ChatList invented an AI confidence value per render:
// `chat.metadata?.confidence || Math.floor(Math.random() * 60) + 30`.
// metadata.confidence IS a real field on the server Chat schema
// (models/chat.model.js: metadata.confidence: Number), but the computed
// value was never rendered anywhere in the component — the invention was
// dead code whose only observable effect was calling Math.random() for
// every chat without a confidence. The no-confidence case below FAILS on
// the pre-fix component (Math.random is called during render).
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

import ChatList from "../../../../src/components/admin/chat/ChatList.jsx";

const baseProps = {
  pagination: { total: 1, totalPages: 1 },
  isLoading: false,
  selectedChat: null,
  onSelectChat: vi.fn(),
  statusFilter: "all",
  onStatusFilterChange: vi.fn(),
  onPageChange: vi.fn(),
  currentPage: 1,
};

const chatWithoutConfidence = {
  _id: "chat-1",
  priority: "high",
  lastMessageAt: "2026-10-24T10:00:00.000Z",
  lastMessageText: "Where is my order?",
  customer: { firstName: "Asha", lastName: "Rai" },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ChatList (FE-14)", () => {
  it("does not invent a confidence value for a chat that has none", () => {
    const randomSpy = vi.spyOn(Math, "random");

    render(<ChatList {...baseProps} chats={[chatWithoutConfidence]} />);

    expect(randomSpy).not.toHaveBeenCalled();
    // The real row content renders unchanged.
    expect(screen.getByText(/Asha Rai/)).toBeInTheDocument();
    expect(screen.getByText("Where is my order?")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("renders a chat carrying a real metadata.confidence unchanged, without inventing one", () => {
    const randomSpy = vi.spyOn(Math, "random");
    const chatWithConfidence = {
      ...chatWithoutConfidence,
      _id: "chat-2",
      metadata: { confidence: 0.85 },
    };

    render(<ChatList {...baseProps} chats={[chatWithConfidence]} />);

    expect(randomSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Asha Rai/)).toBeInTheDocument();
    expect(screen.getByText("Where is my order?")).toBeInTheDocument();
  });
});
