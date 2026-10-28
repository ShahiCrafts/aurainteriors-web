import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// FE-49 note: bot content now renders through a React.lazy chunk
// (src/components/chat/BotMarkdown.jsx). While it loads, ChatMessage's
// Suspense fallback renders the raw content as plain text, so plain
// bot text is present synchronously; assertions about rendered
// markdown use findBy* to await the upgrade.

// Characterization tests for src/components/chat/ChatMessage.jsx.
// The component is presentational: its only imports are lucide-react icons,
// react-markdown/remark-gfm, ChatAttachment and the pure getAvatarUrl util
// — no socket, no store — so it renders honestly in jsdom with no mocks
// beyond silencing ChatAttachment's console logging in the attachment test.

import ChatMessage from "../../src/components/chat/ChatMessage.jsx";

const baseMessage = {
  _id: "m1",
  content: "Hello there",
  senderRole: "user",
  sender: { firstName: "Asha", lastName: "Rai" },
  createdAt: "2026-01-01T10:30:00.000Z",
  attachments: [],
};

const expectedTime = (iso) =>
  new Date(iso)
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase();

describe("ChatMessage", () => {
  it("renders another user's message with their first name, content and timestamp", () => {
    render(<ChatMessage message={baseMessage} isOwnMessage={false} />);

    expect(screen.getByText("Asha")).toBeInTheDocument();
    expect(screen.getByText("Hello there")).toBeInTheDocument();
    expect(
      screen.getByText(expectedTime(baseMessage.createdAt)),
    ).toBeInTheDocument();
  });

  it("labels the viewer's own message 'You'", () => {
    render(<ChatMessage message={baseMessage} isOwnMessage={true} />);

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Hello there")).toBeInTheDocument();
    expect(screen.queryByText("Asha")).not.toBeInTheDocument();
  });

  it("renders a bot message under the 'AI Assistant' label", async () => {
    const botMessage = {
      ...baseMessage,
      _id: "m2",
      content: "I can help with that",
      senderRole: "bot",
      sender: undefined,
    };
    render(<ChatMessage message={botMessage} isOwnMessage={false} />);

    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    // Bot content goes through react-markdown (now lazily loaded);
    // plain text survives as-is once the chunk resolves.
    expect(await screen.findByText("I can help with that")).toBeInTheDocument();
  });

  it("also treats isAiGenerated messages as bot messages", () => {
    const aiMessage = {
      ...baseMessage,
      _id: "m3",
      isAiGenerated: true,
      senderRole: "admin",
    };
    render(<ChatMessage message={aiMessage} isOwnMessage={false} />);

    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
  });

  it("renders a system message as a centered notice without a sender label", () => {
    const systemMessage = {
      ...baseMessage,
      _id: "m4",
      content: "Conversation assigned to support",
      senderRole: "system",
    };
    render(<ChatMessage message={systemMessage} isOwnMessage={false} />);

    expect(
      screen.getByText("Conversation assigned to support"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Asha")).not.toBeInTheDocument();
    expect(screen.queryByText("You")).not.toBeInTheDocument();
  });

  it("treats messageType 'system' as a system message regardless of senderRole", () => {
    const systemMessage = {
      ...baseMessage,
      _id: "m5",
      messageType: "system",
      content: "Chat ended",
    };
    render(<ChatMessage message={systemMessage} isOwnMessage={false} />);

    expect(screen.getByText("Chat ended")).toBeInTheDocument();
    expect(screen.queryByText("Asha")).not.toBeInTheDocument();
  });

  it("hides internal notes from the non-admin view", () => {
    const note = {
      ...baseMessage,
      _id: "m6",
      content: "Internal: check stock",
      isInternalNote: true,
    };
    const { container } = render(
      <ChatMessage message={note} isOwnMessage={false} isAdminView={false} />,
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText("Internal: check stock")).not.toBeInTheDocument();
  });

  it("shows internal notes in the admin view", () => {
    const note = {
      ...baseMessage,
      _id: "m7",
      content: "Internal: check stock",
      isInternalNote: true,
    };
    render(
      <ChatMessage message={note} isOwnMessage={false} isAdminView={true} />,
    );

    expect(screen.getByText("Internal: check stock")).toBeInTheDocument();
  });

  it("renders a valid file attachment and drops attachments missing fileUrl/fileName", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const withAttachments = {
      ...baseMessage,
      _id: "m8",
      content: "",
      attachments: [
        {
          // FE-03: chat attachments must be API-origin or Cloudinary —
          // the pre-FE-03 fixture used example.com, which the allowlist
          // now (deliberately) rejects to an inert placeholder.
          fileUrl: "https://res.cloudinary.com/demo/spec.pdf",
          fileName: "spec.pdf",
          fileType: "pdf",
          fileSize: 2048,
        },
        { fileUrl: "https://res.cloudinary.com/demo/broken.pdf" }, // no fileName -> filtered out
        null,
      ],
    };
    render(<ChatMessage message={withAttachments} isOwnMessage={false} />);

    expect(screen.getByText("spec.pdf")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /spec\.pdf/ })).toHaveAttribute(
      "href",
      "https://res.cloudinary.com/demo/spec.pdf",
    );
  });
});

describe("ChatMessage lazy markdown (FE-49)", () => {
  it("renders a user message's markdown-looking content as literal text, with no markdown output", async () => {
    const userMessage = {
      ...baseMessage,
      _id: "m9",
      content: "**not bold** [click](https://example.com/page)",
      senderRole: "user",
    };
    const { container } = render(
      <ChatMessage message={userMessage} isOwnMessage={false} />,
    );

    // The literal source is the rendered text; no markdown machinery
    // output (no <strong>, no <a>) may appear for user messages.
    expect(
      await screen.findByText("**not bold** [click](https://example.com/page)"),
    ).toBeInTheDocument();
    expect(container.querySelector("strong")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
  });

  it("shows a bot message as readable text first, then upgrades it to rendered markdown", async () => {
    const botMessage = {
      ...baseMessage,
      _id: "m10",
      content: "Here is **bold** help",
      senderRole: "bot",
      sender: undefined,
    };
    const { container } = render(
      <ChatMessage message={botMessage} isOwnMessage={false} />,
    );

    // Synchronously after render the bubble is never blank: either the
    // Suspense fallback's plain text or the rendered markdown is there.
    expect(container.textContent).toContain("bold");

    // The markdown-only artefact (<strong>) appears once the lazy
    // BotMarkdown chunk resolves.
    const strong = await screen.findByText("bold");
    expect(strong.tagName).toBe("STRONG");
    expect(container.querySelector("strong")).not.toBeNull();
  });
});
