import { motion } from "framer-motion";
import {
  Plus,
  X,
  Image,
} from "lucide-react";

// Phase 7 split (from Products.jsx) — the product image picker in
// the Basic Info tab: empty dropzone, previews with simulated
// upload progress, +N overflow and remove. Markup moved verbatim;
// state arrives from useProductFormState.
export default function ProductImageUploader({
  imagePreviews,
  uploadProgress,
  showAllImages,
  setShowAllImages,
  fileInputRef,
  handleImageChange,
  removeImage,
}) {
  return (
    <>
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Images
              {imagePreviews.length > 0 && (
                <span className="ml-1.5 text-xs font-normal text-gray-400">
                  ({imagePreviews.length} {imagePreviews.length === 1 ? 'image' : 'images'})
                </span>
              )}
            </label>
            {imagePreviews.length === 0 ? (
              /* ── Empty State: Styled Dashed Dropzone ── */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl py-8 px-6 text-center hover:border-teal-400 transition-all cursor-pointer group bg-gray-50/30 hover:bg-teal-50/20"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-100 transition-colors">
                  <Image className="w-6 h-6 text-teal-500" />
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  <span className="text-teal-600">Click to upload</span>{" "}
                  product images
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG, WEBP less than 5MB
                </p>
              </div>
            ) : (
              /* ── Populated State: Max 3 visible + overflow overlay ── */
              <div className="flex flex-wrap gap-3 items-start">
                {(() => {
                  const MAX_VISIBLE = 3;
                  const total = imagePreviews.length;
                  const overflowCount = total - MAX_VISIBLE;
                  const hasOverflow = overflowCount > 0 && !showAllImages;
                  const visible = showAllImages
                    ? imagePreviews
                    : imagePreviews.slice(0, MAX_VISIBLE);

                  return (
                    <>
                      {visible.map((preview, index) => {
                        const isUploading = uploadProgress[preview.url] !== undefined;
                        const progress = uploadProgress[preview.url] || 0;
                        const isLastVisible = !showAllImages && index === MAX_VISIBLE - 1 && hasOverflow;

                        return (
                          <motion.div
                            key={preview.url || index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 350, damping: 22 }}
                            className="relative w-[122px] h-[122px] rounded-xl overflow-hidden border border-gray-200 group bg-gray-50 shrink-0"
                          >
                            <img
                              src={preview.url}
                              alt={`Preview ${index + 1}`}
                              className={`w-full h-full object-cover transition-all duration-200 ${isUploading ? 'brightness-50 scale-105' : 'group-hover:scale-105'}`}
                            />

                            {/* +N More overlay on last visible image */}
                            {isLastVisible && !isUploading && (
                              <button
                                type="button"
                                onClick={() => setShowAllImages(true)}
                                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-black/50 transition-colors hover:bg-black/60"
                              >
                                <span className="text-xl font-bold text-white">+{overflowCount}</span>
                                <span className="text-[10px] font-semibold text-white/80 mt-0.5">more</span>
                              </button>
                            )}

                            {/* Upload Progress Overlay */}
                            {isUploading && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                                <span className="text-[10px] font-bold text-white tracking-wide uppercase">
                                  Uploading
                                </span>
                                <div className="w-14 h-1.5 bg-white/30 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-white rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ ease: "easeOut", duration: 0.2 }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Remove button — hidden during upload & overlay */}
                            {!isUploading && !isLastVisible && (
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 p-0.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                title="Remove image"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </motion.div>
                        );
                      })}

                      {/* Collapse button when showing all */}
                      {showAllImages && overflowCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAllImages(false)}
                          className="w-[122px] h-[122px] rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all shrink-0 text-xs font-semibold text-gray-400"
                        >
                          Show less
                        </button>
                      )}

                      {/* Add Image Dashed Card */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-[122px] h-[122px] rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-400 bg-gray-50/50 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-teal-50/30 group shrink-0"
                        title="Upload more images"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors mb-1.5">
                          <Plus className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-colors" />
                        </div>
                        <span className="text-xs font-semibold text-gray-400 group-hover:text-teal-600 transition-colors">
                          Add Image
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
    </>
  );
}
