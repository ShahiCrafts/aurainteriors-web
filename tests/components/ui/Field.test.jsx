// Phase 4 (REUSE-004) — Field wrapper: label wiring + aria contract.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import Field from "../../../src/components/ui/Field.jsx";

describe("Field", () => {
  it("wires the label to the control via htmlFor/id", () => {
    render(
      <Field label="Full Name" id="full-name">
        <input type="text" />
      </Field>,
    );
    const input = screen.getByLabelText("Full Name");
    expect(input).toHaveAttribute("id", "full-name");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("renders the error, marks the control invalid and describes it", () => {
    render(
      <Field label="Email" id="email" error="Email is required">
        <input type="email" />
      </Field>,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const error = screen.getByRole("alert");
    expect(error).toHaveTextContent("Email is required");
    expect(input.getAttribute("aria-describedby")).toContain(error.id);
  });

  it("shows the hint (and describes by it) when there is no error", () => {
    render(
      <Field label="Phone" id="phone" hint="We only call about delivery">
        <input type="tel" />
      </Field>,
    );
    const input = screen.getByLabelText("Phone");
    const hint = screen.getByText("We only call about delivery");
    expect(input.getAttribute("aria-describedby")).toContain(hint.id);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("generates an id when none is given, so the label still associates", () => {
    render(
      <Field label="City">
        <input type="text" />
      </Field>,
    );
    expect(screen.getByLabelText("City")).toBeInTheDocument();
  });

  it("marks required fields with an aria-hidden asterisk", () => {
    const { container } = render(
      <Field label="Address" id="addr" required>
        <input type="text" />
      </Field>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent(
      "*",
    );
  });
});
