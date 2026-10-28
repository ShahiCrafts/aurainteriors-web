// Phase 4 (REUSE-008) — Badge + statusTone mappings.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import Badge from "../../../src/components/ui/Badge.jsx";
import {
  toneForStatus,
  TONE_CLASSES,
} from "../../../src/components/ui/statusTone.js";

describe("toneForStatus", () => {
  it("maps order statuses", () => {
    expect(toneForStatus("pending")).toBe("warning");
    expect(toneForStatus("processing")).toBe("info");
    expect(toneForStatus("shipped")).toBe("info");
    expect(toneForStatus("delivered")).toBe("success");
    expect(toneForStatus("cancelled")).toBe("danger");
    expect(toneForStatus("refunded")).toBe("neutral");
  });

  it("maps payment and stock statuses per category", () => {
    expect(toneForStatus("paid", "payment")).toBe("success");
    expect(toneForStatus("failed", "payment")).toBe("danger");
    expect(toneForStatus("partially_refunded", "payment")).toBe("warning");
    expect(toneForStatus("in_stock", "stock")).toBe("success");
    expect(toneForStatus("low stock", "stock")).toBe("warning");
    expect(toneForStatus("out_of_stock", "stock")).toBe("danger");
  });

  it("normalises case/space and falls back to neutral", () => {
    expect(toneForStatus("Delivered")).toBe("success");
    expect(toneForStatus("something-else")).toBe("neutral");
    expect(toneForStatus("")).toBe("neutral");
    expect(toneForStatus(undefined)).toBe("neutral");
  });
});

describe("Badge", () => {
  it("renders children with the explicit tone classes", () => {
    render(<Badge tone="success">In stock</Badge>);
    const badge = screen.getByText("In stock");
    expect(badge.className).toContain(TONE_CLASSES.success);
  });

  it("resolves tone from status and defaults the label to the status", () => {
    render(<Badge status="delivered" />);
    const badge = screen.getByText("delivered");
    expect(badge.className).toContain(TONE_CLASSES.success);
  });

  it("explicit tone wins over status", () => {
    render(
      <Badge tone="brand" status="delivered">
        Featured
      </Badge>,
    );
    expect(screen.getByText("Featured").className).toContain(
      TONE_CLASSES.brand,
    );
  });
});
