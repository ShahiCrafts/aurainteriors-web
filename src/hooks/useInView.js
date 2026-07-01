import { useEffect, useRef, useState } from "react";

/**
 * useInView — lightweight IntersectionObserver hook.
 *
 * @param {IntersectionObserverInit} options  – threshold, rootMargin, etc.
 * @param {boolean} once  – if true (default), stays "in view" after first intersection
 *                          so data is never re-fetched when the user scrolls back up.
 * @returns {[React.RefObject, boolean]}  [ref to attach to element, isInView]
 */
export default function useInView(options = {}, once = true) {
  const ref = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

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
        ...options,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [once]); // options object intentionally excluded – callers should memoize if needed

  return [ref, isInView];
}
