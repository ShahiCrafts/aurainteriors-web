// Batch 3a — admin Store Settings page: renders the six tabs, saves
// go to PUT /admin/settings/:section with the edited section payload,
// the theme preview reflects UNSAVED values, hero slides and FAQ rows
// can be added/removed/reordered, and image uploads use the existing
// settings image endpoint (mocked here). API layer is mocked.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../src/api/settingsApi.js", () => ({
  default: {
    getSettings: vi.fn(),
    updateSettingsSection: vi.fn(),
    uploadSettingsImage: vi.fn(),
    reindexKnowledge: vi.fn(),
  },
}));

vi.mock("../../../src/lib/toast", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

import settingsApi from "../../../src/api/settingsApi.js";
import StoreSettings from "../../../src/pages/admin/StoreSettings.jsx";

const SETTINGS = {
  identity: {
    storeName: "Aura Interiors",
    tagline: "Redefine Your Space",
    supportEmail: "support@aurainteriors.live",
    logoUrl: "/logo-aura-interiors.webp",
    logoDarkUrl: "",
    faviconUrl: "/favicon.png",
  },
  theme: {
    primaryColor: "#F27318",
    primaryHoverColor: "#D9620E",
    navyColor: "#1E2C4A",
    fontFamily: "DM Sans",
    buttonRadius: "rounded",
  },
  contact: {
    email: "support@aurainteriors.live",
    phone: "+977 9866291003",
    address: "Hattiban, Lalitpur, Nepal",
    hours: "",
    mapUrl: "",
    socials: {
      facebook: "",
      instagram: "",
      youtube: "",
      pinterest: "",
      tiktok: "",
      whatsapp: "",
      twitter: "",
      linkedin: "",
    },
  },
  homepage: {
    sections: {
      hero: true,
      trustBanner: true,
      shopByCategory: true,
      featuredPieces: true,
      testimonials: true,
    },
    sectionsOrder: [
      "hero",
      "trustBanner",
      "shopByCategory",
      "featuredPieces",
      "testimonials",
    ],
    heroSlides: [
      {
        imageUrl: "/img/one.webp",
        headline: "First headline",
        subtext: "First subtext",
        buttonText: "Explore Now",
        buttonLink: "/shop?categories=living-room",
        enabled: true,
      },
      {
        imageUrl: "/img/two.webp",
        headline: "Second headline",
        subtext: "Second subtext",
        buttonText: "Shop Beds",
        buttonLink: "/shop?categories=bedroom",
        enabled: true,
      },
    ],
    promoBanner: {
      imageUrl: "/img/promo.webp",
      headline: "Calmora Bed Frame",
      subtext: "Promo subtext",
      buttonText: "Shop Sale",
      buttonLink: "/shop?categories=bedroom",
      enabled: true,
    },
    announcementsEnabled: true,
    newsletterEnabled: true,
  },
  pages: {
    about: "",
    privacyPolicy: "",
    terms: "",
    shippingReturns: "",
    faq: [{ question: "How do I place an order?", answer: "Browse and add to cart." }],
  },
  seo: {
    defaultTitle: "Aura Interiors – Redefine Your Space",
    metaDescription: "Meta description",
    ogImage: "https://www.aurainteriors.live/promo-ad-banner.webp",
  },
};

async function renderPage() {
  settingsApi.getSettings.mockResolvedValue({
    status: "success",
    data: { settings: SETTINGS },
  });
  settingsApi.updateSettingsSection.mockResolvedValue({
    status: "success",
    data: {},
  });
  render(
    <MemoryRouter>
      <StoreSettings />
    </MemoryRouter>,
  );
  await screen.findByLabelText("Store name");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("StoreSettings page", () => {
  it("renders all six tabs and the identity fields from settings", async () => {
    await renderPage();
    for (const tab of [
      "Identity",
      "Theme",
      "Contact & Socials",
      "Homepage",
      "Content Pages",
      "SEO",
    ]) {
      expect(screen.getByRole("tab", { name: tab })).toBeTruthy();
    }
    expect(screen.getByLabelText("Store name").value).toBe("Aura Interiors");
    expect(screen.getByLabelText("Support email").value).toBe(
      "support@aurainteriors.live",
    );
    expect(screen.getByLabelText("Logo URL").value).toBe(
      "/logo-aura-interiors.webp",
    );
  });

  it("identity save PUTs the identity section with edited values", async () => {
    await renderPage();
    fireEvent.change(screen.getByLabelText("Store name"), {
      target: { value: "New Store Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save identity" }));
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "identity",
        expect.objectContaining({ storeName: "New Store Name" }),
      ),
    );
  });

  it("theme preview reflects the unsaved primary colour", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Theme" }));
    const previewButton = screen.getByTestId("preview-primary-button");
    expect(previewButton.style.backgroundColor).toBe("rgb(242, 115, 24)");
    fireEvent.change(screen.getByLabelText("Primary colour hex"), {
      target: { value: "#123456" },
    });
    expect(previewButton.style.backgroundColor).toBe("rgb(18, 52, 86)");
    // Nothing saved yet.
    expect(settingsApi.updateSettingsSection).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Save theme" }));
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "theme",
        expect.objectContaining({ primaryColor: "#123456" }),
      ),
    );
  });

  it("contact save PUTs socials including twitter and linkedin", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Contact & Socials" }));
    fireEvent.change(screen.getByLabelText("Facebook URL"), {
      target: { value: "https://facebook.com/aura" },
    });
    fireEvent.change(screen.getByLabelText("Twitter / X URL"), {
      target: { value: "https://x.com/aura" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save contact & socials" }),
    );
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "contact",
        expect.objectContaining({
          socials: expect.objectContaining({
            facebook: "https://facebook.com/aura",
            twitter: "https://x.com/aura",
          }),
        }),
      ),
    );
  });

  it("homepage slides: add, reorder and remove update the saved payload", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Homepage" }));
    expect(screen.getAllByLabelText(/Slide \d+ headline/)).toHaveLength(2);

    // Reorder: slide 2 moves above slide 1.
    fireEvent.click(
      screen.getByRole("button", { name: "Move slide 2 up" }),
    );
    expect(screen.getByLabelText("Slide 1 headline").value).toBe(
      "Second headline",
    );

    // Add a slide, fill it in.
    fireEvent.click(screen.getByRole("button", { name: "Add slide" }));
    expect(screen.getAllByLabelText(/Slide \d+ headline/)).toHaveLength(3);
    fireEvent.change(screen.getByLabelText("Slide 3 headline"), {
      target: { value: "Third headline" },
    });

    // Remove the (new) first slide.
    fireEvent.click(
      screen.getByRole("button", { name: "Remove slide 1" }),
    );
    expect(screen.getAllByLabelText(/Slide \d+ headline/)).toHaveLength(2);
    expect(screen.getByLabelText("Slide 1 headline").value).toBe(
      "First headline",
    );

    fireEvent.click(screen.getByRole("button", { name: "Save homepage" }));
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "homepage",
        expect.objectContaining({
          heroSlides: [
            expect.objectContaining({ headline: "First headline" }),
            expect.objectContaining({ headline: "Third headline" }),
          ],
        }),
      ),
    );
  });

  it("homepage section order can be reordered and saved", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Homepage" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Move section testimonials up" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save homepage" }));
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "homepage",
        expect.objectContaining({
          sectionsOrder: [
            "hero",
            "trustBanner",
            "shopByCategory",
            "testimonials",
            "featuredPieces",
          ],
        }),
      ),
    );
  });

  it("content pages: FAQ rows can be added and saved", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Content Pages" }));
    expect(screen.getAllByLabelText(/FAQ question \d+/)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Add FAQ" }));
    expect(screen.getAllByLabelText(/FAQ question \d+/)).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("FAQ question 2"), {
      target: { value: "Do you deliver to Pokhara?" },
    });
    fireEvent.change(screen.getByLabelText("FAQ answer 2"), {
      target: { value: "Yes, we deliver across Nepal." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save content pages" }),
    );
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "pages",
        expect.objectContaining({
          faq: [
            expect.objectContaining({
              question: "How do I place an order?",
            }),
            {
              question: "Do you deliver to Pokhara?",
              answer: "Yes, we deliver across Nepal.",
            },
          ],
        }),
      ),
    );
  });

  it("logo upload uses the existing settings image endpoint and fills the URL", async () => {
    settingsApi.uploadSettingsImage.mockResolvedValue({
      status: "success",
      data: { url: "https://cdn.example/new-logo.webp" },
    });
    await renderPage();
    const file = new File(["fake"], "logo.webp", { type: "image/webp" });
    fireEvent.change(screen.getByLabelText("Upload Logo URL"), {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(screen.getByLabelText("Logo URL").value).toBe(
        "https://cdn.example/new-logo.webp",
      ),
    );
    expect(settingsApi.uploadSettingsImage).toHaveBeenCalledWith(file);
  });

  it("SEO tab saves title/description/OG and points analytics to Integrations", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "SEO" }));
    expect(
      screen.getByRole("link", { name: /Integrations/ }),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Default page title"), {
      target: { value: "New title pattern" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save SEO" }));
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "seo",
        expect.objectContaining({ defaultTitle: "New title pattern" }),
      ),
    );
  });

  it("shows an error state when the initial load fails", async () => {
    settingsApi.getSettings.mockRejectedValue(new Error("Server down"));
    render(
      <MemoryRouter>
        <StoreSettings />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Server down/)).toBeTruthy();
  });
});
