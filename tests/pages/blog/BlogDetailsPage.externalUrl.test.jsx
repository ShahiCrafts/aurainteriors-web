// FE-04 (sibling) — BlogDetailsPage source attribution sinks.
//
// blog.originalUrl and blog.source.logo are server-controlled fields
// whose purpose is to point off-site, so they cannot be host-
// allowlisted — but a javascript:/data: value must never reach the
// href/src. These render tests pin that both sinks go through
// validateExternalUrl: hostile values render NOTHING (no link, no
// img), legitimate https values render with the validated href/src.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
  source: { name: "Example Publisher", logo: "https://cdn.publisher.example/logo.png" },
  originalUrl: "https://www.publisher.example/original-article",
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/blog/test-post"]}>
      <Routes>
        <Route path="/blog/:slug" element={<BlogDetailsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("BlogDetailsPage external attribution (FE-04 sibling)", () => {
  it("renders the Read Original link and source logo for legit https values", () => {
    mockState.blog = { ...baseBlog };
    renderPage();

    const link = screen.getByRole("link", { name: "Read Original" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.publisher.example/original-article"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");

    const logo = screen.getByAltText("Example Publisher");
    expect(logo).toHaveAttribute(
      "src",
      "https://cdn.publisher.example/logo.png"
    );
  });

  it("renders NO link and NO logo img for javascript: values in both fields", () => {
    mockState.blog = {
      ...baseBlog,
      originalUrl: "javascript:alert(1)",
      source: { name: "Example Publisher", logo: "javascript:alert(1)" },
    };
    const { container } = renderPage();

    expect(screen.queryByRole("link", { name: "Read Original" })).toBeNull();
    expect(screen.queryByAltText("Example Publisher")).toBeNull();
    expect(container.innerHTML).not.toContain("javascript:");
  });

  it("renders NO link for a data: originalUrl and NO img for a data: logo", () => {
    mockState.blog = {
      ...baseBlog,
      originalUrl: "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      source: {
        name: "Example Publisher",
        logo: "data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+",
      },
    };
    renderPage();

    expect(screen.queryByRole("link", { name: "Read Original" })).toBeNull();
    expect(screen.queryByAltText("Example Publisher")).toBeNull();
  });

  it("renders NO link for an http: originalUrl (https only)", () => {
    mockState.blog = {
      ...baseBlog,
      originalUrl: "http://www.publisher.example/original-article",
    };
    renderPage();

    expect(screen.queryByRole("link", { name: "Read Original" })).toBeNull();
    // The https logo still renders — the two sinks are independent.
    expect(screen.getByAltText("Example Publisher")).toBeInTheDocument();
  });
});
