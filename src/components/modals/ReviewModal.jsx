import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { useCreateReview, useUpdateReview } from "../../hooks/review/useReviewTan";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { reviewSchema } from "../../utils/validationSchemas";

export default function ReviewModal({ isOpen, onClose, productId, existingReview, productName }) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
        onClose();
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

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-[480px] rounded-xl overflow-hidden relative shadow-[0_20px_60px_rgba(0,0,0,0.3)] font-dm-sans"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition-all rounded-lg border-none cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Form Content */}
          <div className="w-full p-8 md:p-10 flex flex-col justify-center bg-white overflow-y-auto max-h-[90vh]">
            <div className="w-full">
              <div className="mb-6">
                <h3 className="text-[24px] font-bold text-[#1A1714] mb-1">
                  {isEditing ? "Update Your Review" : "Write a Review"}
                </h3>
                <p className="text-[#64748B] text-[14px]">
                  {productName ? `Reviewing: ${productName}` : "Share your honest experience with this piece."}
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {/* Star Rating */}
                <div>
                  <label className="text-[14px] font-medium text-[#1A1714] mb-2 block">Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => handleStarClick(star)}
                        className="focus:outline-none transition-transform hover:scale-110 bg-transparent border-none cursor-pointer p-0"
                      >
                        <Star
                          size={28}
                          className={`${
                            star <= (hoveredRating || rating)
                              ? "fill-[#F27318] text-[#F27318]"
                              : "fill-black/10 text-transparent"
                          } transition-colors`}
                        />
                      </button>
                    ))}
                    {(hoveredRating || rating) > 0 && (
                      <span className="text-[13px] font-bold text-[#F27318] ml-2">
                        {ratingLabels[hoveredRating || rating]}
                      </span>
                    )}
                  </div>
                  {errors.rating && (
                    <p className="mt-1 text-[12px] text-red-500 font-medium">{errors.rating.message}</p>
                  )}
                </div>

                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-medium text-[#1A1714]">Review Title (Optional)</label>
                  <input
                    type="text"
                    {...register("title")}
                    placeholder="Summarize your experience"
                    maxLength={100}
                    className="w-full h-11 px-4 border border-[#E2E8F0] rounded-lg focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px] font-dm-sans"
                  />
                  {errors.title && (
                    <p className="text-[12px] text-red-500 font-medium">{errors.title.message}</p>
                  )}
                  <p className="text-[11px] text-black/30 text-right font-medium">{(title?.length || 0)}/100</p>
                </div>

                {/* Comment */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-medium text-[#1A1714]">Your Review *</label>
                  <textarea
                    {...register("comment")}
                    placeholder="Share your experience with this piece. What did you love?"
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:border-[#F27318] focus:ring-1 focus:ring-[#F27318] outline-none transition-all text-[15px] resize-none font-dm-sans"
                  />
                  {errors.comment && (
                    <p className="text-[12px] text-red-500 font-medium">{errors.comment.message}</p>
                  )}
                  <p className="text-[11px] text-black/30 text-right font-medium">{(comment?.length || 0)}/1000</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-11 border border-[#E2E8F0] rounded-lg text-[#64748B] font-semibold text-[14px] hover:bg-gray-50 transition-all cursor-pointer bg-transparent"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 h-11 bg-[#F27318] hover:bg-[#D9620E] text-white font-semibold text-[14px] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer flex items-center justify-center gap-2"
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
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
