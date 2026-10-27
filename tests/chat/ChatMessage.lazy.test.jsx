// FE-49: lazy-loading proof for the bot-markdown chunk.
//
// ChatMessage loads src/components/chat/BotMarkdown.jsx via
// React.lazy ONLY from its bot-message branch. This file mocks that
// module with a hoisted load flag so module loading itself is
// observable in jsdom (which the unmocked suite cannot see):
//   - rendering a user-only message must NOT evaluate BotMarkdown;
//   - rendering a bot message MUST load it (and render through it).
//
// ORDER MATTERS in this file: React.lazy caches the resolved module,
// so the user-only test must run before any bot render. Vitest runs
// tests in declaration order within a file.

import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => ({ botMarkdownLoaded: false }));

vi.mock("../../src/components/chat/BotMarkdown.jsx", async () => {
  hoisted.botMarkdownLoaded = true;
  const React = await import("react");
  return {
    default: ({ content }) =>
      React.createElement("div", { "data-testid": "bot-markdown" }, content),
  };
});

import ChatMessage from "../../src/components/chat/ChatMessage.jsx";

const baseMessage = {
  _id: "lazy1",
  content: "plain hello",
  senderRole: "user",
  sender: { firstName: "Asha", lastName: "Rai" },
  createdAt: "2026-01-01T10:30:00.000Z",
  attachments: [],
};

describe("ChatMessage lazy BotMarkdown loading (FE-49)", () => {
  it("does not load the BotMarkdown module for a user-only message", async () => {
    render(<ChatMessage message={baseMessage} isOwnMessage={false} />);

    expect(screen.getByText("plain hello")).toBeInTheDocument();
    // Give any (incorrect) lazy import a chance to fire, then check.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(hoisted.botMarkdownLoaded).toBe(false);
    expect(screen.queryByTestId("bot-markdown")).not.toBeInTheDocument();
  });

  it("loads the BotMarkdown module when a bot message renders", async () => {
    const botMessage = {
      ...baseMessage,
      _id: "lazy2",
      content: "bot hello",
      senderRole: "bot",
      sender: undefined,
    };
    render(<ChatMessage message={botMessage} isOwnMessage={false} />);

    expect(await screen.findByTestId("bot-markdown")).toBeInTheDocument();
    expect(screen.getByText("bot hello")).toBeInTheDocument();
    expect(hoisted.botMarkdownLoaded).toBe(true);
  });
});
