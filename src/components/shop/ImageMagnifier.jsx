import { useRef, useState } from "react";

export default function ImageMagnifier({
  src,
  srcSet,
  sizes,
  alt = "",
  magnifierSize = 120,
  zoomLevel = 2.5,
  className = "",
  ...rest
}) {
  const wrapRef = useRef(null);
  const [pos, setPos] = useState(null); // { x, y, w, h } relative to wrapper

  const handleMove = (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return; // no lens on touch
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setPos(null);
      return;
    }
    setPos({ x, y, w: rect.width, h: rect.height });
  };

  const r = magnifierSize / 2;

  return (
    <div
      ref={wrapRef}
      className="relative z-0 h-full w-full cursor-crosshair overflow-hidden"
      onPointerMove={handleMove}
      onPointerLeave={() => setPos(null)}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        draggable={false}
        className={`select-none ${className}`}
        {...rest}
      />

      {pos && (
        <div
          className="pointer-events-none absolute left-0 top-0 overflow-hidden rounded-full bg-white"
          style={{
            width: magnifierSize,
            height: magnifierSize,
            transform: `translate(${pos.x - r}px, ${pos.y - r}px)`,
            boxShadow: "0 0 0 3px #fff, 0 6px 20px rgba(0,0,0,0.25)",
          }}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              maxWidth: "none",
              width: pos.w * zoomLevel,
              height: pos.h * zoomLevel,
              left: r - pos.x * zoomLevel,
              top: r - pos.y * zoomLevel,
              objectFit: "cover",
            }}
          />
        </div>
      )}
    </div>
  );
}
