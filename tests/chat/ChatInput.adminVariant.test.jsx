// Batch 3c — ChatInput's admin variant (used only by the redesigned
// admin Support Chat thread): the same composer machinery with the
// admin styling, a WORKING emoji insert, and the filled blue send
// button. The default (customer) variant must stay exactly as FE-38
// left it — no emoji button (see ChatInput.deadControls.test.jsx).
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const sendSpy = vi.hoisted(() => vi.fn(async () => ({})));

vi.mock("../../src/hooks/chat/useChatTan.js", () => ({
  useSyncMessageAttachments: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(async () => ({})),
  }),
  useSendMessage: () => ({ mutateAsync: sendSpy }),
}));
vi.mock("../../src/api/chatApi.js", () => ({ uploadChatAttachment: vi.fn() }));
vi.mock("../../src/store/authStore.js", () => {
  const state = { openAuthModal: vi.fn(), user: null };
  const store = (selector) =>
    typeof selector === "function" ? selector(state) : state;
  store.getState = () => state;
  return { default: store };
});

import ChatInput from "../../src/components/chat/ChatInput.jsx";

beforeEach(() => {
  sendSpy.mockClear();
});

describe("ChatInput admin variant (Batch 3c)", () => {
  it("renders the emoji control only in the admin variant", () => {
    const { unmount } = render(
      <ChatInput chatId="c1" onTyping={vi.fn()} variant="admin" />,
    );
    expect(screen.getByLabelText("Insert emoji")).toBeInTheDocument();
    expect(screen.getByLabelText("Send message")).toBeInTheDocument();
    unmount();

    render(<ChatInput chatId="c1" onTyping={vi.fn()} />);
    expect(screen.queryByLabelText("Insert emoji")).not.toBeInTheDocument();
  });

  it("the emoji picker inserts the emoji into the composer text", () => {
    render(<ChatInput chatId="c1" onTyping={vi.fn()} variant="admin" />);
    fireEvent.click(screen.getByLabelText("Insert emoji"));
    fireEvent.click(screen.getByLabelText("Insert emoji 😀"));
    const textarea = screen.getByPlaceholderText(/type your message/i);
    expect(textarea.value).toBe("😀");
  });

  it("sends the typed message through the shared send mutation", async () => {
    render(<ChatInput chatId="c1" onTyping={vi.fn()} variant="admin" />);
    const textarea = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(textarea, { target: { value: "Hello from admin" } });
    fireEvent.click(screen.getByLabelText("Send message"));
    await waitFor(() => expect(sendSpy).toHaveBeenCalled());
    expect(sendSpy.mock.calls[0][0]).toMatchObject({
      chatId: "c1",
      content: "Hello from admin",
    });
  });
});
