import { ReactLenis, useLenis } from "lenis/react";
import { forwardRef, useEffect } from "react";

/**
 * App-wide smooth scrolling.
 *
 * The former Lenis-driven section snap (every wheel gesture eased to the
 * nearest [data-section] boundary — a "one page at a time" feel) has been
 * removed: the page now scrolls freely with Lenis's own inertia, and small
 * scrolls stay where the user leaves them.
 *
 * The ThreeUI globe stage still releases its wheel events to this Lenis
 * instance (GlobeStudy → postMessage → App bridge → lenis.scrollTo), so
 * scrolling over the globe keeps the same smooth inertia as the rest of
 * the page.
 */
const SnapScroll = forwardRef(function SnapScroll(
  { children, options, lenisRef, ...props },
  ref
) {
  return (
    <ReactLenis root options={{ lerp: 0.1, wheelMultiplier: 1, ...options }}>
      <LenisRefSink lenisRef={lenisRef} />
      <main ref={ref} {...props}>
        {children}
      </main>
    </ReactLenis>
  );
});

function LenisRefSink({ lenisRef }) {
  const lenis = useLenis();

  useEffect(() => {
    // Debug/test handle — lets the app (and verification tooling) reach the
    // live instance without drilling through React context.
    window.__lenis = lenis || null;
    return () => {
      if (window.__lenis === lenis) window.__lenis = null;
    };
  }, [lenis]);

  if (lenisRef) lenisRef.current = lenis;
  return null;
}

export default SnapScroll;
