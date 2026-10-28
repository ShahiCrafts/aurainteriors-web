// Phase 4 (REUSE-012) — Breadcrumbs: nav landmark + aria-current on last.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import Breadcrumbs from "../../../src/components/ui/Breadcrumbs.jsx";

const ITEMS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Sofas" },
];

describe("Breadcrumbs", () => {
  it("renders a Breadcrumb nav with links for non-final items", () => {
    render(<Breadcrumbs items={ITEMS} />);
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Shop" })).toHaveAttribute(
      "href",
      "/shop",
    );
  });

  it("marks only the last item aria-current=page and never links it", () => {
    render(<Breadcrumbs items={ITEMS} />);
    const current = screen.getByText("Sofas");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "Sofas" })).toBeNull();
    expect(screen.getByText("Home")).not.toHaveAttribute("aria-current");
  });

  it("renders an unsafe href as inert text, never a link (FE-03)", () => {
    render(
      <Breadcrumbs
        items={[
          { label: "Home", href: "javascript:alert(1)" },
          { label: "Here" },
        ]}
      />,
    );
    expect(screen.queryByRole("link", { name: "Home" })).toBeNull();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("renders nothing for an empty trail", () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
