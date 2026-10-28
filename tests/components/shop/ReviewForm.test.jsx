// FE-15 — ReviewForm has the same captured-defaultValues pattern as
// ReviewModal: swapping existingReview A -> B on the mounted form must
// reset every field to B. Fails pre-fix.
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

import ReviewForm from "../../../src/components/shop/ReviewForm.jsx";

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
    "Share your experience with this product. What did you like or dislike?",
  );

beforeEach(() => {
  hoisted.createReview.mockClear();
  hoisted.updateReview.mockClear();
});

describe("ReviewForm (FE-15)", () => {
  it("swapping existingReview A -> B on the mounted form shows B's values", () => {
    const { rerender } = render(
      <ReviewForm productId="prod-1" existingReview={reviewA} />,
    );
    expect(titleInput()).toHaveValue("Title A");
    fireEvent.change(titleInput(), { target: { value: "Edited A text" } });

    rerender(<ReviewForm productId="prod-1" existingReview={reviewB} />);

    expect(titleInput()).toHaveValue("Title B");
    expect(commentInput()).toHaveValue("Comment B is here");
  });

  it("submit after the A->B swap calls updateReview with B's id AND B's values", async () => {
    const { rerender } = render(
      <ReviewForm productId="prod-1" existingReview={reviewA} />,
    );
    rerender(<ReviewForm productId="prod-1" existingReview={reviewB} />);

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
    expect(hoisted.createReview).not.toHaveBeenCalled();
  });

  it("swapping to existingReview=null shows a blank form", () => {
    const { rerender } = render(
      <ReviewForm productId="prod-1" existingReview={reviewA} />,
    );
    rerender(<ReviewForm productId="prod-1" existingReview={null} />);
    expect(titleInput()).toHaveValue("");
    expect(commentInput()).toHaveValue("");
  });
});
