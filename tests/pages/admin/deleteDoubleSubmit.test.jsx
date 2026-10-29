import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
} from "@testing-library/react";

// FE-37(c): the admin delete controls in Contacts, Reviews and
// KnowledgeBase had NO pending/disable guard at all — a double-click
// fired duplicate DELETE mutations; the second call then errored into
// a toast after the first had already succeeded.
// Each control must fire exactly one mutation per user action and be
// disabled while that mutation is pending.

const h = vi.hoisted(() => ({
  deleteContact: vi.fn(),
  deleteReview: vi.fn(),
}));

vi.mock("../../../src/hooks/admin/useContactTan", () => ({
  useContacts: () => ({
    data: {
      data: {
        contacts: [
          {
            _id: "contact-1",
            name: "Jane Buyer",
            email: "jane@example.com",
            subject: "Sofa question",
            category: "general",
            status: "new",
            isRead: false,
            createdAt: "2026-10-01T00:00:00.000Z",
          },
        ],
        pagination: { total: 1, pages: 1 },
      },
    },
    isLoading: false,
    error: null,
  }),
  useContact: () => ({ data: undefined }),
  useUpdateContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMarkAsRead: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useRespondToContact: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteContact: () => ({ mutateAsync: h.deleteContact, isPending: false }),
}));

vi.mock("../../../src/hooks/review/useReviewTan", () => ({
  useAllReviews: () => ({
    data: {
      data: {
        reviews: [
          {
            _id: "review-1",
            user: {
              firstName: "Jane",
              lastName: "Buyer",
              email: "jane@example.com",
            },
            product: { name: "Cloud Sofa" },
            rating: 5,
            title: "Great",
            comment: "Loved it",
            isApproved: true,
            createdAt: "2026-10-01T00:00:00.000Z",
          },
        ],
        pagination: { total: 1, pages: 1 },
      },
    },
    isLoading: false,
    error: null,
  }),
  useAddAdminResponse: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useToggleApproval: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAdminDeleteReview: () => ({
    mutateAsync: h.deleteReview,
    isPending: false,
  }),
}));

vi.mock("../../../src/api/documentApi.js", () => ({
  listDocuments: vi.fn(),
  uploadDocument: vi.fn(),
  deleteDocument: vi.fn(),
  retryDocument: vi.fn(),
}));

import Contacts from "../../../src/pages/admin/Contacts.jsx";
import Reviews from "../../../src/pages/admin/Reviews.jsx";
import KnowledgeBase from "../../../src/pages/admin/KnowledgeBase.jsx";
import { listDocuments, deleteDocument } from "../../../src/api/documentApi.js";

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function clickRowTrash(nameText) {
  const row = screen.getByText(nameText).closest("tr");
  const buttons = within(row).getAllByRole("button");
  fireEvent.click(buttons[buttons.length - 1]);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("admin delete double-submit protection (FE-37)", () => {
  it("Contacts: double-clicking the modal Delete fires exactly one delete mutation and disables while pending", async () => {
    const d = deferred();
    h.deleteContact.mockReturnValue(d.promise);
    render(<Contacts />);
    await screen.findByText("Jane Buyer");

    clickRowTrash("Jane Buyer");
    const deleteBtn = await screen.findByRole("button", { name: "Delete" });
    fireEvent.click(deleteBtn);
    fireEvent.click(deleteBtn);

    expect(h.deleteContact).toHaveBeenCalledTimes(1);
    expect(deleteBtn).toBeDisabled();

    await act(async () => {
      d.resolve();
    });
  });

  it("Reviews: double-clicking 'Delete Permanently' fires exactly one delete mutation and disables while pending", async () => {
    const d = deferred();
    h.deleteReview.mockReturnValue(d.promise);
    render(<Reviews />);
    await screen.findByText("Cloud Sofa");

    clickRowTrash("Cloud Sofa");
    const deleteBtn = await screen.findByRole("button", {
      name: "Delete Permanently",
    });
    fireEvent.click(deleteBtn);
    fireEvent.click(deleteBtn);

    expect(h.deleteReview).toHaveBeenCalledTimes(1);
    expect(deleteBtn).toBeDisabled();

    await act(async () => {
      d.resolve();
    });
  });

  it("KnowledgeBase: double-clicking a document's delete fires exactly one deleteDocument call and disables while pending", async () => {
    const d = deferred();
    deleteDocument.mockReturnValue(d.promise);
    listDocuments.mockResolvedValue({
      data: {
        documents: [
          {
            _id: "doc-1",
            fileName: "returns-policy.pdf",
            fileUrl: "https://res.cloudinary.com/demo/returns-policy.pdf",
            fileType: "pdf",
            status: "indexed",
            createdAt: "2026-10-01T00:00:00.000Z",
          },
        ],
        pagination: { totalPages: 1 },
      },
    });
    render(<KnowledgeBase />);
    await screen.findByText("returns-policy.pdf");

    const deleteBtn = screen.getByTitle("Delete Document");
    fireEvent.click(deleteBtn);
    fireEvent.click(deleteBtn);

    expect(deleteDocument).toHaveBeenCalledTimes(1);
    expect(deleteBtn).toBeDisabled();

    await act(async () => {
      d.resolve({ status: "success" });
    });
    await waitFor(() => expect(deleteBtn).not.toBeDisabled());
  });
});
