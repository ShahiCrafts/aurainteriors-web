// FE-14 — AiAssistantPanel must not invent an AI summary or a suggested
// reply when the chat carries none. Pre-fix, missing
// metadata.aiSummary / metadata.suggestedReply fell back to plausible
// fabricated sentences, and the fabricated reply had a working
// "Send to Input" dispatch (onUseReply) and copy path. The fabricated-case
// assertions below FAIL on the pre-fix component.
//
// Send-path trace: inside the panel the ONLY ways suggested text leaves
// the component are (1) the "Send to Input" button -> onUseReply(text)
// (wired by src/pages/admin/SupportChats.jsx) and (2) the copy button ->
// navigator.clipboard.writeText(text). The agent's own typed text is sent
// through ChatInput in ChatConversation, a separate component this change
// does not touch.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../../../../src/hooks/chat/useChatTan.js", () => ({
  useToggleBot: vi.fn(),
}));

vi.mock("../../../../src/hooks/order/useOrderTan.js", () => ({
  useAllOrders: vi.fn(),
}));

import { useToggleBot } from "../../../../src/hooks/chat/useChatTan.js";
import { useAllOrders } from "../../../../src/hooks/order/useOrderTan.js";
import AiAssistantPanel from "../../../../src/components/admin/chat/AiAssistantPanel.jsx";

const FABRICATED_SUMMARY =
  "The customer is asking about delivery status and showing concern over order timelines.";
const FABRICATED_REPLY =
  "Hello! Let me pull up your order status right away and see what's happening.";

const baseChat = {
  _id: "chat-1",
  status: "agent_handling",
  customer: {
    firstName: "Asha",
    lastName: "Rai",
    email: "asha@example.com",
    createdAt: "2024-01-15T00:00:00.000Z",
  },
};

const toggleBotMutate = vi.fn();

beforeEach(() => {
  useToggleBot.mockReturnValue({ mutate: toggleBotMutate, isPending: false });
  useAllOrders.mockReturnValue({
    data: { data: { orders: [] } },
    isLoading: false,
  });
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn(() => Promise.resolve()) },
  });
});

describe("AiAssistantPanel with no AI data (FE-14)", () => {
  it("shows an honest empty state instead of the fabricated summary", () => {
    render(
      <AiAssistantPanel
        chat={{ ...baseChat, metadata: {} }}
        onUseReply={vi.fn()}
      />,
    );

    expect(screen.getByText("No AI summary available")).toBeInTheDocument();
    expect(screen.queryByText(FABRICATED_SUMMARY)).not.toBeInTheDocument();
  });

  it("renders no suggested-response UI and no dispatch path when there is no suggested reply", () => {
    const onUseReply = vi.fn();
    render(<AiAssistantPanel chat={{ ...baseChat }} onUseReply={onUseReply} />);

    expect(screen.queryByText(FABRICATED_REPLY)).not.toBeInTheDocument();
    expect(screen.queryByText(/Suggested Response/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Send to Input/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Copy suggested response/i }),
    ).not.toBeInTheDocument();

    // Click every remaining control in the panel: none may dispatch the
    // fabricated text (or any suggestion) to the agent input / customer.
    screen.getAllByRole("button").forEach((button) => fireEvent.click(button));
    expect(onUseReply).not.toHaveBeenCalled();
    expect(navigator.clipboard.writeText).not.toHaveBeenCalledWith(
      FABRICATED_REPLY,
    );
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });
});

describe("AiAssistantPanel with real AI data (FE-14)", () => {
  const realChat = {
    ...baseChat,
    metadata: {
      aiSummary: "Customer asked about a refund for a damaged chair.",
      suggestedReply: "Sorry about that — I can arrange a replacement today.",
    },
  };

  it("renders the real summary and suggested reply unchanged", () => {
    render(<AiAssistantPanel chat={realChat} onUseReply={vi.fn()} />);

    expect(
      screen.getByText("Customer asked about a refund for a damaged chair."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Sorry about that — I can arrange a replacement today\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No AI summary available"),
    ).not.toBeInTheDocument();
  });

  it("dispatches exactly the real suggested reply, never fabricated text", () => {
    const onUseReply = vi.fn();
    render(<AiAssistantPanel chat={realChat} onUseReply={onUseReply} />);

    fireEvent.click(screen.getByRole("button", { name: /Send to Input/ }));

    expect(onUseReply).toHaveBeenCalledTimes(1);
    expect(onUseReply).toHaveBeenCalledWith(
      "Sorry about that — I can arrange a replacement today.",
    );
    expect(onUseReply).not.toHaveBeenCalledWith(FABRICATED_REPLY);
  });

  it("copies exactly the real suggested reply", () => {
    render(<AiAssistantPanel chat={realChat} onUseReply={vi.fn()} />);

    fireEvent.click(screen.getByTitle("Copy suggested response"));

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "Sorry about that — I can arrange a replacement today.",
    );
  });
});
