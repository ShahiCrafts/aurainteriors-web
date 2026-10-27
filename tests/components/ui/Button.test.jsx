// Phase 4 (REUSE-003) — Button primitive contract.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import Button from "../../../src/components/ui/Button.jsx";

describe("Button", () => {
  it("renders a primary button by default with brand token classes", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("bg-brand");
    expect(button.className).toContain("hover:bg-brand-hover");
    expect(button.className).not.toMatch(/#[0-9a-fA-F]{6}/);
  });

  it("applies variant and size classes", () => {
    render(
      <Button variant="danger" size="sm">
        Delete
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("bg-red-600");
    expect(button.className).toContain("h-9");
  });

  it("fires onClick and honours type=submit", () => {
    const onClick = vi.fn();
    render(
      <Button type="submit" onClick={onClick}>
        Go
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute("type", "submit");
  });

  it("disabled blocks clicks; loading shows a busy indicator and disables", () => {
    const onClick = vi.fn();
    const { rerender, container } = render(
      <Button disabled onClick={onClick}>
        Off
      </Button>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Off" }));
    expect(onClick).not.toHaveBeenCalled();

    rerender(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const loading = screen.getByRole("button", { name: /Saving/ });
    expect(loading).toBeDisabled();
    expect(container.innerHTML).not.toContain("animate-spin");
    expect(container.innerHTML).toContain("animate-pulse");
  });

  it('renders an anchor with as="a"', () => {
    render(
      <Button as="a" href="/shop">
        Shop now
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Shop now" });
    expect(link).toHaveAttribute("href", "/shop");
    expect(link.className).toContain("bg-brand");
  });
});
