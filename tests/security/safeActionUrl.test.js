// FE-04 PEN-TEST — safeActionUrl helper units.
//
// Pins every defect in the pre-fix consume pattern
//   navigate(actionUrl.replace("/admin", "/dashboard") + "?highlight=" + orderId)
// (first-occurrence replace mangles later segments, "?highlight=" is
// appended even when a query exists, orderId is unencoded) plus the
// open-redirect class the helper exists to close.

import { describe, it, expect } from "vitest";
import { safeActionUrl } from "../../src/utils/safeUrl";

describe("FE-04 safeActionUrl — the three string-surgery defects", () => {
  it("rewrites a LEADING /admin segment to /dashboard", () => {
    expect(safeActionUrl("/admin/orders")).toBe("/dashboard/orders");
    expect(safeActionUrl("/admin")).toBe("/dashboard");
  });

  it("preserves /admin in LATER segments", () => {
    expect(safeActionUrl("/orders/admin/list")).toBe("/orders/admin/list");
    expect(safeActionUrl("/shop/admin")).toBe("/shop/admin");
  });

  it("does not rewrite a segment that merely starts with 'admin'", () => {
    expect(safeActionUrl("/administrator/panel")).toBe("/administrator/panel");
  });

  it("merges highlight with & when a query already exists", () => {
    expect(
      safeActionUrl("/admin/orders?status=open", { highlight: "ord1" }),
    ).toBe("/dashboard/orders?status=open&highlight=ord1");
  });

  it("adds highlight with ? when there is no query", () => {
    expect(safeActionUrl("/admin/orders", { highlight: "ord1" })).toBe(
      "/dashboard/orders?highlight=ord1",
    );
  });

  it("keeps an existing query untouched when no highlight is given", () => {
    expect(safeActionUrl("/admin/orders?status=open")).toBe(
      "/dashboard/orders?status=open",
    );
  });

  it("replaces an existing highlight param instead of duplicating it", () => {
    const out = safeActionUrl("/admin/orders?highlight=old", {
      highlight: "new",
    });
    expect(out).toBe("/dashboard/orders?highlight=new");
  });

  it("encodes an orderId carrying &highlight=pwn into ONE param", () => {
    const out = safeActionUrl("/admin/orders", {
      highlight: "a&highlight=pwn",
    });
    const params = new URLSearchParams(out.split("?")[1]);
    expect(params.getAll("highlight")).toEqual(["a&highlight=pwn"]);
  });

  it("encodes orderIds carrying # and ? (no fragment / query injection)", () => {
    for (const id of ["x#frag", "x?y=1", "x y"]) {
      const out = safeActionUrl("/admin/orders", { highlight: id });
      expect(out).not.toContain("#");
      expect(out.split("?").length).toBe(2);
      const params = new URLSearchParams(out.split("?")[1]);
      expect(params.get("highlight")).toBe(id);
    }
  });

  it("preserves an existing fragment while merging highlight", () => {
    expect(safeActionUrl("/admin/orders#details", { highlight: "o1" })).toBe(
      "/dashboard/orders?highlight=o1#details",
    );
  });
});

describe("FE-04 safeActionUrl — hostile values return null", () => {
  const HOSTILE = [
    ["protocol-relative", "//evil.com/orders"],
    ["slash-backslash", "/\\evil.com/orders"],
    ["javascript:", "javascript:alert(1)"],
    ["mixed-case javascript:", "JaVaScRiPt:alert(1)"],
    ["control-char scheme trick", "\tjava\nscript:alert(1)"],
    ["data:", "data:text/html;base64,PHNjcmlwdD4="],
    ["foreign https", "https://evil.com/orders"],
    ["foreign http", "http://evil.com/orders"],
    ["allowlist subdomain trick", "https://res.cloudinary.com.evil.com/orders"],
    ["userinfo trick", "https://images.unsplash.com@evil.com/orders"],
    ["relative without leading slash", "dashboard/orders"],
    ["empty", ""],
    ["whitespace only", "   "],
    ["non-string", null],
    ["non-string number", 42],
    ["backslash path", "/admin\\orders"],
    ["space in path", "/admin orders"],
  ];
  for (const [name, payload] of HOSTILE) {
    it(`rejects: ${name}`, () => {
      expect(safeActionUrl(payload, { highlight: "o1" })).toBeNull();
      expect(
        safeActionUrl(payload, { highlight: "o1", inAppOnly: true }),
      ).toBeNull();
    });
  }
});

describe("FE-04 safeActionUrl — absolute URLs", () => {
  it("reduces an absolute app-origin URL to path+query and rewrites /admin", () => {
    const origin = window.location.origin; // jsdom app origin
    expect(
      safeActionUrl(`${origin}/admin/orders?status=open`, { highlight: "o9" }),
    ).toBe("/dashboard/orders?status=open&highlight=o9");
  });

  it("reduces an absolute configured-origin (API host) URL to its path", () => {
    expect(safeActionUrl("http://localhost:3001/admin/orders")).toBe(
      "/dashboard/orders",
    );
  });

  it("accepts an allowlisted external https for link use, but not for in-app navigation", () => {
    const url =
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800";
    expect(safeActionUrl(url)).toBe(url);
    expect(safeActionUrl(url, { inAppOnly: true })).toBeNull();
  });

  it("trims surrounding whitespace before validating", () => {
    expect(safeActionUrl("  /admin/orders  ")).toBe("/dashboard/orders");
  });
});
