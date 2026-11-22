// Batch 4 — the customer chat widget honours the Store
// Operations chat settings: disabled chat renders nothing (or the
// admin's offline panel when an offline message is set), and the
// greeting bubble uses the configured welcome message.
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const h = vi.hoisted(() => ({
  user: { _id: "user-1", role: "customer", firstName: "Test" },
}));

vi.mock("../../src/hooks/chat/useChatTan.js", () => ({
  useMyChats: () => ({ data: undefined }),
  useChatDetails: () => ({ data: undefined }),
  useStartChat: () => ({ isPending: false, mutate: vi.fn() }),
  useSendMessage: () => ({ mutate: vi.fn() }),
}));
vi.mock("../../src/store/authStore.js", () => ({
  default: () => ({ user: h.user }),
}));
vi.mock("../../src/utils/guestSessionStorage.js", () => ({
  getGuestSessionId: () => null,
  setGuestSessionId: vi.fn(),
  clearGuestSession: vi.fn(),
}));
vi.mock("../../src/components/chat/ChatWindow.jsx", () => ({
  default: () => <div data-testid="chat-window" />,
}));

import ChatWidget from "../../src/components/chat/ChatWidget.jsx";
import useSiteSettingsStore, {
  DEFAULT_SITE_SETTINGS,
} from "../../src/store/siteSettingsStore.js";

function setChat(chat) {
  const settings = structuredClone(DEFAULT_SITE_SETTINGS);
  settings.chat = { ...settings.chat, ...chat };
  useSiteSettingsStore.getState().setSettings(settings);
}

beforeEach(() => {
  useSiteSettingsStore.getState().resetSettings();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ChatWidget Batch 4 settings gate", () => {
  it("renders the launcher when chat is enabled (default)", () => {
    const { container } = render(<ChatWidget />);
    expect(container.querySelector("button")).not.toBeNull();
    expect(screen.queryByText("Offline")).not.toBeInTheDocument();
  });

  it("shows the configured welcome message in the greeting bubble", () => {
    setChat({ welcomeMessage: "Namaste! Welcome to our store." });
    render(<ChatWidget />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(
      screen.getByText("Namaste! Welcome to our store."),
    ).toBeInTheDocument();
  });

  it("keeps the built-in greeting when no welcome message is set", () => {
    render(<ChatWidget />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText(/Need help finding/)).toBeInTheDocument();
  });

  it("renders nothing when chat is disabled without an offline message", () => {
    setChat({ enabled: false, offlineMessage: "" });
    const { container } = render(<ChatWidget />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the offline panel (no composer) when disabled with a message", () => {
    setChat({
      enabled: false,
      offlineMessage: "We're away right now — please email us.",
      businessHours: "Sun – Fri: 10 AM – 6 PM",
    });
    const { container } = render(<ChatWidget />);
    expect(
      screen.getByText("We're away right now — please email us."),
    ).toBeInTheDocument();
    expect(screen.getByText("Sun – Fri: 10 AM – 6 PM")).toBeInTheDocument();
    expect(screen.getByText("Offline")).toBeInTheDocument();
    // Only the dismiss button — no launcher / composer surface.
    expect(container.querySelectorAll("button")).toHaveLength(1);
    // Dismiss hides the panel.
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(
      screen.queryByText("We're away right now — please email us."),
    ).not.toBeInTheDocument();
  });
});
