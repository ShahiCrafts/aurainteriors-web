import { useEffect, useRef, useState } from "react";
import lottie from "lottie-web";
import animationData from "../../assets/not-found/market-research.json";

// 404 animation: the owner's Lottie artwork (Market_research.lottie,
// supplied 2026-11-03) replacing the hand-rolled animated SVG "404"
// text that this page used before.
//
// Same playback approach as the chat empty-state animation
// (components/chat/DotLottieAnimation.jsx): the FE-07 rule holds —
// nothing is fetched from a third-party runtime. The animation is
// the JSON extracted from the supplied .lottie package, bundled as
// a local asset (src/assets/not-found/market-research.json), and
// played by lottie-web — a pure-JS player with no WASM and no
// network fetches. This module is only reached through
// NotFoundPage's lazy() import, so the player stays out of the
// main bundle.
//
// Like the chat animation, it always plays and loops, including
// under OS reduced-motion — the owner's standing decision from
// 2026-11-01 for brand animations.
//
// If the player ever fails to initialise, a static "404" renders in
// the same box rather than a hole in the page.
const NotFoundAnimation = () => {
  const containerRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    let animation;
    try {
      animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
        },
      });
    } catch {
      setFailed(true);
    }
    return () => {
      animation?.destroy();
    };
  }, []);

  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      role="img"
      aria-label="Illustration of a person searching with a magnifying glass"
    >
      {failed ? (
        <span
          aria-hidden="true"
          className="font-playfair text-7xl font-bold text-teal-700"
        >
          404
        </span>
      ) : (
        <div ref={containerRef} className="w-full h-full" aria-hidden="true" />
      )}
    </div>
  );
};

export default NotFoundAnimation;
