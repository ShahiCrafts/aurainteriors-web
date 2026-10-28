// FE-67 — Blog TOC anchors were dead: BlogDetailsPage injected
// id="section-N" into <h2>s BEFORE sanitizeBlogHtml ran, and the
// sanitizer (correctly, by allowlist) strips author id attributes —
// so every TOC target vanished. The fix builds the TOC from the
// SANITIZED output: sanitize first, parse the sanitized HTML, assign
// page-generated ids (section-1, section-2, …) to the rendered
// headings, and build TOC links as same-page fragments only.
// The sanitizer must NOT start whitelisting author ids.
//
// Pen-test cases: hostile heading content (script-ish text,
// event-handler-like text, an author-supplied id, a "__proto__"
// id collision attempt, duplicate heading texts, an extremely long
// heading) must render a TOC whose entries are inert text with
// page-generated fragment hrefs only, and no unsanitized HTML may
// reach the TOC or the article body.

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockState = vi.hoisted(() => ({ blog: null }));

vi.mock("../../../src/hooks/blog/useBlogTan", () => ({
  useBlog: () => ({
    data: { data: { blog: mockState.blog } },
    isLoading: false,
    error: null,
  }),
  useRelatedBlogs: () => ({ data: { data: { blogs: [] } } }),
}));
vi.mock("../../../src/layouts/customer/Navbar", () => ({
  default: () => null,
}));
vi.mock("../../../src/layouts/customer/Footer", () => ({
  default: () => null,
}));

import BlogDetailsPage from "../../../src/pages/blog/BlogDetailsPage.jsx";
import { buildBlogContent } from "../../../src/utils/blogToc.js";

const baseBlog = {
  _id: "blog-1",
  slug: "test-post",
  title: "A Test Post",
  excerpt: "Excerpt",
  content: "<p>Hello</p>",
  category: "design",
  readTime: 4,
  publishedAt: "2026-10-01T00:00:00.000Z",
  createdAt: "2026-10-01T00:00:00.000Z",
  views: 0,
  likes: 0,
  tags: [],
  author: { name: "Test Author" },
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/blog/test-post"]}>
      <Routes>
        <Route path="/blog/:slug" element={<BlogDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function tocLinks(container) {
  const aside = container.querySelector("aside");
  return aside ? [...aside.querySelectorAll("a")] : [];
}

describe("buildBlogContent (FE-67 unit)", () => {
  it("assigns page-generated ids to sanitized headings in order", () => {
    const { html, sections } = buildBlogContent(
      '<h2 id="author-chosen">First</h2><p>x</p><h2>Second</h2>',
    );
    expect(sections).toEqual([
      { id: "section-1", title: "First" },
      { id: "section-2", title: "Second" },
    ]);
    expect(html).toContain('id="section-1"');
    expect(html).toContain('id="section-2"');
    expect(html).not.toContain("author-chosen");
  });

  it("strips hostile heading attributes before assigning ids", () => {
    const { html, sections } = buildBlogContent(
      '<h2 id="__proto__" onclick="window.__pwned=1">Safe Text</h2>',
    );
    expect(sections).toEqual([{ id: "section-1", title: "Safe Text" }]);
    expect(html).not.toContain("__proto__");
    expect(html).not.toContain("onclick");
    expect({}.polluted).toBeUndefined();
  });
});

describe("BlogDetailsPage TOC (FE-67)", () => {
  it("TOC links are fragments whose targets exist in the rendered article", () => {
    mockState.blog = {
      ...baseBlog,
      content:
        "<h2>Getting Started</h2><p>a</p><h2>Deep Dive</h2><p>b</p><h2>Wrap Up</h2>",
    };
    const { container } = renderPage();

    const links = tocLinks(container);
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "#section-1",
      "#section-2",
      "#section-3",
    ]);
    expect(links.map((a) => a.textContent.trim())).toEqual([
      "Getting Started",
      "Deep Dive",
      "Wrap Up",
    ]);
    // Verification target: the target element with the generated id
    // exists in the rendered article DOM and the href matches it.
    for (const link of links) {
      const id = link.getAttribute("href").slice(1);
      const target = container.querySelector(`article #${id}`);
      expect(target).not.toBeNull();
      expect(target.localName).toBe("h2");
      expect(target.textContent.trim()).toBe(link.textContent.trim());
    }
  });

  it("clicking a TOC link scrolls (the anchor target is found by id)", () => {
    window.scrollTo = vi.fn();
    mockState.blog = {
      ...baseBlog,
      content: "<h2>Only Section</h2><p>a</p>",
    };
    renderPage();
    fireEvent.click(screen.getByRole("link", { name: "Only Section" }));
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it("PEN-TEST: hostile headings render an inert TOC with page-generated fragment hrefs only", () => {
    const longTitle = "L".repeat(500);
    mockState.blog = {
      ...baseBlog,
      content: [
        '<h2 id="evil-author-id" onclick="window.__pwned=1">&lt;script&gt;alert(1)&lt;/script&gt;</h2>',
        '<h2 id="__proto__">Duplicate</h2>',
        "<h2>Duplicate</h2>",
        `<h2>${longTitle}</h2>`,
        '<p><img src="x" onerror="window.__pwned=1"></p>',
      ].join(""),
    };
    const { container } = renderPage();

    const links = tocLinks(container);
    expect(links).toHaveLength(4);
    for (const link of links) {
      // Fragment-only, page-generated hrefs — never author values.
      expect(link.getAttribute("href")).toMatch(/^#section-\d+$/);
      // TOC entries are inert text: no child elements at all.
      expect(link.querySelectorAll("*")).toHaveLength(0);
    }
    expect(links[0].textContent).toContain("<script>alert(1)</script>");
    expect(links[1].textContent.trim()).toBe("Duplicate");
    expect(links[2].textContent.trim()).toBe("Duplicate");
    expect(links[1].getAttribute("href")).not.toBe(
      links[2].getAttribute("href"),
    );
    expect(links[3].textContent).toContain(longTitle);

    // No unsanitized HTML reached the article or the page: no script,
    // no event-handler attributes, no author ids anywhere.
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("#evil-author-id")).toBeNull();
    expect(container.querySelector('[id="__proto__"]')).toBeNull();
    for (const el of container.querySelectorAll("*")) {
      for (const attr of el.attributes || []) {
        expect(attr.name.toLowerCase().startsWith("on")).toBe(false);
      }
    }
    expect(window.__pwned).toBeUndefined();
    expect({}.polluted).toBeUndefined();

    // Every heading in the article carries its page-generated id.
    const headings = [...container.querySelectorAll("article h2")];
    expect(headings.map((h) => h.getAttribute("id"))).toEqual([
      "section-1",
      "section-2",
      "section-3",
      "section-4",
    ]);
  });

  it("an article with no h2 renders no TOC sidebar", () => {
    mockState.blog = { ...baseBlog, content: "<p>Just a paragraph</p>" };
    const { container } = renderPage();
    expect(container.querySelector("aside")).toBeNull();
  });
});
