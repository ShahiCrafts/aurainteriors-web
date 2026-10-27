// Phase 4 (REUSE-007) — Price: formatNPR output + compare-at strike rule.
// Note: Intl currency output separates "NPR" from the digits with a
// narrow no-break space, which Testing Library's text normaliser
// collapses on the DOM side only — so matches go through a
// whitespace-normalising function matcher rather than the raw string.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import Price from "../../../src/components/ui/Price.jsx";
import { formatNPR } from "../../../src/utils/formatCurrency";

const squash = (text) => text.replace(/\s+/g, " ");
const formatted = (value) => (content) => squash(content) === squash(formatNPR(value));

describe("Price", () => {
  it("renders the amount through formatNPR", () => {
    render(<Price amount={12999} />);
    expect(screen.getByText(formatted(12999))).toBeInTheDocument();
  });

  it("strikes through a higher compare-at price", () => {
    render(<Price amount={9999} compareAt={14999} />);
    const compare = screen.getByText(formatted(14999));
    expect(compare.className).toContain("line-through");
    expect(screen.getByText(formatted(9999))).toBeInTheDocument();
  });

  it("does not render compare-at when it is not greater than the amount", () => {
    render(<Price amount={9999} compareAt={9999} />);
    expect(screen.queryByText(formatted(9999), { selector: ".line-through" })).toBeNull();
    expect(screen.getAllByText(formatted(9999))).toHaveLength(1);
  });

  it("applies the size class", () => {
    render(<Price amount={100} size="lg" />);
    expect(screen.getByText(formatted(100)).className).toContain("text-xl");
  });
});
