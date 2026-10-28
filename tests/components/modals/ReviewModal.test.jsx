// FE-15 — ReviewModal captured useForm defaultValues once at mount and
// returned null when closed instead of unmounting, so editing review A,
// closing, then editing review B showed A's values while submitting
// against B._id. These tests fail pre-fix.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const hoisted = vi.hoisted(() => ({
  createReview: vi.fn(),
  updateReview: vi.fn(),
}));

vi.mock("../../../src/hooks/review/useReviewTan", () => ({
  useCreateReview: () => ({ mutate: hoisted.createReview, isPending: false }),
  useUpdateReview: () => ({ mutate: hoisted.updateReview, isPending: false }),
}));

import ReviewModal from "../../../src/components/modals/ReviewModal.jsx";

const reviewA = {
  _id: "rev-a",
  rating: 2,
  title: "Title A",
  comment: "Comment A is here",
};
const reviewB = {
  _id: "rev-b",
  rating: 5,
  title: "Title B",
  comment: "Comment B is here",
};

const titleInput = () =>
  screen.getByPlaceholderText("Summarize your experience");
const commentInput = () =>
  screen.getByPlaceholderText(
    "Share your experience with this piece. What did you love?",
  );

beforeEach(() => {
  hoisted.createReview.mockClear();
  hoisted.updateReview.mockClear();
});

describe("ReviewModal (FE-15)", () => {
  it("open A -> edit -> close -> open B shows B's pristine values, never A's", () => {
    const { rerender } = render(
      <ReviewModal
        isOpen
        onClose={vi.fn()}
        productId="prod-1"
        existingReview={reviewA}
      />,
    );
    expect(titleInput()).toHaveValue("Title A");
    fireEvent.change(titleInput(), { target: { value: "Edited A text" } });
    fireEvent.change(commentInput(), {
      target: { value: "Edited A comment body" },
    });

    rerender(
      <ReviewModal
        isOpen={false}
        onClose={vi.fn()}
        productId="prod-1"
        existingReview={reviewA}
      />,
    );
    rerender(
      <ReviewModal
        isOpen
        onClose={vi.fn()}
        productId="prod-1"
        existingReview={reviewB}
      />,
    );

    expect(titleInput()).toHaveValue("Title B");
    expect(commentInput()).toHaveValue("Comment B is here");
    // Rating 5 for B (label "Excellent"), not A's 2 ("Fair").
    expect(screen.getByText("Excellent")).toBeInTheDocument();
    expect(screen.queryByText("Fair")).not.toBeInTheDocument();
  });

  it("submit after the A->B swap calls updateReview with B's id AND B's values", async () => {
    const { rerender } = render(
      <ReviewModal
        isOpen
        onClose={vi.fn()}
        productId="prod-1"
        existingReview={reviewA}
      />,
    );
    rerender(
      <ReviewModal
        isOpen={false}
        onClose={vi.fn()}
        productId="prod-1"
        existingReview={reviewA}
      />,
    );
    rerender(
      <ReviewModal
        isOpen
        onClose={vi.fn()}
        productId="prod-1"
        existingReview={reviewB}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Update Review" }));

    await waitFor(() => expect(hoisted.updateReview).toHaveBeenCalledTimes(1));
    const arg = hoisted.updateReview.mock.calls[0][0];
    expect(arg.reviewId).toBe("rev-b");
    expect(arg.data).toEqual({
      rating: 5,
      title: "Title B",
      comment: "Comment B is here",
    });
    expect(JSON.stringify(arg)).not.toContain("Title A");
    expect(JSON.stringify(arg)).not.toContain("Comment A");
    expect(hoisted.createReview).not.toHaveBeenCalled();
  });

  it("close then open with existingReview=null shows a blank form", () => {
    const { rerender } = render(
      <ReviewModal
        isOpen
        onClose={vi.fn()}
        productId="prod-1"
        existingReview={reviewA}
      />,
    );
    rerender(
      <ReviewModal
        isOpen={false}
        onClose={vi.fn()}
        productId="prod-1"
        existingReview={reviewA}
      />,
    );
    rerender(
      <ReviewModal
        isOpen
        onClose={vi.fn()}
        productId="prod-1"
        existingReview={null}
      />,
    );

    expect(titleInput()).toHaveValue("");
    expect(commentInput()).toHaveValue("");
    expect(screen.queryByText("Excellent")).not.toBeInTheDocument();
    expect(screen.queryByText("Fair")).not.toBeInTheDocument();
  });
});
