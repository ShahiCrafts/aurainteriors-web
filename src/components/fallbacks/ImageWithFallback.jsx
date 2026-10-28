import React, { useState } from "react";
import { FALLBACK_IMAGES } from "../../utils/imageUrl";

export function ImageWithFallback({
  src,
  fallback,
  alt,
  className,
  srcSet,
  sizes,
  width,
  height,
  loading,
  decoding,
}) {
  // FE-29: the error state is keyed by the src that failed, NOT held
  // as the displayed URL. The old useState(src) froze the first image
  // for the life of a reused table row (pagination/sort/filter showed
  // the previous product's photo next to the new product's name), and
  // with no fallback prop — neither call site passes one — an error
  // left the browser's broken-image icon.
  //
  // Deriving the displayed src from props every render means a src
  // change is honoured immediately, the failed-src marker simply
  // stops matching, and no effect/key bookkeeping is needed.
  const effectiveFallback = fallback || FALLBACK_IMAGES.product;
  const [failedSrc, setFailedSrc] = useState(null);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const showingFallback = failedSrc !== null && failedSrc === src;
  const imgSrc = showingFallback ? effectiveFallback : src;

  const handleError = () => {
    if (showingFallback) {
      // The fallback itself failed: never re-set the same dead
      // URL (the old handler would loop). Keep it displayed and
      // stop reacting to further error events for this src.
      setFallbackFailed(true);
      return;
    }
    setFallbackFailed(false);
    setFailedSrc(src);
  };

  return (
    <img
      src={imgSrc}
      srcSet={showingFallback ? undefined : srcSet}
      sizes={sizes}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      alt={alt}
      className={className}
      onError={fallbackFailed && showingFallback ? undefined : handleError}
    />
  );
}

export default ImageWithFallback;
