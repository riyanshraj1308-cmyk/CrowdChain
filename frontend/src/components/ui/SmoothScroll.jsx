import { ReactLenis, useLenis } from "lenis/react";
import { forwardRef } from "react";

/**
 * App-wide smooth scrolling.
 *
 * Renders a Lenis root so the whole document scrolls with inertia smoothing.
 * Wrap the app's scrollable content once (see App.jsx) — every page inherits
 * the behavior, no per-page setup needed.
 *
 * `lenisRef` lets App.jsx reach the Lenis instance (currently: the globe
 * iframe's wheel bridge). The assignment happens inside `LenisRefSink`, a
 * child of the provider, because `useLenis` can only read the instance from
 * within the ReactLenis tree.
 */
const SmoothScroll = forwardRef(function SmoothScroll(
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
  if (lenisRef) lenisRef.current = lenis;
  return null;
}

export default SmoothScroll;
