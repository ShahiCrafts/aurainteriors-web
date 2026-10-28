// FE-12 (residual) — BlogDetailsPage built its related-post link as
// `/blog/${relatedBlog.slug}` with the slug interpolated UNENCODED:
// a slug containing '/', '?' or '#' would break out of the single
// /blog/:slug segment (extra path segments, a query string, or a
// fragment the router never sees as part of the slug). The link now
// encodes the slug with encodeURIComponent, the same treatment the
// tag links in this page and the FE-12 link sweep already use.
// The FE-67 TOC suite for this page lives in
// BlogDetailsPage.toc.fe67.test.jsx and is unaffected.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockState = vi.hoisted(() => ({ blog: null, related: [] }));

vi.mock("../../../src/hooks/blog/useBlogTan", () => ({
  useBlog: () => ({
    data: { data: { blog: mockState.blog } },
    isLoading: false,
    error: null,
  }),
  useRelatedBlogs: () => ({ data: { data: { blogs: mockState.related } } }),
}));
vi.mock("../../../src/layouts/customer/Navbar", () => ({
  default: () => null,
}));
vi.mock("../../../src/layouts/customer/Footer", () => ({
  default: () => null,
}));

import BlogDetailsPage from "../../../src/pages/blog/BlogDetailsPage.jsx";

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

describe("BlogDetailsPage related-post links (FE-12)", () => {
  it("a related slug with /, ? and # links to the single encoded segment", () => {
    mockState.blog = { ...baseBlog };
    mockState.related = [
      {
        _id: "blog-2",
        slug: "a/b?x=1#y",
        title: "Hostile Slug Post",
        readTime: 3,
      },
    ];
    renderPage();

    const link = screen.getByRole("link", { name: /Hostile Slug Post/ });
    // encodeURIComponent("a/b?x=1#y") === "a%2Fb%3Fx%3D1%23y": one
    // path segment, no query string, no fragment.
    expect(link).toHaveAttribute("href", "/blog/a%2Fb%3Fx%3D1%23y");
    expect(link.getAttribute("href")).not.toContain("a/b");
    expect(link.getAttribute("href")).not.toContain("?");
    expect(link.getAttribute("href")).not.toContain("#");
  });

  it("an ordinary related slug still links to /blog/<slug>", () => {
    mockState.blog = { ...baseBlog };
    mockState.related = [
      {
        _id: "blog-3",
        slug: "normal-post",
        title: "Normal Post",
        readTime: 2,
      },
    ];
    renderPage();

    expect(screen.getByRole("link", { name: /Normal Post/ })).toHaveAttribute(
      "href",
      "/blog/normal-post",
    );
  });
});
