// Footer contact block — reads from the CONTACT source of truth
// (src/seo/site.js). It had drifted to a placeholder phone
// (+977 1 44XXXXX), a care@ email and the old Durbarmarg address
// while the Contact page and SEO data already carried the real
// details; this pins the real ones so it cannot drift silently.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../src/components/sections/BrandMarquee.jsx", () => ({
  default: () => null,
}));

import Footer from "../../src/layouts/customer/Footer";

describe("footer contact details", () => {
  it("shows the real phone, email and Hattiban address", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(screen.getByText("+977 9866291003")).toBeInTheDocument();
    expect(
      screen.getByText("support@aurainteriors.live"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Hattiban, Lalitpur, Nepal"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/44XXXXX|Durbarmarg/)).not.toBeInTheDocument();
    expect(screen.queryByText(/care@aurainteriors/)).not.toBeInTheDocument();
  });
});
