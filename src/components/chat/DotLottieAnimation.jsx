import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import lottie from "lottie-web";
import animationData from "../../assets/chat/ai-logo-foriday.json";

// Chat empty-state animation: the owner's Lottie artwork
// (AI_logo_Foriday.lottie, supplied 2026-11-01) replacing the
// CSS/SVG typing-dots bubble that FE-07 fell back to.
//
// FE-07 still holds: nothing is fetched from a third-party runtime
// at runtime. The banned player was @lottiefiles/dotlottie-web,
// whose WASM loader keeps a hard-coded CDN backup URL; this uses
// lottie-web instead — a pure-JS player with no WASM and no network
// fetches — and the animation itself is the JSON extracted from the
// supplied .lottie package, bundled as a local asset
// (src/assets/chat/ai-logo-foriday.json). This module is only ever
// reached through ChatWindow's lazy() import, so the player stays
// out of the main bundle. tests/security/dotlottieCdnGuard.test.js
// scans for the @lottiefiles packages / CDN domain and stays green.
//
// The animation always plays and loops — including for visitors
// whose OS requests reduced motion. An earlier version froze the
// first frame in that case; the owner reviewed that behaviour on
// 2026-11-01 (their own machine has Reduce Motion on, which made
// the empty state look broken-static) and directed that the brand
// animation always animate. Deliberate owner decision, not an
// oversight — do not re-add the freeze without asking.
//
// If the player ever fails to initialise, a pulsing sparkle renders
// in the same labelled box rather than a hole in the empty state.
const EmptyStateAnimation = () => {
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
      aria-label="Aura assistant is ready to chat"
    >
      {failed ? (
        <Sparkles
          size={40}
          className="text-[#F27318] animate-pulse"
          aria-hidden="true"
        />
      ) : (
        <div ref={containerRef} className="w-full h-full" aria-hidden="true" />
      )}
    </div>
  );
};

export default EmptyStateAnimation;
