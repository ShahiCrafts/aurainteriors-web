import { useState, useRef, useEffect, useCallback } from "react";
import { validateMediaUrl } from "../../utils/safeUrl";

export default function ImageMagnifier({
  src,
  alt,
  srcSet,
  sizes,
  magnifierSize = 150,
  zoomLevel = 2.5,
  className = "",
}) {
  // FE-03: the src reaches TWO sinks here — the <img> and a CSS
  // url('…') token built by string interpolation. validateMediaUrl
  // rejects any value containing a quote/backslash (the breakout
  // characters for the CSS token) as well as non-allowlisted hosts,
  // so the interpolated value cannot terminate the url('…') token.
  // An invalid src renders no image and no magnifier.
  const safeSrc = validateMediaUrl(src, { fallback: null });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierStyle, setMagnifierStyle] = useState({});
  const containerRef = useRef(null);

  // FE-54: the container rect is CACHED, not re-read per mousemove
  // (getBoundingClientRect forces layout). It is read at most once
  // per animation frame, and only after invalidation: a new hover
  // session, a scroll, or a resize. Pointer updates are coalesced
  // through requestAnimationFrame — a burst of mousemove events
  // schedules a single frame, which performs the single state write.
  const rectRef = useRef(null);
  const rafRef = useRef(null);
  const pendingPointRef = useRef(null);

  const invalidateRect = useCallback(() => {
    rectRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", invalidateRect, true);
    window.addEventListener("resize", invalidateRect);
    return () => {
      window.removeEventListener("scroll", invalidateRect, true);
      window.removeEventListener("resize", invalidateRect);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [invalidateRect]);

  const applyPoint = useCallback(
    (clientX, clientY) => {
      if (!containerRef.current || !safeSrc) return;
      if (!rectRef.current) {
        rectRef.current = containerRef.current.getBoundingClientRect();
      }
      const { left, top, width, height } = rectRef.current;
      const x = clientX - left;
      const y = clientY - top;

      if (x < 0 || x > width || y < 0 || y > height) {
        setShowMagnifier(false);
        return;
      }

      // FE-54 positioning fix: backgroundSize and backgroundPosition
      // are BOTH in px now. The old mix (size in px, position in %)
      // cannot compose — a % position aligns the % point of the
      // background with the % point of the lens — so the magnified
      // region drifted from the cursor at the edges. In px, the
      // offset -(cursor * zoom - lens/2) puts the cursor point
      // exactly at the lens centre at every position, corners
      // included. The lens itself moves by transform only (no
      // left/top writes, so no layout work per frame).
      setMagnifierStyle({
        transform: `translate(${x - magnifierSize / 2}px, ${y - magnifierSize / 2}px)`,
        backgroundImage: `url('${safeSrc}')`,
        backgroundSize: `${width * zoomLevel}px ${height * zoomLevel}px`,
        backgroundPosition: `${-(x * zoomLevel - magnifierSize / 2)}px ${-(y * zoomLevel - magnifierSize / 2)}px`,
      });
      setShowMagnifier(true);
    },
    [safeSrc, magnifierSize, zoomLevel]
  );

  const handleMouseMove = (e) => {
    pendingPointRef.current = { clientX: e.clientX, clientY: e.clientY };
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const point = pendingPointRef.current;
      pendingPointRef.current = null;
      if (point) applyPoint(point.clientX, point.clientY);
    });
  };

  const handleMouseEnter = () => {
    // Fresh hover session: re-read the rect on the next frame. The
    // lens itself appears only once that frame has positioned it —
    // showing it earlier would flash an unpositioned lens at 0,0.
    invalidateRect();
  };

  const handleMouseLeave = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    pendingPointRef.current = null;
    setShowMagnifier(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: "crosshair" }}
    >
      <img
        src={safeSrc || undefined}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {showMagnifier && (
        <div
          className="absolute pointer-events-none rounded-full border-4 border-white shadow-xl"
          style={{
            left: 0,
            top: 0,
            width: `${magnifierSize}px`,
            height: `${magnifierSize}px`,
            backgroundRepeat: "no-repeat",
            zIndex: 20,
            ...magnifierStyle,
          }}
        />
      )}
    </div>
  );
}
