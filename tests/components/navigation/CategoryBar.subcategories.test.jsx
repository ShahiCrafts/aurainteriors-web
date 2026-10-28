import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
const state = vi.hoisted(() => ({ categories: [] }));
vi.mock("../../../src/hooks/product/useCategoryTan", () => ({
  useCategoryTree: () => ({
    data: { data: { categories: state.categories } },
    isLoading: false,
  }),
}));
vi.mock("../../../src/hooks/product/useArCatalogTan", () => ({
  useArCatalogProducts: () => ({ data: undefined }),
}));
import CategoryBar from "../../../src/components/navigation/CategoryBar";
beforeEach(() => {
  state.categories = [
    {
      name: "Living Room",
      slug: "living-room",
      subcategories: [
        {
          name: "Sofas",
          slug: "sofas",
          subcategories: [{ name: "Corner Sofas", slug: "corner-sofas" }],
        },
        { name: "Chairs", slug: "chairs" },
      ],
    },
  ];
});
const mount = () =>
  render(
    <MemoryRouter>
      <CategoryBar />
    </MemoryRouter>,
  );
describe("Category subcategory popup", () => {
  it("shows the All shop link and keeps parent collection navigation", () => {
    // The bar originally omitted an "All" item; the owner asked for
    // one (grid icon, links to /shop) at the head of the bar.
    mount();
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute(
      "href",
      "/shop",
    );
    expect(screen.getByRole("link", { name: "Living Room" })).toHaveAttribute(
      "href",
      "/shop?categories=living-room",
    );
  });
  it("opens actual subcategories and nested groups on click", () => {
    mount();
    fireEvent.click(
      screen.getByRole("button", { name: "Show Living Room subcategories" }),
    );
    expect(screen.getByRole("link", { name: "Sofas" })).toHaveAttribute(
      "href",
      "/shop?categories=sofas",
    );
    expect(screen.getByRole("link", { name: "Corner Sofas" })).toHaveAttribute(
      "href",
      "/shop?categories=corner-sofas",
    );
  });
  it("opens on hover", () => {
    mount();
    fireEvent.mouseEnter(screen.getByRole("link", { name: "Living Room" }));
    expect(screen.getByText("Chairs")).toBeInTheDocument();
  });
  it("closes on Escape and restores trigger focus", () => {
    mount();
    const button = screen.getByRole("button", {
      name: "Show Living Room subcategories",
    });
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });
  it("closes on outside pointer interaction", () => {
    mount();
    fireEvent.click(
      screen.getByRole("button", { name: "Show Living Room subcategories" }),
    );
    fireEvent.pointerDown(document.body);
    expect(screen.queryByText("Chairs")).not.toBeInTheDocument();
  });
  it("closes when a child link is selected", () => {
    mount();
    fireEvent.click(
      screen.getByRole("button", { name: "Show Living Room subcategories" }),
    );
    fireEvent.click(screen.getByRole("link", { name: "Chairs" }));
    expect(screen.queryByText("Chairs")).not.toBeInTheDocument();
  });

  it("ArrowDown opens the popup and focuses its first link", async () => {
    mount();
    const trigger = screen.getByRole("button", {
      name: "Show Living Room subcategories",
    });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Sofas" })).toHaveFocus(),
    );
  });
  it("popup has no View all link for the open category", () => {
    mount();
    fireEvent.click(
      screen.getByRole("button", { name: "Show Living Room subcategories" }),
    );
    expect(
      screen.queryByRole("link", { name: /View all/ }),
    ).not.toBeInTheDocument();
    expect(
      document.getElementById("category-subcategories").textContent,
    ).not.toContain("View all");
    // No header strip at all: no close button in the popup either —
    // Escape, outside click and mouse-leave close it.
    expect(
      screen.queryByRole("button", { name: "Close subcategories" }),
    ).not.toBeInTheDocument();
  });
  it("moving focus outside the navigation dismisses the popup", () => {
    mount();
    fireEvent.click(
      screen.getByRole("button", { name: "Show Living Room subcategories" }),
    );
    fireEvent.blur(screen.getByRole("link", { name: "Sofas" }), {
      relatedTarget: document.body,
    });
    expect(screen.queryByText("Chairs")).not.toBeInTheDocument();
  });
  it("supports the children tree shape too", () => {
    state.categories = [
      {
        name: "Bedroom",
        slug: "bedroom",
        children: [{ name: "Beds", slug: "beds" }],
      },
    ];
    mount();
    fireEvent.click(
      screen.getByRole("button", { name: "Show Bedroom subcategories" }),
    );
    expect(screen.getByRole("link", { name: "Beds" })).toHaveAttribute(
      "href",
      "/shop?categories=beds",
    );
  });
  it("renders subcategories at every depth, not just two levels", () => {
    state.categories = [
      {
        name: "Living Room",
        slug: "living-room",
        subcategories: [
          {
            name: "Seating",
            slug: "seating",
            subcategories: [
              {
                name: "Upholstered Sofas",
                slug: "upholstered-sofas",
                subcategories: [
                  {
                    name: "Two Seater Sofas",
                    slug: "two-seater-sofas",
                    subcategories: [
                      {
                        name: "Two Seater Sofas in Sand and Sage Green",
                        slug: "two-seater-sofas-in-sand-and-sage-green",
                        subcategories: [
                          {
                            name: "Two Seater Sofas in Sand",
                            slug: "two-seater-sofas-in-sand",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    mount();
    fireEvent.click(
      screen.getByRole("button", { name: "Show Living Room subcategories" }),
    );
    expect(screen.getByRole("link", { name: "Seating" })).toHaveAttribute(
      "href",
      "/shop?categories=seating",
    );
    expect(
      screen.getByRole("link", { name: "Upholstered Sofas" }),
    ).toHaveAttribute("href", "/shop?categories=upholstered-sofas");
    expect(
      screen.getByRole("link", { name: "Two Seater Sofas" }),
    ).toHaveAttribute("href", "/shop?categories=two-seater-sofas");
    expect(
      screen.getByRole("link", {
        name: "Two Seater Sofas in Sand and Sage Green",
      }),
    ).toHaveAttribute(
      "href",
      "/shop?categories=two-seater-sofas-in-sand-and-sage-green",
    );
    expect(
      screen.getByRole("link", { name: "Two Seater Sofas in Sand" }),
    ).toHaveAttribute("href", "/shop?categories=two-seater-sofas-in-sand");
  });
});

it("highlights a parent when a nested query category is selected", () => {
  render(
    <MemoryRouter initialEntries={["/shop?categories=corner-sofas"]}>
      <CategoryBar />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: "Living Room" })).toHaveClass(
    "text-[#F27318]",
  );
});
