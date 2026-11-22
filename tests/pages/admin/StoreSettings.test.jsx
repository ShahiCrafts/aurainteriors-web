// Batch 3d — admin Store Settings page (redesigned to the
// reference Settings screens): unified header + pill tab bar,
// per-tab sticky Cancel / Save Changes bar (Cancel restores the
// last loaded snapshot), identity tab logo cards + live store
// preview + contact strip, theme tab previews, contact tab
// structured business hours composed into contact.hours on save,
// SEO preview + feature gates, Advanced reset + custom CSS.
// API layer is mocked.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../src/api/settingsApi.js", () => ({
  default: {
    getSettings: vi.fn(),
    updateSettingsSection: vi.fn(),
    uploadSettingsImage: vi.fn(),
    reindexKnowledge: vi.fn(),
    resetSettings: vi.fn(),
  },
}));

vi.mock("../../../src/api/integrationsApi.js", () => ({
  default: {
    getIntegrations: vi.fn(),
    deleteSecret: vi.fn(),
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
import integrationsApi from "../../../src/api/integrationsApi.js";
import StoreSettings from "../../../src/pages/admin/StoreSettings.jsx";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

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
    backgroundColor: "#f3f4f6",
    headerStyle: "light",
    darkMode: false,
    roundedCards: true,
    showShadows: true,
    customCss: "",
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
    businessHours: DAYS.map((day) => ({ day, open: false, hours: "" })),
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
    termsOfService: "",
    shippingInfo: "",
    returnsRefunds: "",
    faq: [
      {
        question: "How do I place an order?",
        answer: "Browse and add to cart.",
      },
    ],
  },
  seo: {
    siteUrl: "https://www.aurainteriors.live",
    defaultTitle: "{store_name} – Redefine Your Space",
    metaDescription: "Meta description",
    ogImage: "https://www.aurainteriors.live/promo-ad-banner.webp",
    features: {
      productSchema: true,
      breadcrumbs: true,
      openGraph: true,
      twitterCards: true,
      autoGenerateMeta: true,
    },
    canonicalUrl: "",
    defaultLanguage: "en-NP",
    indexingEnabled: true,
    noindexPages: [],
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
  settingsApi.resetSettings.mockResolvedValue({
    status: "success",
    data: { settings: SETTINGS },
  });
  integrationsApi.getIntegrations.mockResolvedValue({
    status: "success",
    data: { config: {}, secrets: [] },
  });
  render(
    <MemoryRouter>
      <StoreSettings />
    </MemoryRouter>,
  );
  await screen.findByLabelText("Store name");
}

const saveButton = () =>
  screen.getByRole("button", { name: "Save Changes" });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("StoreSettings page (Batch 3d redesign)", () => {
  it("renders the unified tab bar and the identity fields from settings", async () => {
    await renderPage();
    for (const tab of [
      "Store Identity",
      "Theme & Branding",
      "Contact & Social",
      "Homepage",
      "SEO",
      "Content Pages",
      "Advanced",
    ]) {
      expect(screen.getByRole("tab", { name: tab })).toBeTruthy();
    }
    expect(screen.getByRole("tab", { name: "Integrations" })).toBeTruthy();
    expect(screen.getByLabelText("Store name").value).toBe(
      "Aura Interiors",
    );
    expect(screen.getByLabelText("Tagline").value).toBe(
      "Redefine Your Space",
    );
    expect(screen.getByLabelText("Logo URL").value).toBe(
      "/logo-aura-interiors.webp",
    );
  });

  it("identity preview reflects the typed tagline before saving", async () => {
    await renderPage();
    const preview = screen.getByTestId("store-preview");
    expect(preview.textContent).toContain("Redefine Your Space");
    fireEvent.change(screen.getByLabelText("Tagline"), {
      target: { value: "Furniture, Reimagined" },
    });
    expect(preview.textContent).toContain("Furniture, Reimagined");
    expect(settingsApi.updateSettingsSection).not.toHaveBeenCalled();
  });

  it("identity save PUTs the identity section with edited values", async () => {
    await renderPage();
    fireEvent.change(screen.getByLabelText("Store name"), {
      target: { value: "New Store Name" },
    });
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "identity",
        expect.objectContaining({ storeName: "New Store Name" }),
      ),
    );
  });

  it("identity tab also saves contact when the information strip is edited", async () => {
    await renderPage();
    fireEvent.change(screen.getByLabelText("Phone"), {
      target: { value: "+977 9800000000" },
    });
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "contact",
        expect.objectContaining({ phone: "+977 9800000000" }),
      ),
    );
  });

  it("Cancel restores the tab fields to the last loaded values", async () => {
    await renderPage();
    const nameInput = screen.getByLabelText("Store name");
    fireEvent.change(nameInput, { target: { value: "Changed Name" } });
    expect(nameInput.value).toBe("Changed Name");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByLabelText("Store name").value).toBe(
      "Aura Interiors",
    );
    expect(settingsApi.updateSettingsSection).not.toHaveBeenCalled();
  });

  it("logo remove clears the URL; upload fills it via the settings image endpoint", async () => {
    settingsApi.uploadSettingsImage.mockResolvedValue({
      status: "success",
      data: { url: "https://cdn.example/new-logo.webp" },
    });
    await renderPage();
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Logo Upload (Light Mode)" }),
    );
    expect(screen.getByLabelText("Logo URL").value).toBe("");
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

  it("theme preview reflects the unsaved primary colour and saves it", async () => {
    await renderPage();
    fireEvent.click(
      screen.getByRole("tab", { name: "Theme & Branding" }),
    );
    const previewButton = screen.getByTestId("preview-primary-button");
    expect(previewButton.style.backgroundColor).toBe("rgb(242, 115, 24)");
    fireEvent.change(screen.getByLabelText("Primary Colour hex"), {
      target: { value: "#123456" },
    });
    expect(previewButton.style.backgroundColor).toBe("rgb(18, 52, 86)");
    expect(settingsApi.updateSettingsSection).not.toHaveBeenCalled();
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "theme",
        expect.objectContaining({ primaryColor: "#123456" }),
      ),
    );
  });

  it("theme customizer toggles save into theme (dark mode, header style)", async () => {
    await renderPage();
    fireEvent.click(
      screen.getByRole("tab", { name: "Theme & Branding" }),
    );
    fireEvent.click(
      screen.getByRole("switch", { name: "Enable Dark Mode" }),
    );
    fireEvent.click(
      screen.getByRole("radio", { name: "Header style Navy" }),
    );
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "theme",
        expect.objectContaining({ darkMode: true, headerStyle: "navy" }),
      ),
    );
  });

  it("contact save PUTs socials including twitter and linkedin", async () => {
    await renderPage();
    fireEvent.click(
      screen.getByRole("tab", { name: "Contact & Social" }),
    );
    fireEvent.change(screen.getByLabelText("Facebook URL"), {
      target: { value: "https://facebook.com/aura" },
    });
    fireEvent.change(screen.getByLabelText("Twitter / X URL"), {
      target: { value: "https://x.com/aura" },
    });
    fireEvent.click(saveButton());
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

  it("contact save composes contact.hours from the structured business hours", async () => {
    await renderPage();
    fireEvent.click(
      screen.getByRole("tab", { name: "Contact & Social" }),
    );
    fireEvent.click(
      screen.getByRole("switch", { name: "Monday open" }),
    );
    fireEvent.change(screen.getByLabelText("Monday hours"), {
      target: { value: "9:00 AM - 6:00 PM" },
    });
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "contact",
        expect.objectContaining({
          hours: "Mon: 9:00 AM - 6:00 PM · Tue - Sun: Closed",
          businessHours: expect.arrayContaining([
            expect.objectContaining({
              day: "Monday",
              open: true,
              hours: "9:00 AM - 6:00 PM",
            }),
          ]),
        }),
      ),
    );
  });

  it("homepage slides: add, reorder and remove update the saved payload", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Homepage" }));
    expect(screen.getAllByLabelText(/Slide \d+ headline/)).toHaveLength(2);

    fireEvent.click(
      screen.getByRole("button", { name: "Move slide 2 up" }),
    );
    expect(screen.getByLabelText("Slide 1 headline").value).toBe(
      "Second headline",
    );

    fireEvent.click(screen.getByRole("button", { name: "Add slide" }));
    expect(screen.getAllByLabelText(/Slide \d+ headline/)).toHaveLength(3);
    fireEvent.change(screen.getByLabelText("Slide 3 headline"), {
      target: { value: "Third headline" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Remove slide 1" }),
    );
    expect(screen.getAllByLabelText(/Slide \d+ headline/)).toHaveLength(2);
    expect(screen.getByLabelText("Slide 1 headline").value).toBe(
      "First headline",
    );

    fireEvent.click(saveButton());
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
    fireEvent.click(saveButton());
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
    fireEvent.click(saveButton());
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

  it("SEO preview substitutes the store name and the meta count updates live", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "SEO" }));
    expect(
      screen.getByText("Aura Interiors – Redefine Your Space"),
    ).toBeTruthy();
    expect(screen.getByText("16/160")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Meta description"), {
      target: { value: "Short" },
    });
    expect(screen.getByText("5/160")).toBeTruthy();
  });

  it("SEO feature toggles and noindex pages save into seo", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "SEO" }));
    fireEvent.click(
      screen.getByRole("switch", { name: "Enable Open Graph Tags" }),
    );
    fireEvent.click(screen.getByLabelText("Noindex Cart"));
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "seo",
        expect.objectContaining({
          features: expect.objectContaining({ openGraph: false }),
          noindexPages: ["cart"],
        }),
      ),
    );
  });

  it("SEO tab saves the title pattern and points analytics to Integrations", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "SEO" }));
    expect(
      screen.getByRole("link", { name: /Analytics & Marketing/ }),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Default title pattern"), {
      target: { value: "New title pattern" },
    });
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "seo",
        expect.objectContaining({ defaultTitle: "New title pattern" }),
      ),
    );
  });

  it("Advanced: per-section reset calls the reset endpoint after confirm", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Advanced" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset SEO" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, reset" }));
    await waitFor(() =>
      expect(settingsApi.resetSettings).toHaveBeenCalledWith("seo"),
    );
  });

  it("Advanced: custom CSS saves into theme.customCss", async () => {
    await renderPage();
    fireEvent.click(screen.getByRole("tab", { name: "Advanced" }));
    fireEvent.change(screen.getByLabelText("Custom CSS"), {
      target: { value: ".foo { color: red; }" },
    });
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith(
        "theme",
        expect.objectContaining({ customCss: ".foo { color: red; }" }),
      ),
    );
  });

  it("Advanced: handover wipe deletes only admin-saved secrets", async () => {
    await renderPage();
    // AdvancedTab fetches the secret list when it mounts (on tab
    // switch), so set the payload after the initial page load.
    integrationsApi.getIntegrations.mockResolvedValue({
      status: "success",
      data: {
        config: {},
        secrets: [
          { service: "ai.groq", source: "admin", configured: true },
          { service: "email.brevo", source: "env", configured: true },
        ],
      },
    });
    integrationsApi.deleteSecret.mockResolvedValue({
      status: "success",
      data: {},
    });
    fireEvent.click(screen.getByRole("tab", { name: "Advanced" }));
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Remove all saved API keys",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Yes, remove all" }),
    );
    await waitFor(() =>
      expect(integrationsApi.deleteSecret).toHaveBeenCalledWith("ai.groq"),
    );
    expect(integrationsApi.deleteSecret).toHaveBeenCalledTimes(1);
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
