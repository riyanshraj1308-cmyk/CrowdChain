import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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
    <section className="relative overflow-hidden border-b border-white/10">
      {/* legibility scrim over the shared backdrop: a dark veil keeps the band
          an ember stage in both themes, plus a horizontal gradient guarding
          the text side. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: [
            "linear-gradient(to right, rgba(1,1,3,0.62) 0%, rgba(1,1,3,0.22) 55%, rgba(1,1,3,0.46) 100%)",
            "rgba(6, 5, 14, 0.26)",
          ].join(", "),
        }}
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
            <Link
              to={ctaTo}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-display text-sm font-semibold text-ink-950 shadow-lifted transition-transform hover:-translate-y-0.5"
            >
              {cta}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
