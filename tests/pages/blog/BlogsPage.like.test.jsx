// FE-26 — Blog like button must stay reconciled with the server.
// Server likeBlog is idempotent per actor (FA-25): POSTing again does
// not double-count, and there is NO unlike endpoint. Pre-fix the page
// flipped a purely local heart: a failed POST left the heart filled,
// and a second click emptied the heart while sending nothing — heart
// and server count diverged until reload.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockState = vi.hoisted(() => ({
  toggleLike: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("../../../src/hooks/blog/useBlogTan", () => ({
  useBlogs: () => ({
    data: {
      data: {
        blogs: [
          {
            _id: "post-1",
            slug: "post-one",
            title: "Post One",
            excerpt: "Excerpt",
            category: "design",
            categoryName: "Design",
            readTime: 3,
            likes: 7,
            createdAt: "2026-10-01T00:00:00.000Z",
            featuredImage: null,
            author: { name: "Author" },
          },
        ],
        pagination: { page: 1, pages: 1 },
      },
    },
    isLoading: false,
    isFetching: false,
  }),
  useBlogCategories: () => ({
    data: { data: { categories: [{ slug: "all", name: "All", count: 1 }] } },
  }),
  usePopularBlogs: () => ({ data: { data: { blogs: [] } } }),
  useToggleBlogLike: () => ({ mutate: mockState.toggleLike }),
}));

vi.mock("../../../src/hooks/newsletter/useNewsletterTan", () => ({
  useNewsletterSubscribe: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../../src/layouts/customer/Navbar", () => ({ default: () => null }));
vi.mock("../../../src/layouts/customer/Footer", () => ({ default: () => null }));
vi.mock("../../../src/lib/toast.js", () => ({
  toast: { error: mockState.toastError, success: vi.fn() },
}));

import BlogsPage from "../../../src/pages/blog/BlogsPage.jsx";

function heartButton(container) {
  const svg = container.querySelector("svg.lucide-heart");
  return svg?.closest("button");
}
function heartFilled(container) {
  const svg = container.querySelector("svg.lucide-heart");
  return svg?.getAttribute("class")?.includes("fill-red-500");
}

describe("FE-26 BlogsPage like reconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successful like: heart fills and exactly one POST is made", () => {
    mockState.toggleLike.mockImplementation((id, opts) =>
      opts?.onSuccess?.({ data: { likes: 8 } })
    );
    const { container } = render(
      <MemoryRouter>
        <BlogsPage />
      </MemoryRouter>
    );
    expect(heartFilled(container)).toBe(false);
    fireEvent.click(heartButton(container));
    expect(mockState.toggleLike).toHaveBeenCalledTimes(1);
    expect(mockState.toggleLike).toHaveBeenCalledWith("post-1", expect.anything());
    expect(heartFilled(container)).toBe(true);
  });

  it("failed like: heart rolls back and an error toast is shown", () => {
    mockState.toggleLike.mockImplementation((id, opts) =>
      opts?.onError?.(new Error("network down"))
    );
    const { container } = render(
      <MemoryRouter>
        <BlogsPage />
      </MemoryRouter>
    );
    fireEvent.click(heartButton(container));
    expect(mockState.toggleLike).toHaveBeenCalledTimes(1);
    expect(heartFilled(container)).toBe(false);
    expect(mockState.toastError).toHaveBeenCalled();
  });

  it("second click after a successful like is an explicit no-op: no request, heart stays filled (aligned with the server count)", () => {
    mockState.toggleLike.mockImplementation((id, opts) =>
      opts?.onSuccess?.({ data: { likes: 8 } })
    );
    const { container } = render(
      <MemoryRouter>
        <BlogsPage />
      </MemoryRouter>
    );
    fireEvent.click(heartButton(container));
    fireEvent.click(heartButton(container));
    expect(mockState.toggleLike).toHaveBeenCalledTimes(1);
    expect(heartFilled(container)).toBe(true);
  });

  it("PEN: rapid double-click while the first like is in flight sends only one request", () => {
    mockState.toggleLike.mockImplementation(() => {
      /* never settles during the test */
    });
    const { container } = render(
      <MemoryRouter>
        <BlogsPage />
      </MemoryRouter>
    );
    fireEvent.click(heartButton(container));
    fireEvent.click(heartButton(container));
    expect(mockState.toggleLike).toHaveBeenCalledTimes(1);
    expect(heartFilled(container)).toBe(true);
  });

  it("PEN: after a failed like, clicking again retries the POST (state was rolled back, not stuck)", () => {
    let calls = 0;
    mockState.toggleLike.mockImplementation((id, opts) => {
      calls += 1;
      if (calls === 1) opts?.onError?.(new Error("boom"));
      else opts?.onSuccess?.({ data: { likes: 8 } });
    });
    const { container } = render(
      <MemoryRouter>
        <BlogsPage />
      </MemoryRouter>
    );
    fireEvent.click(heartButton(container));
    expect(heartFilled(container)).toBe(false);
    fireEvent.click(heartButton(container));
    expect(mockState.toggleLike).toHaveBeenCalledTimes(2);
    expect(heartFilled(container)).toBe(true);
  });
});
