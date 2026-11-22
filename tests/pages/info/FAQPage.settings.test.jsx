// FAQ page (Batch 3b): falls back to the categorized faqData until
// settings load; loaded-but-default settings keep the categorized
// rendering (the defaults ARE faqData flattened); an admin-edited FAQ
// renders as one flat group in the same accordion style.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../src/layouts/customer/Navbar", () => ({
  default: () => <div data-testid="navbar" />,
}));
vi.mock("../../../src/layouts/customer/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

import FAQPage from "../../../src/pages/info/FAQPage.jsx";
import { faqGroupsFromSettings } from "../../../src/utils/faqGroups.js";
import { faqData } from "../../../src/data/faqData.js";
import useSiteSettingsStore, {
  DEFAULT_SITE_SETTINGS,
} from "../../../src/store/siteSettingsStore.js";

beforeEach(() => {
  useSiteSettingsStore.getState().resetSettings();
});

describe("FAQPage with site settings", () => {
  it("renders the categorized fallback before settings load", () => {
    render(
      <MemoryRouter>
        <FAQPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Ordering")).toBeInTheDocument();
    expect(screen.getByText("Shipping & Delivery")).toBeInTheDocument();
    expect(screen.getByText("How do I place an order?")).toBeInTheDocument();
  });

  it("keeps the categorized rendering when loaded settings equal the defaults", () => {
    useSiteSettingsStore
      .getState()
      .setSettings(structuredClone(DEFAULT_SITE_SETTINGS), true);
    render(
      <MemoryRouter>
        <FAQPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("Ordering")).toBeInTheDocument();
    expect(screen.getByText("AR Features")).toBeInTheDocument();
    expect(screen.queryByText("General")).not.toBeInTheDocument();
  });

  it("renders an admin-edited FAQ as a single flat group", () => {
    const edited = structuredClone(DEFAULT_SITE_SETTINGS);
    edited.pages.faq = [
      { question: "Do you deliver to Pokhara?", answer: "Yes, weekly." },
      { question: "Can I pay by eSewa?", answer: "Yes, at checkout." },
    ];
    useSiteSettingsStore.getState().setSettings(edited, true);
    render(
      <MemoryRouter>
        <FAQPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Do you deliver to Pokhara?")).toBeInTheDocument();
    expect(screen.getByText("Can I pay by eSewa?")).toBeInTheDocument();
    expect(screen.queryByText("Ordering")).not.toBeInTheDocument();
  });

  it("faqGroupsFromSettings returns faqData for unloaded/empty input", () => {
    expect(faqGroupsFromSettings([], false)).toBe(faqData);
    expect(faqGroupsFromSettings(null, true)).toBe(faqData);
    expect(
      faqGroupsFromSettings(DEFAULT_SITE_SETTINGS.pages.faq, true),
    ).toBe(faqData);
  });
});
