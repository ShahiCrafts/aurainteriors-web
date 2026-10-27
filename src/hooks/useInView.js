import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useInView — lightweight IntersectionObserver hook.
 *
 * @param {IntersectionObserverInit} options  – threshold, rootMargin, etc.
 * @param {boolean} once  – if true (default), stays "in view" after first intersection
 *                          so data is never re-fetched when the user scrolls back up.
 * @returns {[React.RefCallback, boolean]}  [callback ref to attach to the element, isInView]
 *
 * FE-32: this returns a CALLBACK ref, not a RefObject. The old
 * implementation read ref.current once inside an effect with deps
 * [once]; when the element mounted later (conditional/async render)
 * ref.current was null at that moment, the effect early-returned, and
 * the element was NEVER observed — isInView stayed false forever and
 * the gated section stayed blank. A callback ref fires exactly when
 * the node attaches/detaches, so late-mounted and swapped elements are
 * observed as they appear. Callers use it identically: ref={ref}.
 */
export default function useInView(options = {}, once = true) {
  const [isInView, setIsInView] = useState(false);
  const observerRef = useRef(null);
  const optionsRef = useRef(options);
  // Keep the latest options readable by the callback ref without
  // writing a ref during render (react-hooks/refs).
  useEffect(() => {
    optionsRef.current = options;
  });

  const setRef = useCallback(
    (node) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;

      // Skip on environments without IntersectionObserver (SSR, old browsers)
      if (typeof IntersectionObserver === "undefined") {
        setIsInView(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setIsInView(false);
          }
        },
        {
          // Start loading ~200px before the section reaches the viewport
          rootMargin: "0px 0px 200px 0px",
          threshold: 0,
          ...optionsRef.current,
        }
      );

      observerRef.current = observer;
      observer.observe(node);
    },
    [once]
  );

  // Disconnect on unmount (the callback ref also fires with null then,
  // but an unmount during a pending disconnect must not leak).
  useEffect(
    () => () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    },
    []
  );

  return [setRef, isInView];
}
