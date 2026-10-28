// FE-44 — ContactPage renders a category control and submits exactly
// the server payload shape. The submit hook is mocked at the hook seam
// (useSubmitContact) so the assertion reads the exact object the page
// hands to the API layer; Navbar/Footer are page chrome, stubbed out.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../../../src/layouts/customer/Navbar.jsx", () => ({
  default: () => null,
}));
vi.mock("../../../src/layouts/customer/Footer.jsx", () => ({
  default: () => null,
}));

const submitContact = vi.fn();
vi.mock("../../../src/hooks/admin/useContactTan.js", () => ({
  useSubmitContact: () => ({ mutate: submitContact, isPending: false }),
}));

import ContactPage from "../../../src/pages/info/ContactPage.jsx";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FE-44 ContactPage", () => {
  it("renders a category control with the server enum options", () => {
    render(<ContactPage />);
    const select = screen.getByLabelText(/category/i);
    const values = Array.from(select.querySelectorAll("option")).map(
      (o) => o.value,
    );
    expect(values).toEqual([
      "general",
      "support",
      "sales",
      "partnership",
      "feedback",
      "other",
    ]);
  });

  it("submits exactly {name, email, phone, subject, message, category} with the chosen category", async () => {
    render(<ContactPage />);
    fireEvent.change(screen.getByPlaceholderText("John Doe"), {
      target: { value: "Jane Customer" },
    });
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Inquiry Topic"), {
      target: { value: "Bulk order" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("How can we help you today?"),
      {
        target: { value: "We need ten sofas." },
      },
    );
    fireEvent.change(screen.getByLabelText(/category/i), {
      target: { value: "sales" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() => expect(submitContact).toHaveBeenCalledTimes(1));
    const payload = submitContact.mock.calls[0][0];
    expect(Object.keys(payload).sort()).toEqual(
      ["category", "email", "message", "name", "phone", "subject"].sort(),
    );
    expect(payload).toMatchObject({
      name: "Jane Customer",
      email: "jane@example.com",
      subject: "Bulk order",
      message: "We need ten sofas.",
      category: "sales",
    });
    expect(payload).not.toHaveProperty("fullName");
  });
});
