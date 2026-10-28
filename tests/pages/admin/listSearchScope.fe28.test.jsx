import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// FE-28 regression tests for the admin lists named in the finding
// (Announcements, Discounts, Promotions).
//
// Server contract (verified in the server tree): none of
// GET /announcements, GET /discounts or GET /promotions accepts a
// search parameter — each accepts only status/type/page/limit. There
// is no server search to send the query to, so — consistently with
// OrdersSection — the honest behaviour is page-scoped copy: the
// placeholder says the search covers this page, and while a query is
// active a hint states that other pages are not searched (the pager
// keeps reporting server totals for the unfiltered set).

const { mutation } = vi.hoisted(() => ({
  mutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("../../../src/hooks/admin/useAnnouncementTan", () => ({
  useAnnouncements: () => ({
    data: {
      data: {
        announcements: [
          {
            _id: "a1",
            title: "Monsoon Sale",
            content: "Big discounts",
            status: "draft",
            type: "general",
            priority: "normal",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        pagination: { total: 25, pages: 3 },
      },
    },
    isLoading: false,
  }),
  useAnnouncementStats: () => ({ data: { data: { stats: {} } } }),
  useCreateAnnouncement: mutation,
  useUpdateAnnouncement: mutation,
  useDeleteAnnouncement: mutation,
  usePublishAnnouncement: mutation,
  useScheduleAnnouncement: mutation,
  useArchiveAnnouncement: mutation,
}));

vi.mock("../../../src/hooks/admin/useDiscountTan", () => ({
  useDiscounts: () => ({
    data: {
      data: {
        discounts: [
          {
            _id: "d1",
            code: "SAVE10",
            description: "Ten percent off",
            discountPercentage: 10,
            minimumOrderAmount: 0,
            currentUsageCount: 0,
            maxUsageLimit: null,
            expiryDate: "2027-01-01T00:00:00.000Z",
            isActive: true,
          },
        ],
        pagination: { total: 25, pages: 3 },
      },
    },
    isLoading: false,
    error: null,
  }),
  useCreateDiscount: mutation,
  useUpdateDiscount: mutation,
  useDeleteDiscount: mutation,
}));

vi.mock("../../../src/hooks/admin/usePromotionTan", () => ({
  usePromotions: () => ({
    data: {
      data: {
        promotions: [
          {
            _id: "p1",
            title: "Winter Campaign",
            description: "Warm deals",
            status: "draft",
            targetAudience: { type: "all" },
            metrics: {},
          },
        ],
        pagination: { total: 25, pages: 3 },
      },
    },
    isLoading: false,
  }),
  useCreatePromotion: mutation,
  useUpdatePromotion: mutation,
  useDeletePromotion: mutation,
  useSendPromotion: mutation,
  useCancelPromotion: mutation,
  usePreviewAudience: mutation,
  usePromotionAnalytics: () => ({ data: undefined }),
}));

vi.mock("../../../src/components/common/Skeleton", () => ({
  TableSkeleton: () => null,
  default: () => null,
}));

vi.mock("../../../src/components/modals/ConfirmationDialog", () => ({
  default: () => null,
}));

vi.mock("../../../src/lib/toast.js", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

import Announcements from "../../../src/pages/admin/Announcements.jsx";
import Discounts from "../../../src/pages/admin/Discounts.jsx";
import Promotions from "../../../src/pages/admin/Promotions.jsx";

const HINT = /matches from this page only/i;

describe("Admin list search scope (FE-28)", () => {
  it("Announcements: placeholder is page-scoped and typing shows the page-only hint", () => {
    render(<Announcements />);
    const input = screen.getByPlaceholderText(
      /search announcements on this page/i,
    );
    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Monsoon" } });
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(screen.getByText("Monsoon Sale")).toBeInTheDocument();
  });

  it("Discounts: placeholder is page-scoped and typing shows the page-only hint", () => {
    render(<Discounts />);
    const input = screen.getByPlaceholderText(/search codes on this page/i);
    fireEvent.change(input, { target: { value: "SAVE" } });
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(screen.getByText("SAVE10")).toBeInTheDocument();
  });

  it("Promotions: placeholder is page-scoped and typing shows the page-only hint", () => {
    render(<Promotions />);
    const input = screen.getByPlaceholderText(/search this page by title/i);
    fireEvent.change(input, { target: { value: "Winter" } });
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(screen.getByText("Winter Campaign")).toBeInTheDocument();
  });
});
