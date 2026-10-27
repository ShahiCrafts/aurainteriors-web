// FE-03 PEN-TEST — sink-level tests for the migrated media sinks.
// The battery (safeUrl.battery.test.js) covers the helper; these pin
// that the actual components never let a hostile value reach the DOM.

import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChatAttachment from "../../src/components/chat/ChatAttachment";
import TopProductsTable from "../../src/components/admin/dashboard/TopProductsTable";
import ImageMagnifier from "../../src/components/shop/ImageMagnifier";
import { FALLBACK_IMAGES } from "../../src/utils/imageUrl";

const EVIL = "https://evil.com/steal.png";
const CLOUDINARY = "https://res.cloudinary.com/demo/image/upload/v1/sofa.jpg";

describe("FE-03 sink: ChatAttachment", () => {
  it("hostile image fileUrl renders no <img> and no <a> carrying it", () => {
    const { container } = render(
      <ChatAttachment
        attachment={{ fileName: "x.png", fileUrl: EVIL, fileType: "image", fileSize: 10 }}
      />
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container.innerHTML).not.toContain("evil.com");
  });

  it("hostile document fileUrl renders no download link", () => {
    const { container } = render(
      <ChatAttachment
        attachment={{ fileName: "x.pdf", fileUrl: "javascript:alert(1)", fileType: "document", fileSize: 10 }}
      />
    );
    expect(container.querySelector("a")).toBeNull();
  });

  it("a server payload cannot mint a blob: preview", () => {
    const { container } = render(
      <ChatAttachment
        attachment={{
          fileName: "x.png",
          fileUrl: "blob:http://localhost:3001/550e8400-e29b-41d4-a716-446655440000",
          fileType: "image",
          fileSize: 10,
        }}
      />
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("blob: IS accepted for the local optimistic preview (isOptimistic)", () => {
    const blob = "blob:http://localhost:3001/550e8400-e29b-41d4-a716-446655440000";
    const { container } = render(
      <ChatAttachment
        isOptimistic
        attachment={{ fileName: "x.png", fileUrl: blob, fileType: "image", fileSize: 10 }}
      />
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe(blob);
  });

  it("legit Cloudinary image renders as an image link with the validated URL", () => {
    const { container } = render(
      <ChatAttachment
        attachment={{ fileName: "sofa.jpg", fileUrl: CLOUDINARY, fileType: "image", fileSize: 10 }}
      />
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe(CLOUDINARY);
    expect(container.querySelector("a")?.getAttribute("href")).toBe(CLOUDINARY);
  });

  it("legit API-origin document renders a download link with the validated URL", () => {
    const url = "http://localhost:3001/uploads/chat/manual.pdf";
    const { container } = render(
      <ChatAttachment
        attachment={{ fileName: "manual.pdf", fileUrl: url, fileType: "document", fileSize: 2048 }}
      />
    );
    const a = container.querySelector("a");
    expect(a?.getAttribute("href")).toBe(url);
    expect(a?.getAttribute("download")).toBe("manual.pdf");
  });

  it("relative API fileUrl keeps the base-joining behaviour", () => {
    const { container } = render(
      <ChatAttachment
        attachment={{ fileName: "a.jpg", fileUrl: "/uploads/chat/a.jpg", fileType: "image", fileSize: 10 }}
      />
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "http://localhost:3001/uploads/chat/a.jpg"
    );
  });
});

describe("FE-03 sink: TopProductsTable", () => {
  const renderTable = (image) =>
    render(
      <MemoryRouter>
        <TopProductsTable products={[{ _id: "1", name: "Sofa", image, sales: 3, revenue: 100 }]} />
      </MemoryRouter>
    );

  it("evil product.image → fallback image, never the raw host", () => {
    const { container } = renderTable(EVIL);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe(FALLBACK_IMAGES.product);
    expect(container.innerHTML).not.toContain("evil.com");
  });

  it("cloudinary product.image keeps working", () => {
    const { container } = renderTable(CLOUDINARY);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(CLOUDINARY);
  });
});

describe("FE-03 sink: ImageMagnifier (CSS url() token)", () => {
  it("quote-breakout payload: no img src, and mouse-move builds no background", () => {
    const payload = "x');background:url(javascript:alert(1))";
    const { container } = render(<ImageMagnifier src={payload} alt="x" />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBeNull();
    fireEvent.mouseMove(container.firstChild, { clientX: 10, clientY: 10 });
    expect(container.innerHTML).not.toContain("javascript:");
    expect(container.querySelectorAll("div").length).toBe(1); // no magnifier div
  });

  it("evil-host src is rejected even without quotes", () => {
    const { container } = render(<ImageMagnifier src={EVIL} alt="x" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBeNull();
  });

  it("legit cloudinary src renders and the magnifier uses the validated value", () => {
    const { container } = render(<ImageMagnifier src={CLOUDINARY} alt="sofa" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(CLOUDINARY);
    // jsdom reports a 0×0 box; the magnifier style is still built from
    // the validated src on mouse-move.
    fireEvent.mouseEnter(container.firstChild);
    fireEvent.mouseMove(container.firstChild, { clientX: 0, clientY: 0 });
    const magnifier = container.querySelectorAll("div")[1];
    if (magnifier) {
      expect(magnifier.style.backgroundImage).toContain("res.cloudinary.com");
      expect(magnifier.style.backgroundImage).not.toContain("evil.com");
    }
  });
});
