import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const h = vi.hoisted(() => ({ settings: null }));
vi.mock("../../../src/store/siteSettingsStore.js", () => {
  const state = { get settings() { return h.settings; } };
  const store = (sel) => (typeof sel === "function" ? sel({ settings: h.settings }) : { settings: h.settings });
  store.getState = () => ({ settings: h.settings });
  return { default: store };
});
import MaintenancePage, { useMaintenanceMode } from "../../../src/pages/info/MaintenancePage.jsx";

const SETTINGS = {
  identity: { storeName: "My Shop", logoUrl: "/my-logo.webp", supportEmail: "help@myshop.example" },
  contact: { email: "help@myshop.example", phone: "+977 9800000000" },
  maintenance: { enabled: true, message: "Closed for a refresh." },
};

function Probe() {
  const { enabled } = useMaintenanceMode();
  return enabled ? <MaintenancePage /> : <div>Store open</div>;
}

beforeEach(() => { h.settings = structuredClone(SETTINGS); });

describe("MaintenancePage / useMaintenanceMode", () => {
  it("renders logo, name, message and contact from site settings", () => {
    render(<MaintenancePage />);
    expect(screen.getByText("We'll be back soon")).toBeTruthy();
    expect(screen.getByText("Closed for a refresh.")).toBeTruthy();
    expect(screen.getByText("My Shop")).toBeTruthy();
    expect(screen.getByAltText("My Shop").getAttribute("src")).toBe("/my-logo.webp");
    expect(screen.getByText("help@myshop.example").closest("a").getAttribute("href")).toBe("mailto:help@myshop.example");
    expect(screen.getByText("+977 9800000000").closest("a").getAttribute("href")).toBe("tel:+9779800000000");
  });

  it("hook: enabled -> page content; disabled -> null/open", () => {
    const { rerender } = render(<Probe />);
    expect(screen.getByText("We'll be back soon")).toBeTruthy();
    h.settings = { ...SETTINGS, maintenance: { enabled: false, message: "" } };
    rerender(<Probe />);
    // Zustand mock is not reactive; a fresh render reflects the new state.
    const { unmount } = render(<Probe />);
    expect(screen.getAllByText("Store open").length).toBeGreaterThan(0);
    unmount();
  });

  it("falls back to the default message when none is set", () => {
    h.settings = { ...SETTINGS, maintenance: { enabled: true, message: "" } };
    render(<MaintenancePage />);
    expect(screen.getByText(/making some improvements/)).toBeTruthy();
  });
});
