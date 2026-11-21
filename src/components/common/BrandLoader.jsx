import { useEffect, useRef } from "react";

// The ONE loading animation for the whole product: the brand tiles
// from public/loading.json — the same file the first-paint splash in
// index.html plays. Every loading state (sign-in, typing, uploads,
// sending) uses this component so there is exactly one loading
// animation to maintain. State illustrations (404, chat empty state)
// are separate artwork and deliberately not handled here.
//
// Played by lottie-web (pure JS, no CDN fetches — the FE-07 rule),
// imported lazily inside the effect: the player probes canvas at
// module load, so a static import would crash non-browser
// environments and bloat every bundle that touches this component.
// If the player or the file ever fails, an empty box renders rather
// than a substitute spinner: one loading animation means one.
const BrandLoader = ({ size = 120, className = "" }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    let animation;
    let cancelled = false;
    import("lottie-web")
      .then(({ default: lottie }) => {
        if (cancelled || !containerRef.current) return;
        animation = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: "/loading.json",
        });
      })
      .catch(() => {
        // Empty box is the designed failure mode (see header comment).
      });
    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className={className}
      role="status"
      aria-label="Loading"
    />
  );
};

export default BrandLoader;
