import { useState, useRef, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useCreateReview, useUpdateReview } from "../../hooks/review/useReviewTan";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { reviewSchema } from "../../utils/validationSchemas";

export default function ReviewForm({
  productId,
  existingReview,
  onReviewSubmitted,
  onCancel,
}) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const cancelRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(reviewSchema),
    mode: "onChange",
    defaultValues: {
      rating: existingReview?.rating || 0,
      title: existingReview?.title || "",
      comment: existingReview?.comment || "",
    },
  });

  // FE-15: same captured-defaults defect as ReviewModal — defaultValues
  // are read once at mount, so swapping the target review on the mounted
  // form showed (and submitted) the previous review's values. Reset to
  // the CURRENT target whenever it changes; blank for a new review.
  useEffect(() => {
    reset({
      rating: existingReview?.rating || 0,
      title: existingReview?.title || "",
      comment: existingReview?.comment || "",
    });
    setHoveredRating(0);
  }, [existingReview, reset]);

  const rating = watch("rating");
  const title = watch("title", "");
  const comment = watch("comment", "");

  const { mutate: createReview, isPending: isCreating } = useCreateReview();
  const { mutate: updateReview, isPending: isUpdating } = useUpdateReview();

  const isPending = isCreating || isUpdating;
  const isEditing = !!existingReview;

  const handleStarClick = (star) => {
    setValue("rating", star, { shouldValidate: true });
  };

  const onSubmit = (data) => {
    const payload = {
      rating: data.rating,
      title: data.title,
      comment: data.comment,
    };

    const options = {
      onSuccess: () => {
        toast.success(isEditing ? "Review updated successfully" : "Review submitted successfully");
        if (onReviewSubmitted) onReviewSubmitted();
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || "Failed to submit review");
      },
    };

    if (isEditing) {
      updateReview({ productId, reviewId: existingReview._id, data: payload }, options);
    } else {
      createReview({ productId, data: payload }, options);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100">
      <h3 className="text-xl font-semibold mb-6 font-playfair text-neutral-900">
        {isEditing ? "Update Your Review" : "Write a Review"}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-6">
          <span className="block text-sm font-medium text-neutral-700 mb-2 font-dm-sans">
            Rating
          </span>
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                tabIndex={star === (rating || 1) ? 0 : -1}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => handleStarClick(star)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); handleStarClick(Math.min(5, star + 1)); }
                  if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); handleStarClick(Math.max(1, star - 1)); }
                }}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-full transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  className={`${star <= (hoveredRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-neutral-300"
                    } transition-colors`}
                />
              </button>
            ))}
          </div>
          {errors.rating && (
            <p className="mt-1 text-sm text-red-500 font-dm-sans">
              {errors.rating.message}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label
            htmlFor="review-title"
            className="block text-sm font-medium text-neutral-700 mb-2 font-dm-sans"
          >
            Review Title (Optional)
          </label>
          <input
            type="text"
            id="review-title"
            {...register("title")}
            placeholder="Summarize your experience"
            maxLength={100}
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-dm-sans"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500 font-dm-sans">
              {errors.title.message}
            </p>
          )}
          <p className="mt-1 text-xs text-neutral-400 font-dm-sans text-right">
            {(title?.length || 0)}/100
          </p>
        </div>

        <div className="mb-6">
          <label
            htmlFor="review-comment"
            className="block text-sm font-medium text-neutral-700 mb-2 font-dm-sans"
          >
            Your Review *
          </label>
          <textarea
            id="review-comment"
            {...register("comment")}
            placeholder="Share your experience with this product. What did you like or dislike?"
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none font-dm-sans"
          />
          {errors.comment && (
            <p className="mt-1 text-sm text-red-500 font-dm-sans">
              {errors.comment.message}
            </p>
          )}
          <p className="mt-1 text-xs text-neutral-400 font-dm-sans text-right">
            {(comment?.length || 0)}/1000
          </p>
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-neutral-200 rounded-lg text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors font-dm-sans"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-800 transition-colors font-dm-sans disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isEditing ? (
              "Update Review"
            ) : (
              "Submit Review"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
