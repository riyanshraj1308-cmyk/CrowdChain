import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/deepfield.css";

/**
 * DEEPFIELD — a one-screen studio site over flooded-stone footage.
 *
 * Design rules baked into this file:
 *  - No scroll, ever: the document is locked to one viewport height.
 *  - The middle of the frame stays EMPTY. Copy is a caption in the left
 *    third; the index is a corner detail. The light shaft, fish and sand
 *    are the content.
 *  - Pointer parallax is slow (lerp 0.045, ±14/11px) so it reads as camera
 *    drift, not a mouse gimmick; it doesn't exist on coarse pointers.
 *  - The video autoplay logic handles cached files (readyState >= 2) and
 *    rejected play() promises (iOS Low Power Mode), with a 2.6s fallback.
 */

const VIDEO_PRIMARY =
  "https://assets.mixkit.co/videos/4466/4466-1080.mp4"; // "Sky view from underwater"
const VIDEO_FALLBACK =
  "https://assets.mixkit.co/videos/4116/4116-1080.mp4"; // "Diver under the water"

const PROJECTS = [
  { name: "Marisco Atlantic", discipline: "Identity" },
  { name: "Hydra Systems", discipline: "Motion" },
  { name: "Casa do Sal", discipline: "Site" },
  { name: "Nordkapp", discipline: "Film" },
];

const NAV = ["Work", "Studio", "Journal", "Contact"];

export default function Deepfield() {
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const rafRef = useRef(0);
  const [videoOk, setVideoOk] = useState(false);

  // ── Resilient autoplay ────────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let cancelled = false;

    const tryPlay = () => {
      if (cancelled) return;
      const p = v.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          /* iOS Low Power Mode etc. — poster frame remains */
        });
      }
    };

    // `loadeddata` may already have fired for a cached file — check
    // readyState too, and keep a timer fallback so we never hold a dead poster.
    if (v.readyState >= 2) {
      setVideoOk(true);
      tryPlay();
    } else {
      v.addEventListener("loadeddata", () => {
        if (cancelled) return;
        setVideoOk(true);
        tryPlay();
      });
    }
    v.addEventListener("canplay", tryPlay);
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      if (v.readyState >= 2) setVideoOk(true);
      tryPlay();
    }, 2600);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      v.removeEventListener("canplay", tryPlay);
    };
  }, []);

  // ── Pointer parallax: slow ease, capped drift, desktop pointers only ─────
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const stage = stageRef.current;
    const media = stage?.querySelector(".df-media");
    if (!media) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let running = true;

    const onMove = (e) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      tx = Math.max(-14, Math.min(14, -nx * 28));
      ty = Math.max(-11, Math.min(11, -ny * 22));
    };
    const frame = () => {
      if (!running) return;
      cx += (tx - cx) * 0.045;
      cy += (ty - cy) * 0.045;
      media.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0) scale(1.06)`;
      rafRef.current = window.requestAnimationFrame(frame);
    };
    window.addEventListener("pointermove", onMove);
    rafRef.current = window.requestAnimationFrame(frame);
    return () => {
      running = false;
      window.cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="df" data-pet-block>
      {/* z0 — the plate */}
      <div className="df-stage" ref={stageRef}>
        <div className="df-media">
          <video
            ref={videoRef}
            className="df-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster=""
            style={{ opacity: videoOk ? 1 : 0 }}
          >
            <source src={VIDEO_PRIMARY} type="video/mp4" />
            <source src={VIDEO_FALLBACK} type="video/mp4" />
          </video>
        </div>
        {/* z1 — grade */}
        <div className="df-grade" />
        {/* z2 — scrim ladder */}
        <div className="df-scrims" />
        {/* z3 — grain */}
        <div className="df-grain" />
      </div>

      {/* z4 — chrome */}
      <header className="df-nav">
        <Link to="/" className="df-mark" aria-label="Deepfield home">
          <span className="df-mark-square" />
          Deepfield
        </Link>
        <nav className="df-links" aria-label="Deepfield">
          {NAV.map((n) => (
            <a key={n} href="#work" onClick={(e) => e.preventDefault()}>
              {n}
            </a>
          ))}
        </nav>
        <span className="df-status">
          <span className="df-status-dot" />
          Two slots — Q3
        </span>
      </header>

      <main className="df-copy">
        <h1 className="df-h1">
          Deep work for brands
          <br />
          that only get one look.
        </h1>
        <p className="df-sub">
          Deepfield is a four-person studio in Lisbon working in identity, motion, and the
          places the two meet. We take three projects a year.
        </p>
        <a
          className="df-btn"
          href="#work"
          onClick={(e) => e.preventDefault()}
        >
          See the work
          <span className="df-btn-arrow" aria-hidden="true">
            →
          </span>
        </a>
      </main>

      <aside className="df-index" aria-label="Selected projects">
        <div className="df-index-head">
          <span>Selected</span>
          <span>2026</span>
        </div>
        <ul>
          {PROJECTS.map((p) => (
            <li key={p.name}>
              <a href="#project" onClick={(e) => e.preventDefault()}>
                <span className="df-index-name">{p.name}</span>
                <span className="df-index-disc">{p.discipline}</span>
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <p className="df-place">38.7223° N · 9.1393° W</p>
    </div>
  );
}
