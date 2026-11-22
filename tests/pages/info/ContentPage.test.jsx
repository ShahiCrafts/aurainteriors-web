// ContentPage (Batch 3b — NEW routes /about, /privacy, /terms,
// /shipping, /returns): renders the admin's settings copy, or the
// coming-soon shell with the support email while the copy is empty.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../src/layouts/customer/Navbar", () => ({
  default: () => <div data-testid="navbar" />,
}));
vi.mock("../../../src/layouts/customer/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

import ContentPage from "../../../src/pages/info/ContentPage.jsx";
import useSiteSettingsStore, {
  DEFAULT_SITE_SETTINGS,
} from "../../../src/store/siteSettingsStore.js";

const PAGES = [
  { title: "About Us", settingsKey: "about", path: "/about" },
  { title: "Privacy Policy", settingsKey: "privacyPolicy", path: "/privacy" },
  { title: "Terms & Conditions", settingsKey: "terms", path: "/terms" },
  { title: "Shipping & Delivery", settingsKey: "shippingReturns", path: "/shipping" },
  { title: "Returns & Refunds", settingsKey: "shippingReturns", path: "/returns" },
];

beforeEach(() => {
  useSiteSettingsStore.getState().resetSettings();
});

describe("ContentPage", () => {
  it.each(PAGES)(
    "renders the empty-state shell for $path with the support email",
    ({ title, settingsKey, path }) => {
      render(
        <MemoryRouter>
          <ContentPage title={title} settingsKey={settingsKey} path={path} />
        </MemoryRouter>,
      );
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(title);
      expect(screen.getByText(/content is coming soon/)).toBeInTheDocument();
      const mail = screen.getByRole("link", {
        name: "support@aurainteriors.live",
      });
      expect(mail).toHaveAttribute("href", "mailto:support@aurainteriors.live");
    },
  );

  it("renders the admin's settings copy as paragraphs", () => {
    const edited = structuredClone(DEFAULT_SITE_SETTINGS);
    edited.pages.about = "First paragraph about the store.\n\nSecond paragraph with more detail.";
    useSiteSettingsStore.getState().setSettings(edited);
    render(
      <MemoryRouter>
        <ContentPage title="About Us" settingsKey="about" path="/about" />
      </MemoryRouter>,
    );
    expect(screen.getByText("First paragraph about the store.")).toBeInTheDocument();
    expect(
      screen.getByText("Second paragraph with more detail."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/)).not.toBeInTheDocument();
  });

  it("shipping and returns share the shippingReturns copy", () => {
    const edited = structuredClone(DEFAULT_SITE_SETTINGS);
    edited.pages.shippingReturns = "Delivery takes 5-7 business days.";
    useSiteSettingsStore.getState().setSettings(edited);
    render(
      <MemoryRouter>
        <ContentPage
          title="Returns & Refunds"
          settingsKey="shippingReturns"
          path="/returns"
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("Delivery takes 5-7 business days."),
    ).toBeInTheDocument();
  });
});
