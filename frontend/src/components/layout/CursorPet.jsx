import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * CursorPet — a pixel-art companion that roams the page like it lives there.
 *
 * Reads an 8x4 sprite sheet (grid of 246x246 cells at /pet-sprite.png):
 *   row 0: idle / groom / sleep   row 1: N,S,E,W walk (2-frame pairs)
 *   row 2: diagonals (2-frame pairs, leap/pounce poses)
 *   row 3: edge scratches
 *
 * Ground rules that make it feel part of the page (not an overlay):
 *  - Components are boundaries. Text, buttons, links, inputs, media and any
 *    [data-pet-block] region are obstacles: the pet slides along their edges
 *    instead of crossing them (axis-separated movement, wall-slide style).
 *  - On the landing page it stays off-screen until the first scroll, then
 *    walks in from the bottom edge. On every other page it is present.
 *  - Scrolling leaves it behind: the page's motion drags the pet with the
 *    content, and it trots back to the cursor once scrolling settles.
 */

const SPRITE_COLS = 8;
const SPRITE_ROWS = 4;

// Everything the pet treats as a wall. Content boxes (text, controls, media)
// and explicit [data-pet-block] regions. Plain empty layout containers stay
// walkable — otherwise the pet could never move at all.
const BLOCK_SELECTOR = [
  "[data-pet-block]",
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  "[role='button']",
  "[role='menuitem']",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "li",
  "blockquote",
  "pre",
  "code",
  "figcaption",
  "img",
  "video",
  "iframe",
  "svg",
  "canvas",
  "table",
  "progress",
].join(",");

// Octant names for movement angles (screen coords, y grows downward).
const OCTANTS = [
  "west", // -PI
  "northwest", // -3PI/4
  "north", // -PI/2
  "northeast", // -PI/4
  "east", // 0
  "southeast", // +PI/4
  "south", // +PI/2
  "southwest", // +3PI/4
  "west", // +PI (same as -PI)
];

// How far outside the viewport the pet may sit while walking in / waiting.
const MARGIN = 72;

// Routes where the pet never appears.
const EXCLUDED_PATHS = ["/deepfield"];

export default function CursorPet({
  behavior = "Follow Cursor",
  spriteSheet = "/pet-sprite.png",
  size = 48,
  speed = 14,
  frameRate = 11,
  stopDistance = 26,
  escapeRadius = 140,
  idleAnticsChance = 6,
  pixelSnap = true,
  showHearts = true,
  particleCharacter = "❤",
  particleColour = "#FF4F81",
  particleAmount = 10,
  particleSize = 18,
  // On the landing page the pet only enters after the first scroll.
  enterOnScrollOnLanding = true,
}) {
  const location = useLocation();
  const onLanding = location.pathname === "/";
  // Motion-sensitive users get a still companion: the pet renders parked in
  // a corner (clickable for hearts) but never roams.
  const [reducedMotion, setReducedMotion] = useState(false);
  // The pet lives in the Groundwork app, not on the chrome-free showcase
  // page (its whole surface is content-boundary there anyway).
  const excluded = EXCLUDED_PATHS.includes(location.pathname);
  const [admitted, setAdmitted] = useState(
    // Non-landing pages: always present. Landing: wait for the first scroll.
    !enterOnScrollOnLanding || !onLanding
  );
  const [entered, setEntered] = useState(false);
  const [frame, setFrame] = useState({ row: 0, col: 0 });
  const [petPos, setPetPos] = useState({ x: -999, y: -999 });
  const [particles, setParticles] = useState([]);

  const petPosRef = useRef({ x: -999, y: -999 });
  const cursorRef = useRef({ x: -999, y: -999 });
  const walkStepRef = useRef(0);
  const tickRef = useRef(0);
  const anticsRef = useRef({ type: "none", ticks: 0 });
  const timeoutsRef = useRef([]);
  const particleIdRef = useRef(0);
  // Scroll "lag": while the page scrolls the pet is carried with the content
  // (offset grows opposite to the scroll direction), then it catches up.
  const graceRef = useRef(0);
  const lagRef = useRef(0);
  // Hysteresis: remembered escape destination + polite-wait timer, so the
  // pet doesn't recompute a fresh escape every tick and jitter in place.
  const escapeTargetRef = useRef(null);
  const restRef = useRef(0);
  // Obstacle probe lives in a ref so effects can call the freshest logic
  // without re-running when it changes identity between renders.
  const isBlockedRef = useRef(() => false);
  const lastScrollYRef = useRef(0);
  const seenCursorRef = useRef(false);

  const spriteSrc =
    typeof spriteSheet === "string"
      ? spriteSheet
      : spriteSheet && typeof spriteSheet.src === "string"
      ? spriteSheet.src
      : "/pet-sprite.png";

  // ── Admission gate ───────────────────────────────────────────────────────
  // Excluded routes: never. Landing: only after the first scroll. Anywhere
  // else: immediately (the pet already "lives" on the site).
  useEffect(() => {
    if (excluded) {
      setAdmitted(false);
      return;
    }
    if (!enterOnScrollOnLanding || !onLanding) {
      setAdmitted(true);
      return;
    }
    let admittedHere = false;
    const admit = () => {
      if (admittedHere) return;
      admittedHere = true;
      setAdmitted(true);
      window.removeEventListener("scroll", admit, true);
      window.removeEventListener("wheel", admit, true);
      window.removeEventListener("touchmove", admit, true);
    };
    // Lenis drives native scroll, so a scroll listener catches it; wheel and
    // touchmove cover edge cases (e.g. momentum before the first event).
    window.addEventListener("scroll", admit, true);
    window.addEventListener("wheel", admit, true);
    window.addEventListener("touchmove", admit, true);
    return () => {
      window.removeEventListener("scroll", admit, true);
      window.removeEventListener("wheel", admit, true);
      window.removeEventListener("touchmove", admit, true);
    };
  }, [onLanding, enterOnScrollOnLanding, excluded]);

  // Reduced motion: park it in the bottom-left corner — fully visible and
  // clickable, but it never roams (the movement loop is gated off).
  useEffect(() => {
    if (!admitted || !reducedMotion) return;
    const park = { x: MARGIN + size, y: window.innerHeight - MARGIN - size };
    petPosRef.current = park;
    setPetPos(park);
    setEntered(true);
  }, [admitted, reducedMotion, size]);

  // Spawn once admitted: trot in from just below the bottom edge, through a
  // gap that isn't itself occupied by content.
  useEffect(() => {
    if (!admitted || entered || reducedMotion) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const candidates = [0.68, 0.5, 0.32, 0.85, 0.15].map((f) => ({
      x: Math.round(w * f),
      y: h + MARGIN,
    }));
    const startY = h - MARGIN - 1;
    const start =
      candidates.find((c) => !isBlockedRef.current(c.x, startY)) ||
      candidates[0];
    petPosRef.current = start;
    setPetPos(start);
    // Short grace so the walk-in never reads as content-crossing, but the
    // wall rules can't freeze it right at the viewport edge.
    graceRef.current = 12;
    if (!seenCursorRef.current) {
      // Park the attractor somewhere open — scan the middle band bottom-up
      // (open space tends to live below content-dense heroes).
      let parked = null;
      for (let fy = 0.82; fy >= 0.3 && !parked; fy -= 0.06) {
        for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) {
          if (!isBlockedRef.current(fx * w, fy * h)) {
            parked = { x: fx * w, y: fy * h };
            break;
          }
        }
      }
      cursorRef.current = parked || { x: w * 0.5, y: h - MARGIN * 2 };
    }
    // Fade in fast so the walk-in from the edge is actually visible.
    const t = window.setTimeout(() => setEntered(true), 250);
    return () => window.clearTimeout(t);
  }, [admitted, entered, reducedMotion]);

  const setFrameSafe = (row, col) => setFrame({ row, col });

  const classifyDirection = (nx, ny) => {
    const oct = Math.round(Math.atan2(ny, nx) / (Math.PI / 4));
    return OCTANTS[oct + 4];
  };

  const directionFrame = (dir, step) => {
    const walk = step % 2;
    const map = {
      north: { row: 1, col: 0 },
      south: { row: 1, col: 2 },
      east: { row: 1, col: 4 },
      west: { row: 1, col: 6 },
      northeast: { row: 2, col: 0 },
      northwest: { row: 2, col: 2 },
      southeast: { row: 2, col: 4 },
      southwest: { row: 2, col: 6 },
    };
    const entry = map[dir];
    return { row: entry.row, col: entry.col + walk };
  };

  // ── Obstacle sensing ─────────────────────────────────────────────────────
  // A point is "blocked" when the page element visually under it is content
  // the pet must treat as a wall. Our own overlay elements are ignored.
  // Probed at center plus a ring matching the cat's visible body (the 48px
  // sprite cell has transparent padding), so the animal itself — not just its
  // bounding box — never crosses text or components.
  const PROBE_RADIUS = Math.max(12, size * 0.32);
  const PROBES = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  isBlockedRef.current = (x, y, centerOnly = false) => {
    const probes = centerOnly ? PROBES.slice(0, 1) : PROBES;
    for (const [ox, oy] of probes) {
      const px = x + ox * PROBE_RADIUS;
      const py = y + oy * PROBE_RADIUS;
      if (px < MARGIN || px > window.innerWidth - MARGIN) return true;
      if (py < MARGIN || py > window.innerHeight - MARGIN) return true;
      const stack = document.elementsFromPoint(px, py);
      let blockedHere = true; // empty stack = treated as walled
      for (const el of stack) {
        if (el.closest("[data-pet-root]")) continue;
        blockedHere = Boolean(el.closest(BLOCK_SELECTOR));
        break;
      }
      if (blockedHere) return true;
    }
    return false;
  };

  useEffect(() => {
    if (typeof document === "undefined") return;
    const styleEl = document.createElement("style");
    styleEl.textContent = `@keyframes cursorPetHeartBurst{0%{transform:translate(0,0) scale(.3) rotate(0deg);opacity:0}20%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.25) rotate(var(--rot));opacity:0}}`;
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const handleMove = (event) => {
      cursorRef.current = { x: event.clientX, y: event.clientY };
      seenCursorRef.current = true;
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // Track scroll velocity → the pet gets "left behind" while the page moves.
  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    const onScroll = () => {
      const delta = window.scrollY - lastScrollYRef.current;
      lastScrollYRef.current = window.scrollY;
      // Content moving up (scrolling down) drags the pet downward.
      lagRef.current = Math.max(-260, Math.min(260, lagRef.current + delta * 0.75));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    if (!admitted || reducedMotion) return;
    const targetMs = 1000 / Math.max(1, frameRate);
    let last = 0;
    let raf = 0;
    const loop = (time) => {
      raf = window.requestAnimationFrame(loop);
      if (time - last < targetMs) return;
      last = time;
      tickRef.current += 1;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const { x, y } = petPosRef.current;
      const nearEdge = {
        top: y <= size,
        bottom: y >= h - size,
        left: x <= size,
        right: x >= w - size,
      };

      const updateIdle = () => {
        if (anticsRef.current.ticks > 0) {
          anticsRef.current.ticks -= 1;
          if (anticsRef.current.type === "groom")
            setFrameSafe(0, 5 + (tickRef.current % 3));
          else if (anticsRef.current.type === "sleepDrowsy") setFrameSafe(0, 2);
          else if (anticsRef.current.type === "sleepLoop")
            setFrameSafe(0, 3 + (tickRef.current % 2));
          else if (anticsRef.current.type === "scratchTop")
            setFrameSafe(3, tickRef.current % 2);
          else if (anticsRef.current.type === "scratchBottom")
            setFrameSafe(3, 2 + (tickRef.current % 2));
          else if (anticsRef.current.type === "scratchRight")
            setFrameSafe(3, 4 + (tickRef.current % 2));
          else if (anticsRef.current.type === "scratchLeft")
            setFrameSafe(3, 6 + (tickRef.current % 2));
          if (
            anticsRef.current.ticks === 0 &&
            anticsRef.current.type === "sleepDrowsy"
          ) {
            anticsRef.current = { type: "sleepLoop", ticks: 40 };
          } else if (anticsRef.current.ticks === 0) {
            anticsRef.current = { type: "none", ticks: 0 };
            setFrameSafe(0, 0);
          }
          return;
        }

        const chance = Math.max(0, Math.min(100, idleAnticsChance)) / 100;
        if (Math.random() < chance) {
          const scratchCandidates = [];
          if (nearEdge.top) scratchCandidates.push("scratchTop");
          if (nearEdge.bottom) scratchCandidates.push("scratchBottom");
          if (nearEdge.right) scratchCandidates.push("scratchRight");
          if (nearEdge.left) scratchCandidates.push("scratchLeft");
          if (scratchCandidates.length > 0 && Math.random() < 0.5) {
            const kind =
              scratchCandidates[
                Math.floor(Math.random() * scratchCandidates.length)
              ];
            anticsRef.current = { type: kind, ticks: 24 };
          } else if (Math.random() < 0.5) {
            anticsRef.current = { type: "groom", ticks: 24 };
          } else {
            anticsRef.current = { type: "sleepDrowsy", ticks: 12 };
          }
          return;
        }
        setFrameSafe(0, 0);
      };

      // Ease the scroll-lag back to zero — this is the pet "catching up".
      lagRef.current *= 0.9;
      const lag = Math.abs(lagRef.current) < 1 ? 0 : lagRef.current;

      const rawTarget = cursorRef.current;
      const target = { x: rawTarget.x, y: rawTarget.y + lag };
      const dx = target.x - petPosRef.current.x;
      const dy = target.y - petPosRef.current.y;
      const dist = Math.hypot(dx, dy);

      if (behavior === "Run Away" && dist >= escapeRadius) {
        updateIdle();
        return;
      }
      const standingOnContent = isBlockedRef.current(
        petPosRef.current.x,
        petPosRef.current.y,
        true
      );
      const bodyFree = !isBlockedRef.current(petPosRef.current.x, petPosRef.current.y);
      if (bodyFree && escapeTargetRef.current) escapeTargetRef.current = null;

      // Waiting politely: when the cursor sits on content the pet cannot
      // cross, it walks to the nearest free edge and rests there for a
      // while instead of jittering against the wall.
      if (restRef.current > 0) {
        restRef.current -= 1;
        updateIdle();
        return;
      }
      const targetBlocked = isBlockedRef.current(target.x, target.y);
      if (
        bodyFree &&
        !standingOnContent &&
        (dist <= stopDistance || (targetBlocked && dist < 90))
      ) {
        restRef.current = 50; // ~4.5s, then it tries again
        updateIdle();
        return;
      }
      // It may only settle where its WHOLE body is clear of content — that
      // keeps it from resting half-on a button or text edge.
      if (dist <= stopDistance && bodyFree && !standingOnContent) {
        updateIdle();
        return;
      }

      const inv = dist > 0 ? 1 / dist : 0;
      let nx = dx * inv;
      let ny = dy * inv;
      if (behavior === "Run Away") {
        nx *= -1;
        ny *= -1;
      }

      // Axis-separated movement with wall sliding: try the full step, then
      // each axis alone, then give up (idle). The pet thus runs along the
      // edges of text blocks and controls instead of crossing them.
      // While entering from off-screen — or during the post-spawn grace —
      // the obstacle rules don't apply, so it can walk in and out from
      // under content instead of being frozen mid-overlap.
      const insideX =
        petPosRef.current.x > MARGIN && petPosRef.current.x < w - MARGIN;
      const insideY =
        petPosRef.current.y > MARGIN && petPosRef.current.y < h - MARGIN;
      const entering = !(insideX && insideY);
      if (graceRef.current > 0) graceRef.current -= 1;
      if (entering) graceRef.current = 8; // keep grace while walking in/out

      const stepX = petPosRef.current.x + nx * speed;
      const stepY = petPosRef.current.y + ny * speed;

      // Escape hatch: if the body sits on content, step to the nearest free
      // neighbour instead of pushing deeper toward the cursor.
      let next = null;
      if (entering || graceRef.current > 0) {
        next = { x: stepX, y: stepY };
      } else if (standingOnContent) {
        // Spiral out for the nearest free point, remember it, and step
        // toward it until reached (no per-tick re-scan jitter).
        const dirs = [
          [0, -1], [0, 1], [-1, 0], [1, 0],
          [-1, -1], [1, -1], [-1, 1], [1, 1],
        ];
        const R = speed * 1.5;
        let esc = escapeTargetRef.current;
        if (!esc || isBlockedRef.current(esc.x, esc.y, true)) {
          esc = null;
          outer: for (const mult of [1, 2, 3, 5, 8]) {
            for (const [ox, oy] of dirs) {
              const px = petPosRef.current.x + ox * R * mult;
              const py = petPosRef.current.y + oy * R * mult;
              if (!isBlockedRef.current(px, py)) {
                esc = { x: px, y: py };
                break outer;
              }
            }
          }
          escapeTargetRef.current = esc;
        }
        if (esc) {
          const tdx = esc.x - petPosRef.current.x;
          const tdy = esc.y - petPosRef.current.y;
          const td = Math.hypot(tdx, tdy) || 1;
          const step = Math.min(speed, td);
          next = {
            x: petPosRef.current.x + (tdx / td) * step,
            y: petPosRef.current.y + (tdy / td) * step,
          };
        } else {
          // Densely packed viewport: head for the open bottom band.
          next = { x: petPosRef.current.x, y: h - MARGIN * 2 };
        }
      } else if (!isBlockedRef.current(stepX, stepY)) {
        next = { x: stepX, y: stepY };
      } else if (!isBlockedRef.current(stepX, petPosRef.current.y)) {
        next = { x: stepX, y: petPosRef.current.y };
      } else if (!isBlockedRef.current(petPosRef.current.x, stepY)) {
        next = { x: petPosRef.current.x, y: stepY };
      }

      if (!next) {
        updateIdle();
        return;
      }

      walkStepRef.current += 1;
      const moveX = next.x - petPosRef.current.x;
      const moveY = next.y - petPosRef.current.y;
      const dir = classifyDirection(moveX, moveY);
      const f = directionFrame(dir, walkStepRef.current);
      setFrameSafe(f.row, f.col);

      petPosRef.current = next;
      setPetPos(next);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [
    admitted,
    reducedMotion,
    behavior,
    escapeRadius,
    frameRate,
    idleAnticsChance,
    size,
    speed,
    stopDistance,
  ]);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      if (typeof window !== "undefined") {
        timeouts.forEach((t) => window.clearTimeout(t));
      }
    };
  }, []);

  const spawnHearts = () => {
    if (!showHearts || typeof window === "undefined") return;
    const created = Array.from({ length: Math.max(1, particleAmount) }).map(
      () => ({
        id: ++particleIdRef.current,
        x: petPosRef.current.x,
        y: petPosRef.current.y,
        dx: Math.random() * 100 - 50,
        dy: -(30 + Math.random() * 90),
        rot: Math.random() * 90 - 45,
      })
    );
    setParticles((prev) => [...prev, ...created]);
    created.forEach((p) => {
      const t = window.setTimeout(() => {
        setParticles((prev) => prev.filter((item) => item.id !== p.id));
      }, 1050);
      timeoutsRef.current.push(t);
    });
  };

  const onPetClick = () => {
    spawnHearts();
  };

  if (!admitted || excluded) return null;

  return (
    <div
      data-pet-root
      aria-hidden={false}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        // Below toasts/modals/mobile-menu (z-50+) so the pet reads as part of
        // the page, sliding under real chrome instead of floating over it.
        zIndex: 45,
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          aria-hidden
          style={{
            position: "fixed",
            left: p.x,
            top: p.y,
            color: particleColour,
            fontSize: particleSize,
            lineHeight: 1,
            pointerEvents: "none",
            transform: "translate(-50%, -50%)",
            animationName: "cursorPetHeartBurst",
            animationDuration: "1s",
            animationTimingFunction: "ease-out",
            animationFillMode: "forwards",
            ["--dx"]: `${p.dx}px`,
            ["--dy"]: `${p.dy}px`,
            ["--rot"]: `${p.rot}deg`,
            zIndex: 46,
          }}
        >
          {particleCharacter}
        </div>
      ))}
      <div
        role="button"
        aria-label="Cursor pet"
        onClick={onPetClick}
        style={{
          position: "fixed",
          left: petPos.x - size / 2,
          top: petPos.y - size / 2,
          width: size,
          height: size,
          cursor: "pointer",
          pointerEvents: "auto",
          backgroundImage: `url(${spriteSrc})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${size * SPRITE_COLS}px ${size * SPRITE_ROWS}px`,
          backgroundPosition: `${-frame.col * size}px ${-frame.row * size}px`,
          imageRendering: pixelSnap ? "pixelated" : "auto",
          // Grounding shadow + gentle entrance: the pet reads as standing on
          // the page rather than hovering above it.
          filter: "drop-shadow(0 7px 5px rgba(8, 6, 4, 0.45))",
          opacity: entered ? 1 : 0,
          transition: "opacity 700ms ease",
          zIndex: 45,
        }}
      />
    </div>
  );
}
