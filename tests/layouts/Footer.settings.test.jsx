// Footer (Batch 3b): contact block, identity and socials read from
// site settings; the defaults are the values the footer has always
// rendered, and admin edits flow through.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../src/components/sections/BrandMarquee.jsx", () => ({
  default: () => null,
}));

import Footer from "../../src/layouts/customer/Footer";
import useSiteSettingsStore, {
  DEFAULT_SITE_SETTINGS,
} from "../../src/store/siteSettingsStore.js";

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );

beforeEach(() => {
  useSiteSettingsStore.getState().resetSettings();
});

describe("footer with site settings", () => {
  it("renders the current contact values and '#' socials from defaults", () => {
    renderFooter();
    expect(screen.getByText("+977 9866291003")).toBeInTheDocument();
    expect(screen.getByText("support@aurainteriors.live")).toBeInTheDocument();
    expect(screen.getByText("Hattiban, Lalitpur, Nepal")).toBeInTheDocument();
    expect(screen.getByLabelText("Facebook")).toHaveAttribute("href", "#");
    expect(screen.getByAltText("Aura Interiors")).toHaveAttribute(
      "src",
      "/logo-aura-interiors.webp",
    );
    expect(screen.queryByText(/Opening hours/)).not.toBeInTheDocument();
  });

  it("renders an admin-changed phone, address, hours and social URL", () => {
    const edited = structuredClone(DEFAULT_SITE_SETTINGS);
    edited.contact.phone = "+977 9811111111";
    edited.contact.address = "Thamel, Kathmandu, Nepal";
    edited.contact.hours = "Sun–Fri, 10am–7pm";
    edited.contact.socials.facebook = "https://facebook.com/example";
    edited.identity.storeName = "Himalaya Living";
    // The Batch 3a upload pipeline returns Cloudinary URLs — the host
    // the FE-03 media validator allowlists.
    edited.identity.logoUrl = "https://res.cloudinary.com/demo/logo.webp";
    useSiteSettingsStore.getState().setSettings(edited);
    renderFooter();
    expect(screen.getByText("+977 9811111111")).toBeInTheDocument();
    expect(screen.queryByText("+977 9866291003")).not.toBeInTheDocument();
    expect(screen.getByText("Thamel, Kathmandu, Nepal")).toBeInTheDocument();
    expect(screen.getByText("Sun–Fri, 10am–7pm")).toBeInTheDocument();
    expect(screen.getByLabelText("Facebook")).toHaveAttribute(
      "href",
      "https://facebook.com/example",
    );
    expect(screen.getByAltText("Himalaya Living")).toHaveAttribute(
      "src",
      "https://res.cloudinary.com/demo/logo.webp",
    );
  });

  it("hides the newsletter banner when the admin disables it", () => {
    const edited = structuredClone(DEFAULT_SITE_SETTINGS);
    edited.homepage.newsletterEnabled = false;
    useSiteSettingsStore.getState().setSettings(edited);
    renderFooter();
    expect(screen.queryByText(/Join the/)).not.toBeInTheDocument();
    // The rest of the footer is unaffected.
    expect(screen.getByText("+977 9866291003")).toBeInTheDocument();
  });
});
