import { useState } from "react";
import { Star, ChevronDown, Loader2, ThumbsUp, CheckCircle, MoreVertical, Edit2, Trash2 } from "lucide-react";
import {
  useProductReviews,
  useMarkHelpful,
  useDeleteReview,
} from "../../hooks/review/useReviewTan";
import useAuthStore from "../../store/authStore";
import ConfirmationDialog from "../modals/ConfirmationDialog";
import { getAvatarUrl } from "../../utils/imageUrl";
import { toast } from "react-toastify";
import formatError from "../../utils/errorHandler";

export default function ReviewSection({ productId, productName, onEditReview }) {
  const [filter, setFilter] = useState({
    page: 1,
    limit: 6,
    sort: "-helpfulCount",
    rating: undefined,
  });

  const { isAuthenticated, user } = useAuthStore();

  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    isFetching,
  } = useProductReviews(productId, filter);

  const reviews = reviewsData?.data?.reviews || [];
  const breakdown = reviewsData?.data?.breakdown || [];
  const stats = reviewsData?.data?.stats || { average: 0, total: 0 };
  const pagination = reviewsData?.data?.pagination || {
    page: 1,
    pages: 1,
    total: 0,
  };

  const handleFilterChange = (newFilter) => {
    setFilter({ ...filter, ...newFilter, page: 1 });
  };

  const handleLoadMore = () => {
    setFilter({ ...filter, page: filter.page + 1 });
  };

  const sortOptions = [
    { value: "-helpfulCount", label: "Most Helpful" },
    { value: "-createdAt", label: "Most Recent" },
    { value: "-rating", label: "Highest Rated" },
  ];

  return (
    <div className="font-dm-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">

        {/* ── Left Column: Rating Summary ── */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-32">
            {/* Big Number */}
            <div className="mb-4">
              <div className="flex items-end gap-3 mb-1">
                <span className="text-[48px] font-bold text-[#1A1714] leading-none tracking-tight tabular-nums font-dm-sans">
                  {stats.average.toFixed(1)}
                </span>
                <div className="pb-1.5">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={20}
                        className={i < Math.round(stats.average) ? "fill-[#F27318] text-[#F27318]" : "fill-black/[0.08] text-transparent"}
                      />
                    ))}
                    <span className="text-[14px] text-black/35 font-semibold ml-1">({stats.total})</span>
                  </div>
                </div>
              </div>
              <p className="text-[14px] text-black/30 font-medium leading-none font-dm-sans mt-3">
                {stats.total} {stats.total === 1 ? "Rating" : "Ratings"} & {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
              </p>
            </div>

            {/* Breakdown Bars */}
            <div className="space-y-1.5 pt-2">
              {breakdown.map((item) => (
                <button
                  key={item.stars}
                  onClick={() => handleFilterChange({ rating: filter.rating === item.stars ? undefined : item.stars })}
                  className={`w-full flex items-center gap-2.5 py-0.5 group transition-all bg-transparent border-none cursor-pointer p-0 ${filter.rating === item.stars ? "opacity-100" : "opacity-50 hover:opacity-90"}`}
                >
                  <span className="text-[14px] font-bold text-black/50 w-4 text-right tabular-nums shrink-0 font-dm-sans">{item.stars}</span>
                  <Star size={16} className="fill-[#F27318] text-[#F27318] shrink-0" />
                  <div className="flex-1 h-[6px] bg-black/[0.04] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${filter.rating === item.stars ? "bg-[#1A1714]" : "bg-[#F27318]"}`}
                      style={{ width: stats.total > 0 ? `${(item.count / stats.total) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="text-[14px] font-medium text-black/30 w-7 text-right tabular-nums shrink-0 font-dm-sans">
                    {stats.total > 0 ? `${Math.round((item.count / stats.total) * 100)}%` : "0%"}
                  </span>
                </button>
              ))}
            </div>

            {/* Filter Reset */}
            {filter.rating && (
              <button
                onClick={() => handleFilterChange({ rating: undefined })}
                className="mt-4 text-[12px] font-bold text-[#F27318] hover:underline underline-offset-2 bg-transparent border-none cursor-pointer p-0 font-dm-sans"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* ── Right Column: Reviews ── */}
        <div className="lg:col-span-9">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[18px] font-medium text-[#1A1714] font-dm-sans">Reviewed by customers</h3>
            <div className="relative">
              <select
                value={filter.sort}
                onChange={(e) => handleFilterChange({ sort: e.target.value })}
                className="appearance-none bg-transparent border-none text-[14px] font-medium text-black/35 focus:outline-none cursor-pointer pr-5 hover:text-black/60 transition-colors font-dm-sans"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-0 top-1/2 -translate-y-1/2 text-black/25 pointer-events-none" />
            </div>
          </div>

          {/* Reviews List */}
          {isLoadingReviews ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={28} className="text-[#F27318] animate-spin" />
            </div>
          ) : reviews.length > 0 ? (
            <div>
              {reviews.map((review, index) => (
                <ReviewCard
                  key={review._id}
                  review={review}
                  productId={productId}
                  isOwner={user?._id === review.user?._id}
                  onEdit={onEditReview}
                  isLast={index === reviews.length - 1}
                />
              ))}

              {pagination.page < pagination.pages && (
                <div className="flex justify-center pt-8 pb-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={isFetching}
                    className="inline-flex items-center justify-center gap-2 text-[13px] font-bold text-[#F27318] hover:underline underline-offset-4 transition-all disabled:opacity-50 cursor-pointer bg-transparent border-none p-0 font-dm-sans"
                  >
                    {isFetching ? <Loader2 size={14} className="animate-spin" /> : "Show more reviews"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-black/30 font-bold text-[15px] mb-1 font-dm-sans">No reviews yet.</p>
              <p className="text-[13px] text-black/20 font-medium font-dm-sans">
                Be the first to share your experience with this piece.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Review Card
   ───────────────────────────────────────────── */
function ReviewCard({ review, productId, isOwner, onEdit, isLast }) {
  const [showMenu, setShowMenu] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  const { mutate: markHelpful, isPending: isMarkingHelpful } = useMarkHelpful();
  const { mutate: deleteReview, isPending: isDeleting } = useDeleteReview();

  const hasVoted = isAuthenticated && review.helpfulVotes?.includes(user?._id);

  const handleMarkHelpful = () => {
    if (!isAuthenticated) {
      toast.error("Please login to mark reviews as helpful");
      return;
    }
    markHelpful(
      { productId, reviewId: review._id },
      { onError: (err) => toast.error(formatError(err, "Failed to mark as helpful")) }
    );
  };

  const handleDelete = () => {
    deleteReview(
      { productId, reviewId: review._id },
      {
        onSuccess: () => { toast.success("Review deleted successfully"); setDeleteModalOpen(false); },
        onError: (err) => toast.error(formatError(err, "Failed to delete review")),
      }
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getUserName = () => {
    return `${review.user?.firstName || review.user?.name || "Anonymous"} ${review.user?.lastName || ""}`.trim();
  };

  return (
    <div className={`py-6 font-dm-sans ${!isLast ? "border-b border-black/[0.05]" : ""}`}>
      {/* Row 1: Stars */}
      <div className="flex items-center gap-1 mb-2.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={18}
            className={i < review.rating ? "fill-[#F27318] text-[#F27318]" : "fill-black/[0.06] text-transparent"}
          />
        ))}
        <span className="text-[14px] font-bold text-black/35 ml-1 font-dm-sans">({review.rating})</span>
      </div>

      {/* Row 2: Comment */}
      <p className="text-[16px] text-[#1A1714]/80 leading-[1.75] font-medium mb-3 font-dm-sans">{review.comment}</p>

      {/* Row 3: Author + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[16px] font-dm-sans">
          <span className="font-bold text-[#1A1714]">{getUserName()}</span>
          {review.isVerifiedPurchase && (
            <>
              <span className="text-black/15">·</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-green-600 font-bold font-dm-sans">
                <CheckCircle size={11} />
                Verified Buyer
              </span>
            </>
          )}
          <span className="text-black/15">·</span>
          <span className="text-[14px] text-black/25 font-dm-sans">{formatDate(review.createdAt)}</span>
        </div>

        {/* Right: Helpful + Menu */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkHelpful}
            disabled={isMarkingHelpful}
            className={`inline-flex items-center gap-1.5 text-[14px] font-medium transition-colors bg-transparent border-none cursor-pointer p-0 font-dm-sans ${hasVoted ? "text-[#F27318]" : "text-black/25 hover:text-[#F27318]"
              }`}
          >
            {isMarkingHelpful ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ThumbsUp size={14} className={hasVoted ? "fill-[#F27318]" : ""} />
            )}
            Helpful
            ({review.helpfulCount || 0})
          </button>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-0.5 text-black/20 hover:text-black/50 transition-colors bg-transparent border-none cursor-pointer"
              >
                <MoreVertical size={14} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-black/[0.06] rounded-lg shadow-lg shadow-black/[0.06] z-20 py-1 min-w-[120px]">
                    <button
                      onClick={() => { onEdit?.(review); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] font-medium text-[#1A1714] hover:bg-black/[0.02] bg-transparent border-none cursor-pointer font-dm-sans"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      onClick={() => { setDeleteModalOpen(true); setShowMenu(false); }}
                      disabled={isDeleting}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] font-medium text-red-500 hover:bg-red-50/50 bg-transparent border-none cursor-pointer font-dm-sans"
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin Response */}
      {review.adminResponse?.comment && (
        <div className="bg-[#FAFAFA] rounded-lg p-4 mt-4 border-l-[3px] border-[#F27318]/30 font-dm-sans">
          <p className="text-[11px] font-bold text-[#F27318] mb-1 uppercase tracking-wider font-dm-sans">
            Aura Interiors
          </p>
          <p className="text-[13px] text-black/55 leading-[1.65] font-medium font-dm-sans">{review.adminResponse.comment}</p>
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteModalOpen}
        title="Delete Review?"
        message="Are you sure you want to delete your review? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
