// Phase 4 (REUSE-004) — Select primitive: options prop, children, change.
import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import Select from "../../../src/components/ui/Select.jsx";

const OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price-low", label: "Price: low to high" },
  { value: "archived", label: "Archived", disabled: true },
];

describe("Select", () => {
  it("renders the options prop and forwards value/onChange", () => {
    const seen = [];
    function Harness() {
      const [value, setValue] = useState("newest");
      return (
        <Select
          aria-label="Sort by"
          options={OPTIONS}
          value={value}
          onChange={(event) => {
            seen.push(event.target.value);
            setValue(event.target.value);
          }}
        />
      );
    }
    render(<Harness />);
    const select = screen.getByLabelText("Sort by");
    expect(screen.getByRole("option", { name: "Newest first" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Archived" })).toBeDisabled();
    expect(select).toHaveValue("newest");

    fireEvent.change(select, { target: { value: "price-low" } });
    expect(seen).toEqual(["price-low"]);
    expect(select).toHaveValue("price-low");
  });

  it("renders children options in preference to the options prop", () => {
    render(
      <Select aria-label="Size" options={OPTIONS}>
        <option value="s">Small</option>
        <option value="m">Medium</option>
      </Select>,
    );
    expect(screen.getByRole("option", { name: "Small" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Newest first" })).toBeNull();
  });
});
