import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const h = vi.hoisted(() => ({ user: { _id: "m1", role: "manager" } }));
vi.mock("../../../src/store/authStore.js", () => {
  const store = (sel) => (typeof sel === "function" ? sel({ user: h.user }) : { user: h.user });
  store.getState = () => ({ user: h.user });
  return { default: store };
});
vi.mock("../../../src/api/settingsApi.js", () => ({ default: { getSettings: vi.fn(), updateSettingsSection: vi.fn(), uploadSettingsImage: vi.fn(), reindexKnowledge: vi.fn(), resetSettings: vi.fn(), sendTestEmail: vi.fn() } }));
vi.mock("../../../src/api/integrationsApi.js", () => ({ default: { getIntegrations: vi.fn(), deleteSecret: vi.fn() } }));
vi.mock("../../../src/lib/toast", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }) }));

import settingsApi from "../../../src/api/settingsApi.js";
import integrationsApi from "../../../src/api/integrationsApi.js";
import StoreSettings from "../../../src/pages/admin/StoreSettings.jsx";

beforeEach(() => {
  vi.clearAllMocks();
  settingsApi.getSettings.mockResolvedValue({ status: "success", data: { settings: {} } });
  integrationsApi.getIntegrations.mockResolvedValue({ status: "success", data: { config: {}, secrets: [] } });
});

describe("StoreSettings manager gating", () => {
  it("Advanced tab is absent for manager", async () => {
    render(<MemoryRouter><StoreSettings /></MemoryRouter>);
    await screen.findByLabelText("Store name");
    expect(screen.queryByRole("tab", { name: "Advanced" })).toBeNull();
    expect(screen.getByRole("tab", { name: "Store Identity" })).toBeTruthy();
  });
});
