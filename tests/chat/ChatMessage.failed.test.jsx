import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ChatMessage, {
  ATTACHMENT_RETRY_EVENT,
} from "../../src/components/chat/ChatMessage.jsx";

// FE-19: optimistic send failures set isFailed/sendError in
// useChatTan, but ChatMessage rendered neither field — a failed send
// looked delivered (single check). These tests pin the fixed
// behaviour: a failed own message is marked failed, shows the error,
// offers tap-to-retry, and never shows a delivered/read indicator.

const failedMessage = {
  _id: "opt-1",
  content: "Please help with my order",
  senderRole: "customer",
  sender: { _id: "u1", firstName: "You", role: "customer" },
  createdAt: "2026-01-01T10:30:00.000Z",
  attachments: [],
  isPending: false,
  isFailed: true,
  sendError: "Network error",
  clientMessageId: "cm-1",
};

describe("ChatMessage failed state (FE-19)", () => {
  it("marks a failed own message as failed with its error, not delivered", () => {
    const { container } = render(
      <ChatMessage
        message={failedMessage}
        isOwnMessage={true}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
    expect(screen.getByText(/network error/i)).toBeInTheDocument();
    // Must not claim delivery: no "delivered" semantics — the failed
    // affordance replaces the check-mark status row content.
    expect(container.textContent).not.toMatch(/delivered/i);
  });

  it("offers a retry button that calls onRetry with the message", () => {
    const onRetry = vi.fn();
    render(
      <ChatMessage
        message={failedMessage}
        isOwnMessage={true}
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry.mock.calls[0][0]).toMatchObject({
      _id: "opt-1",
      clientMessageId: "cm-1",
    });
  });

  it("a pending message is not shown as failed", () => {
    const pending = {
      ...failedMessage,
      _id: "opt-2",
      isPending: true,
      isFailed: false,
      sendError: undefined,
    };
    render(
      <ChatMessage message={pending} isOwnMessage={true} onRetry={vi.fn()} />,
    );
    expect(screen.queryByText(/failed to send/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /retry/i }),
    ).not.toBeInTheDocument();
  });

  it("a delivered message shows no failed affordance", () => {
    const ok = {
      ...failedMessage,
      _id: "m-ok",
      isFailed: false,
      sendError: undefined,
      deliveredAt: "2026-01-01T10:31:00.000Z",
    };
    render(<ChatMessage message={ok} isOwnMessage={true} onRetry={vi.fn()} />);
    expect(screen.queryByText(/failed to send/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /retry/i }),
    ).not.toBeInTheDocument();
  });

  it("a photo whose background upload failed offers an in-place retry that dispatches the retry event", () => {
    const withFailedPhoto = {
      ...failedMessage,
      _id: "m-photo",
      isFailed: false,
      sendError: undefined,
      content: "",
      attachments: [
        {
          fileName: "photo.jpg",
          fileUrl: "blob:http://localhost/abc",
          _localBlobUrl: "blob:http://localhost/abc",
          fileType: "image",
          fileSize: 1234,
          _localKey: "lk-1",
          _pendingSync: false,
          _syncFailed: true,
        },
      ],
    };
    const seen = [];
    const listener = (event) => seen.push(event.detail);
    window.addEventListener(ATTACHMENT_RETRY_EVENT, listener);
    try {
      render(
        <ChatMessage
          message={withFailedPhoto}
          isOwnMessage={true}
          onRetry={vi.fn()}
        />,
      );
      fireEvent.click(
        screen.getByRole("button", { name: /couldn't upload/i }),
      );
      expect(seen).toEqual([{ messageId: "m-photo", localKey: "lk-1" }]);
    } finally {
      window.removeEventListener(ATTACHMENT_RETRY_EVENT, listener);
    }
  });

  it("a photo still uploading shows the uploading veil, not the retry affordance", () => {
    const withPendingPhoto = {
      ...failedMessage,
      _id: "m-photo-2",
      isFailed: false,
      sendError: undefined,
      content: "",
      attachments: [
        {
          fileName: "photo.jpg",
          fileUrl: "blob:http://localhost/def",
          _localBlobUrl: "blob:http://localhost/def",
          fileType: "image",
          fileSize: 1234,
          _localKey: "lk-2",
          _pendingSync: true,
        },
      ],
    };
    render(
      <ChatMessage
        message={withPendingPhoto}
        isOwnMessage={true}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /couldn't upload/i }),
    ).not.toBeInTheDocument();
  });
});
