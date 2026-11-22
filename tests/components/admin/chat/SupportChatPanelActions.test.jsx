// Batch 3c — AiAssistantPanel right-rail actions in the redesign:
// chat-mode badge + "Enable AI Auto-Reply (Start Bot)" toggle wiring,
// customer profile card, and Live Store Orders rows (status pills,
// "Nx Product(s)", Ordered date, NPR totals).
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
import { formatNPR } from "../../../../src/utils/formatCurrency.js";

const baseChat = {
  _id: "chat-1",
  status: "agent_handling",
  customer: {
    firstName: "Saugat",
    lastName: "Shahi",
    email: "dev.shahi.apps@gmail.com",
    createdAt: "2026-11-01T00:00:00.000Z",
  },
  metadata: {},
};

const toggleMutate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  useToggleBot.mockReturnValue({ mutate: toggleMutate, isPending: false });
  useAllOrders.mockReturnValue({
    data: { data: { orders: [] } },
    isLoading: false,
  });
});

describe("AiAssistantPanel redesign actions (Batch 3c)", () => {
  it("human mode shows the HUMAN AGENT badge and the Start Bot button enables AI", () => {
    render(<AiAssistantPanel chat={baseChat} />);
    expect(screen.getByText(/human agent/i)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /enable ai auto-reply \(start bot\)/i }),
    );
    expect(toggleMutate).toHaveBeenCalledWith({
      chatId: "chat-1",
      botActive: true,
    });
  });

  it("AI mode shows the AI ASSISTANT badge and Disable AI Auto-Reply turns it off", () => {
    render(<AiAssistantPanel chat={{ ...baseChat, status: "ai_handling" }} />);
    expect(screen.getByText(/ai assistant/i)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /disable ai auto-reply/i }),
    );
    expect(toggleMutate).toHaveBeenCalledWith({
      chatId: "chat-1",
      botActive: false,
    });
  });

  it("renders the customer profile card with the since month", () => {
    render(<AiAssistantPanel chat={baseChat} />);
    expect(screen.getByText("Customer Profile")).toBeInTheDocument();
    expect(screen.getByText("Saugat Shahi")).toBeInTheDocument();
    expect(screen.getByText("dev.shahi.apps@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("Customer since:")).toBeInTheDocument();
    expect(screen.getByText("Nov 2026")).toBeInTheDocument();
  });

  it("renders Live Store Orders rows with status pill, product count, date and NPR total", () => {
    useAllOrders.mockReturnValue({
      data: {
        data: {
          orders: [
            {
              _id: "o1",
              orderId: "AUMVZVNWBOEROJVT7X",
              orderStatus: "delivered",
              total: 38299,
              createdAt: "2026-11-03T12:00:00.000Z",
              items: [
                { quantity: 1, product: { name: "Sofa" } },
                { quantity: 1, product: { name: "Lamp" } },
              ],
            },
            {
              _id: "o2",
              orderId: "AUMVXIVS57V7XAVUEL",
              orderStatus: "cancelled",
              total: 38299,
              createdAt: "2026-11-01T12:00:00.000Z",
              items: [{ quantity: 1, product: { name: "Chair" } }],
            },
          ],
        },
      },
      isLoading: false,
    });

    render(<AiAssistantPanel chat={baseChat} />);

    expect(screen.getByText("Live Store Orders")).toBeInTheDocument();
    expect(screen.getByText("#AUMVZVNWBOEROJVT7X")).toBeInTheDocument();
    expect(screen.getByText(/delivered/i)).toBeInTheDocument();
    expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
    expect(screen.getByText("2x Products")).toBeInTheDocument();
    expect(screen.getByText("1x Product")).toBeInTheDocument();
    expect(screen.getByText("Ordered: 11/3/2026")).toBeInTheDocument();
    // formatNPR's Intl output separates the code with a non-breaking
    // space, which Testing Library's exact string matcher mishandles —
    // match the rendered amount with a whitespace-tolerant regex and
    // separately pin that it equals the one formatter's output.
    expect(formatNPR(38299)).toContain("38,299");
    expect(screen.getAllByText(/NPR\s+38,299/)).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: /view all/i }),
    ).toBeInTheDocument();
  });
});
