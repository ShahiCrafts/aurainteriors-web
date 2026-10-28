import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import ImageMagnifier from "../../../components/shop/ImageMagnifier";
import arIcon from "../../../assets/icons/ar_icon.png";
import Dialog from "../../../components/common/Dialog";

export default function Gallery({
  product,
  images,
  selectedImage,
  setSelectedImage,
  getImageUrl,
  getImageSrcSet,
  setIsLightboxOpen,
  setIsARModalOpen,
}) {
  return (
    <div className="flex-[1.2] flex gap-3 justify-end overflow-hidden">
      {/* Thumbnails - left side */}
      <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar">
        {images.slice(0, 5).map((image, index) => {
          const isLastVisible = index === 4 && images.length > 5;
          return (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === index
                  ? "border-[#F27318]"
                  : "border-transparent hover:border-black/10"
              }`}
            >
              <img
                src={getImageUrl(image)}
                srcSet={getImageSrcSet(image, [160, 320])}
                sizes="80px"
                loading="lazy"
                alt={`${product.name} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {isLastVisible && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    +{images.length - 5}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main image and details - right side */}
      <div className="space-y-6 flex-1">
        {/* Main Image */}
        <div className="w-full overflow-hidden">
          <div className="relative rounded-xl overflow-hidden bg-black/[0.02] border border-black/[0.05] w-full h-[444px]">
            {/* Bestseller badge on image */}
            {product.isFeatured && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white text-[#1A1714] text-[13px] font-bold px-3 py-1.5 rounded-md shadow-sm">
                <Star size={13} className="fill-[#F27318] text-[#F27318]" />
                Bestseller
              </div>
            )}

            <ImageMagnifier
              src={getImageUrl(images[selectedImage])}
              srcSet={getImageSrcSet(images[selectedImage], [600, 1200, 1920])}
              sizes="(max-width: 1024px) 100vw, 60vw"
              alt={product.name}
              magnifierSize={112}
              zoomLevel={2.5}
              className="w-full h-full object-cover"
            />

            {/* Fullscreen button - top right */}
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="absolute top-4 right-4 z-10 w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-neutral-50 transition-all text-black/50 hover:text-black shadow-sm"
              title="View fullscreen"
            >
              <Maximize2 size={16} strokeWidth={2} />
            </button>

            {/* AR button */}
            {product.arAvailable && (
              <button
                onClick={() => setIsARModalOpen(true)}
                className="absolute bottom-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center hover:bg-neutral-50 transition-all shadow-sm"
                title="View in AR"
              >
                <img src={arIcon} alt="AR View" className="w-4 h-4" />
              </button>
            )}

            {/* Pagination dots - mobile */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    selectedImage === index
                      ? "w-5 bg-[#F27318]"
                      : "w-1.5 bg-neutral-300/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GalleryLightbox({
  isLightboxOpen,
  setIsLightboxOpen,
  images,
  selectedImage,
  setSelectedImage,
  product,
  getImageUrl,
  getImageSrcSet,
}) {
  return (
    <>
      {/* Fullscreen Image Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={() => setIsLightboxOpen(false)}
          >
            <Dialog
              open={isLightboxOpen}
              onClose={() => setIsLightboxOpen(false)}
              label="Product image viewer"
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Close button */}
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-5 right-5 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10"
                title="Close"
                aria-label="Close image viewer"
              >
                <X size={22} />
              </button>

              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute top-6 left-6 text-white/70 text-[14px] font-medium">
                  {selectedImage + 1} / {images.length}
                </div>
              )}

              {/* Nav arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage((prev) =>
                        prev === 0 ? images.length - 1 : prev - 1,
                      );
                    }}
                    className="absolute left-4 sm:left-8 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage((prev) =>
                        prev === images.length - 1 ? 0 : prev + 1,
                      );
                    }}
                    className="absolute right-4 sm:right-8 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              {/* Full image */}
              <motion.img
                key={selectedImage}
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                src={getImageUrl(images[selectedImage])}
                srcSet={getImageSrcSet(
                  images[selectedImage],
                  [600, 1200, 1920],
                )}
                sizes="90vw"
                alt={product.name}
                className="max-w-[90vw] max-h-[85vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Thumbnail strip inside lightbox */}
              {images.length > 1 && (
                <div
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-2 bg-white/10 rounded-xl max-w-[90vw] overflow-x-auto no-scrollbar"
                  onClick={(e) => e.stopPropagation()}
                >
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? "border-white"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        srcSet={getImageSrcSet(image, [96, 192])}
                        sizes="48px"
                        loading="lazy"
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Dialog>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
