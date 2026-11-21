// Batch 2 — admin Integrations page: renders all 8 sections + six AI
// provider cards from the Batch 1 API contract, secret inputs stay
// empty, AI config saves go to PUT /admin/settings/integrations and
// analytics saves to PUT /admin/settings/seo. API layer is mocked.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../../../src/api/integrationsApi.js", () => ({
  default: {
    getIntegrations: vi.fn(),
    getSettings: vi.fn(),
    updateSettingsSection: vi.fn(),
    saveSecret: vi.fn(),
    deleteSecret: vi.fn(),
    testSecret: vi.fn(),
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

import integrationsApi from "../../../src/api/integrationsApi.js";
import Integrations from "../../../src/pages/admin/Integrations.jsx";

const CONFIG = {
  ai: {
    fallbackOrder: ["openai", "groq"],
    providers: {
      groq: { enabled: true, model: "llama-3.3-70b", baseUrl: "" },
      mistral: { enabled: false, model: "", baseUrl: "" },
      openrouter: { enabled: false, model: "", baseUrl: "" },
      gemini: { enabled: false, model: "", baseUrl: "" },
      openai: { enabled: true, model: "gpt-4o-mini", baseUrl: "" },
      anthropic: { enabled: false, model: "", baseUrl: "" },
    },
    featureProviders: {
      chat: "",
      insights: "",
      productDescriptions: "",
      knowledgeBase: "",
    },
    chat: { temperature: 0.7, maxTokens: 1024 },
  },
  embeddings: { provider: "nvidia", model: "nvidia/nv-embedqa" },
  qdrant: { url: "https://qdrant.example" },
  cloudinary: { cloudName: "aura", apiKey: "123" },
  google: { clientId: "abc.apps.googleusercontent.com" },
  brevo: { baseUrl: "https://api.brevo.com/v3" },
  esewa: { merchantId: "EPAYTEST", environment: "sandbox" },
  khalti: { publicKey: "test_public_key" },
  sms: { provider: "", senderId: "" },
  push: { senderId: "" },
};

const SECRETS = [
  {
    service: "ai.groq",
    configured: true,
    source: "admin",
    masked: "••••ab12",
    lastTestedAt: null,
    lastTestStatus: null,
  },
  {
    service: "email.brevo",
    configured: true,
    source: "env",
    masked: "••••xy34",
    lastTestedAt: null,
    lastTestStatus: null,
  },
];

const SETTINGS = {
  seo: {
    googleAnalyticsId: "",
    metaPixelId: "",
    tiktokPixelId: "",
    searchConsoleVerification: "",
  },
};

async function renderPage() {
  integrationsApi.getIntegrations.mockResolvedValue({
    status: "success",
    data: { config: CONFIG, secrets: SECRETS },
  });
  integrationsApi.getSettings.mockResolvedValue({
    status: "success",
    data: { settings: SETTINGS },
  });
  integrationsApi.updateSettingsSection.mockResolvedValue({
    status: "success",
    data: {},
  });
  render(<Integrations />);
  await screen.findByRole("heading", { name: "AI Providers" });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Admin Integrations page", () => {
  it("(a) renders all 8 section cards and six provider cards", async () => {
    await renderPage();
    for (const title of [
      "AI Providers",
      "AI Search & Knowledge Base",
      "Google Sign-in",
      "Email (Brevo)",
      "Media (Cloudinary)",
      "Payments",
      "SMS & Push",
      "Analytics & Marketing",
    ]) {
      expect(
        screen.getByRole("heading", { name: title }),
      ).toBeInTheDocument();
    }
    for (const name of [
      "Groq",
      "Mistral",
      "OpenRouter",
      "Gemini",
      "OpenAI",
      "Anthropic (Claude)",
    ]) {
      expect(
        screen.getByRole("heading", { name }),
      ).toBeInTheDocument();
    }
    // Config values are bound into the form.
    expect(screen.getByLabelText("Groq model")).toHaveValue("llama-3.3-70b");
    expect(screen.getByLabelText("Google client ID")).toHaveValue(
      "abc.apps.googleusercontent.com",
    );
    expect(screen.getByLabelText("Google redirect URI")).toHaveValue(
      "https://api.aurainteriors.live/api/v1/auth/google/callback",
    );
    expect(
      screen.getByText(
        "Changes take effect the next time the server restarts.",
      ),
    ).toBeInTheDocument();
  });

  it("(b) secret inputs render empty with source/masked status text", async () => {
    await renderPage();
    expect(screen.getByLabelText("Groq API key")).toHaveValue("");
    expect(screen.getByText(/Set in admin ••••ab12/)).toBeInTheDocument();
    expect(screen.getByLabelText("Brevo API key")).toHaveValue("");
    expect(
      screen.getByText(/From server config ••••xy34/),
    ).toBeInTheDocument();
    // A service with no describe at all reads as not set.
    expect(screen.getByLabelText("OpenAI API key")).toHaveValue("");
  });

  it("(g) saving AI config PUTs fallbackOrder + featureProviders edits", async () => {
    await renderPage();
    // Reorder: move groq above openai in the fallback list.
    fireEvent.click(screen.getByRole("button", { name: "Move groq up" }));
    // Assign the support-chat feature to Groq.
    fireEvent.change(screen.getByLabelText("Support chat"), {
      target: { value: "groq" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save AI settings" }));
    await waitFor(() =>
      expect(integrationsApi.updateSettingsSection).toHaveBeenCalledWith(
        "integrations",
        expect.objectContaining({
          ai: expect.objectContaining({
            fallbackOrder: ["groq", "openai"],
            featureProviders: expect.objectContaining({ chat: "groq" }),
          }),
        }),
      ),
    );
  });

  it("(h) analytics save PUTs the seo section", async () => {
    await renderPage();
    fireEvent.change(screen.getByLabelText("Google Analytics ID"), {
      target: { value: "G-TEST12345" },
    });
    fireEvent.change(screen.getByLabelText("Meta Pixel ID"), {
      target: { value: "987654321" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save analytics settings" }),
    );
    await waitFor(() =>
      expect(integrationsApi.updateSettingsSection).toHaveBeenCalledWith(
        "seo",
        expect.objectContaining({
          googleAnalyticsId: "G-TEST12345",
          metaPixelId: "987654321",
        }),
      ),
    );
  });

  it("shows an error state when the initial load fails", async () => {
    integrationsApi.getIntegrations.mockRejectedValue(
      new Error("Server down"),
    );
    integrationsApi.getSettings.mockResolvedValue({
      status: "success",
      data: { settings: SETTINGS },
    });
    render(<Integrations />);
    expect(await screen.findByText("Server down")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry" }),
    ).toBeInTheDocument();
  });
});
