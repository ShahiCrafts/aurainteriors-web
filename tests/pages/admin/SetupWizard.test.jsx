import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const h = vi.hoisted(() => ({ user: { _id: "a1", role: "admin" } }));
vi.mock("../../../src/store/authStore.js", () => {
  const store = (sel) => (typeof sel === "function" ? sel({ user: h.user }) : { user: h.user });
  store.getState = () => ({ user: h.user });
  return { default: store };
});
vi.mock("../../../src/api/handoverApi.js", () => ({ default: { getStatus: vi.fn(), wipeDemo: vi.fn() } }));
vi.mock("../../../src/api/settingsApi.js", () => ({ default: { updateSettingsSection: vi.fn(), getSettings: vi.fn() } }));
vi.mock("../../../src/lib/toast", () => ({ toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }) }));

import handoverApi from "../../../src/api/handoverApi.js";
import settingsApi from "../../../src/api/settingsApi.js";
import SetupWizard from "../../../src/pages/admin/SetupWizard.jsx";

const STATUS = {
  keys: { adminSet: 2, envOnly: 1, missing: 1 },
  demoProducts: 5, totalProducts: 20, realProducts: 15,
  identity: { storeNameSet: true, logoSet: false },
  contact: { phone: "123", email: "a@b.c", address: "" },
  payments: { esewaConfigured: false },
  shippingZonesEnabled: 2, maintenanceEnabled: false, hasAdminUsers: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  handoverApi.getStatus.mockResolvedValue({ data: STATUS });
  handoverApi.wipeDemo.mockResolvedValue({ data: { deleted: 5 } });
  settingsApi.updateSettingsSection.mockResolvedValue({ data: {} });
});

const renderPage = () => render(<MemoryRouter><SetupWizard /></MemoryRouter>);

describe("SetupWizard", () => {
  it("renders 8 steps with correct done/pending states and progress", async () => {
    renderPage();
    expect(await screen.findByText("3 of 8 complete")).toBeTruthy();
    for (const t of ["Remove the seller's API keys", "Add your own API keys", "Delete the demo products", "Brand the store", "Add contact details & socials", "Configure payments (eSewa)", "Set up shipping zones", "Go live"]) {
      expect(screen.getByText(t)).toBeTruthy();
    }
    expect(screen.getByText(/2 key\(s\) still saved/)).toBeTruthy();
    expect(screen.getByText(/1 service\(s\) have no key yet/)).toBeTruthy();
    expect(screen.getByText(/5 demo of 20 products/)).toBeTruthy();
  });

  it("wipe flow: confirm -> wipeDemo('WIPE') -> status refetched", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /Wipe demo products/ }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, wipe" }));
    await waitFor(() => expect(handoverApi.wipeDemo).toHaveBeenCalledWith("WIPE"));
    await waitFor(() => expect(handoverApi.getStatus).toHaveBeenCalledTimes(2));
  });

  it("maintenance toggle calls updateSettingsSection('maintenance', {enabled:true})", async () => {
    renderPage();
    await screen.findByText("3 of 8 complete");
    fireEvent.click(screen.getByRole("switch", { name: "Maintenance mode" }));
    await waitFor(() => expect(settingsApi.updateSettingsSection).toHaveBeenCalledWith("maintenance", { enabled: true }));
  });
});
