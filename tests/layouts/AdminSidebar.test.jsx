import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

vi.mock("../../src/api/publicSettingsApi.js", () => ({
  default: { getPublicSettings: vi.fn() },
}));

import publicSettingsApi from "../../src/api/publicSettingsApi.js";
import AdminSidebar from "../../src/layouts/admin/AdminSidebar.jsx";

const menuGroups = [
  {
    title: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/dashboard",
      },
    ],
  },
];

function renderSidebar() {
  return render(
    <MemoryRouter>
      <AdminSidebar
        mobileMenuOpen={false}
        setMobileMenuOpen={() => {}}
        isCollapsed={false}
        toggleCollapse={() => {}}
        menuGroups={menuGroups}
        isActive={() => false}
      />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminSidebar store logo", () => {
  it("renders the configured settings logo and store name as alt text", async () => {
    publicSettingsApi.getPublicSettings.mockResolvedValue({
      identity: {
        storeName: "Guchaa Decor",
        logoUrl: "https://res.cloudinary.com/demo/guchaa-logo.png",
      },
    });
    renderSidebar();
    const img = await screen.findByAltText("Guchaa Decor");
    expect(img.getAttribute("src")).toBe(
      "https://res.cloudinary.com/demo/guchaa-logo.png",
    );
  });

  it("falls back to the official Aura Interiors logo while settings are unavailable", async () => {
    publicSettingsApi.getPublicSettings.mockResolvedValue(null);
    renderSidebar();
    const img = await screen.findByAltText("Aura Interiors");
    expect(img.getAttribute("src")).toBe("/logo-aura-interiors.webp");
  });

  it("falls back to the official logo when the settings request fails", async () => {
    publicSettingsApi.getPublicSettings.mockRejectedValue(
      new Error("network down"),
    );
    renderSidebar();
    const img = await screen.findByAltText("Aura Interiors");
    expect(img.getAttribute("src")).toBe("/logo-aura-interiors.webp");
  });

  it("falls back when the configured logo URL is empty", async () => {
    publicSettingsApi.getPublicSettings.mockResolvedValue({
      identity: { storeName: "Aura Interiors", logoUrl: "" },
    });
    renderSidebar();
    const img = await screen.findByAltText("Aura Interiors");
    expect(img.getAttribute("src")).toBe("/logo-aura-interiors.webp");
  });
});
