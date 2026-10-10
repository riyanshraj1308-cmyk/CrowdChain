import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Button from "./Button";

/**
 * PageHero — the shared header band for every tab.
 *
 * The band itself is transparent: the fixed full-page Auralis backdrop
 * (PageBackdrop, mounted once in App.jsx) shows through at full strength, so
 * the WebGL ember field covers the WHOLE page rather than a rectangle behind
 * the header. A dark veil guards the overlaid white text in both themes.
 */
export default function PageHero({ kicker, icon: KickerIcon, title, children, cta, ctaTo = "/explore" }) {
  return (
    <section className="relative">
      {/* Legibility scrim over the shared backdrop. Theme-aware: on the dark
          theme the backdrop is already near-black, so a heavy black veil
          would draw a visible darker BOX around the hero — there it's a
          faint vignette. On light it guards white text more firmly. The
          scrim bleeds BELOW the section and fades to nothing there, so the
          hero band melts into the page ramp with no visible boundary. */}
      <div
        aria-hidden="true"
        className="hero-scrim-light absolute inset-x-0 top-0 h-[calc(100%+360px)]"
        style={{
          background: [
            "linear-gradient(to right, rgba(1,1,3,0.55) 0%, rgba(1,1,3,0.16) 55%, rgba(1,1,3,0.38) 100%)",
            "linear-gradient(to bottom, rgba(6,5,14,0.42) 0%, rgba(6,5,14,0.20) 40%, rgba(6,5,14,0.08) 72%, rgba(6,5,14,0) 86%)",
          ].join(", "),
        }}
      />
      <div
        aria-hidden="true"
        className="hero-scrim-dark absolute inset-x-0 top-0 h-[calc(100%+360px)]"
        style={{
          background: [
            "linear-gradient(to right, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.04) 55%, rgba(0,0,0,0.14) 100%)",
            "linear-gradient(to bottom, rgba(0,0,0,0.26) 0%, rgba(0,0,0,0.10) 42%, rgba(0,0,0,0.03) 72%, rgba(0,0,0,0) 86%)",
          ].join(", "),
        }}
      />
      {/* Top hairline anchors the scrim to the nav the way a shadow does —
          soft on the sides and bottom, never a closed box. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(to right, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 55%, rgba(255,255,255,0.08))" }}
      />
      <div className="container-page relative flex min-h-[clamp(240px,34vh,360px)] flex-col justify-end pb-10 pt-16 sm:pb-12">
        <div className="max-w-2xl">
          {kicker && (
            <div className="flex items-center gap-2">
              {KickerIcon && <KickerIcon className="h-5 w-5 text-violet-300" aria-hidden="true" />}
              <span className="text-xs font-semibold uppercase tracking-wide text-violet-300">
                {kicker}
              </span>
            </div>
          )}
          <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl">{title}</h1>
          {children && <div className="mt-3 text-sm leading-relaxed text-white/72 sm:text-base">{children}</div>}
          {cta && (
            <Button
              as={Link}
              to={ctaTo}
              variant="secondary"
              className="!border-white/25 !text-white hover:!bg-white/10 mt-6"
              icon={ArrowRight}
              iconPosition="right"
            >
              {cta}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
