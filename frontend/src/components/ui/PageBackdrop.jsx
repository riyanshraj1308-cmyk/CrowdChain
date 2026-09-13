import Auralis from "./Auralis";

/**
 * PageBackdrop — the full-page Auralis layer for inner tabs.
 *
 * Fixed to the viewport behind all page content (z-index 0, pointer-events
 * none): the WebGL violet-ember noise field covers the WHOLE page instead of
 * only the header band. The page content sits above it in a `.tab-content`
 * wrapper whose paper gradient fades in below the hero, so the backdrop shows
 * at full strength behind the PageHero and shimmers faintly behind the rest.
 */
export default function PageBackdrop() {
  return (
    <div className="tab-bg" aria-hidden="true">
      <Auralis
        height="100%"
        colors={["#a99bff", "#c9c0ff", "#7c6cff"]}
        speed={0.2}
        grain={0.4}
      />
    </div>
  );
}
