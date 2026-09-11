import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * CursorPet — a pixel-art companion that roams the whole page.
 *
 * Reads an 8x4 sprite sheet (grid of 246x246 cells at /pet-sprite.png):
 *   row 0: idle / groom / sleep   row 1: N,S,E,W walk (2-frame pairs)
 *   row 2: diagonals (2-frame pairs, leap/pounce poses)
 *   row 3: edge scratches
 *
 * Follows the cursor, idles with antics, and bursts hearts when clicked.
 */

const SPRITE_COLS = 8;
const SPRITE_ROWS = 4;

// Octant names for movement angles (screen coords, y grows downward).
// atan2(ny, nx) = 0 is due east; PI/2 is south (down); -PI/2 is north (up).
// Index = round(angle / (PI/4)) + 4, so slot 0 is west (angle -PI) and
// slot 8 is west again (angle +PI) — the duplicate ends the wraparound.
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

export default function CursorPet({
  behavior = "Follow Cursor",
  spriteSheet = "/pet-sprite.png",
  size = 48,
  speed = 13,
  frameRate = 11,
  stopDistance = 20,
  escapeRadius = 140,
  idleAnticsChance = 6,
  clampToViewport = true,
  pixelSnap = true,
  showHearts = true,
  particleCharacter = "❤",
  particleColour = "#FF4F81",
  particleAmount = 10,
  particleSize = 18,
}) {
  const rootRef = useRef(null);
  const rafRef = useRef(0);
  const [frame, setFrame] = useState({ row: 0, col: 0 });
  const [petPos, setPetPos] = useState({ x: size / 2, y: size / 2 });
  const [particles, setParticles] = useState([]);

  const petPosRef = useRef({ x: size / 2, y: size / 2 });
  const cursorRef = useRef({ x: size / 2, y: size / 2 });
  const walkStepRef = useRef(0);
  const tickRef = useRef(0);
  const anticsRef = useRef({ type: "none", ticks: 0 });
  const timeoutsRef = useRef([]);
  const particleIdRef = useRef(0);

  const spriteSrc = useMemo(() => {
    if (typeof spriteSheet === "string") return spriteSheet;
    if (spriteSheet && typeof spriteSheet.src === "string")
      return spriteSheet.src;
    return "/pet-sprite.png";
  }, [spriteSheet]);

  const setFrameSafe = useCallback((row, col) => {
    startTransition(() => setFrame({ row, col }));
  }, []);

  const classifyDirection = useCallback((nx, ny) => {
    // Full 8-direction movement via angle octants.
    const oct = Math.round(Math.atan2(ny, nx) / (Math.PI / 4));
    return OCTANTS[oct + 4];
  }, []);

  const directionFrame = useCallback((dir, step) => {
    const walk = step % 2;
    // Row 1: (c0,c1)=north, (c2,c3)=south, (c4,c5)=east, (c6,c7)=west.
    // Row 2 (verified via pink-ear/muzzle side): (c0,c1)=northeast,
    // (c2,c3)=northwest, (c4,c5)=southeast, (c6,c7)=southwest —
    // each a 2-frame stride/pounce pair.
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
  }, []);

  const clamp = useCallback(
    (x, y) => {
      if (clampToViewport && typeof window !== "undefined") {
        return {
          x: Math.max(size / 2, Math.min(window.innerWidth - size / 2, x)),
          y: Math.max(size / 2, Math.min(window.innerHeight - size / 2, y)),
        };
      }
      return { x, y };
    },
    [clampToViewport, size],
  );

  const setPetPosSafe = useCallback(
    (x, y) => {
      const next = clamp(x, y);
      petPosRef.current = next;
      startTransition(() => setPetPos(next));
    },
    [clamp],
  );

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
    if (typeof window === "undefined") return;
    const handleMove = (event) => {
      cursorRef.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const targetMs = 1000 / Math.max(1, frameRate);
    let last = 0;
    const loop = (time) => {
      rafRef.current = window.requestAnimationFrame(loop);
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

      const target = cursorRef.current;
      const dx = target.x - petPosRef.current.x;
      const dy = target.y - petPosRef.current.y;
      const dist = Math.hypot(dx, dy);

      if (behavior === "Run Away" && dist >= escapeRadius) {
        updateIdle();
        return;
      }
      if (dist <= stopDistance) {
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
      walkStepRef.current += 1;
      const dir = classifyDirection(nx, ny);
      const f = directionFrame(dir, walkStepRef.current);
      setFrameSafe(f.row, f.col);
      setPetPosSafe(
        petPosRef.current.x + nx * speed,
        petPosRef.current.y + ny * speed,
      );
    };
    rafRef.current = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(rafRef.current);
    };
  }, [
    behavior,
    classifyDirection,
    directionFrame,
    escapeRadius,
    frameRate,
    idleAnticsChance,
    setFrameSafe,
    setPetPosSafe,
    size,
    speed,
    stopDistance,
  ]);

  // Center the pet on first mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const initial = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    petPosRef.current = initial;
    cursorRef.current = initial;
    startTransition(() => setPetPos(initial));
  }, []);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      if (typeof window !== "undefined") {
        timeouts.forEach((t) => window.clearTimeout(t));
      }
    };
  }, []);

  const spawnHearts = useCallback(() => {
    if (!showHearts || typeof window === "undefined") return;
    const created = Array.from({ length: Math.max(1, particleAmount) }).map(
      () => ({
        id: ++particleIdRef.current,
        x: petPosRef.current.x,
        y: petPosRef.current.y,
        dx: Math.random() * 100 - 50,
        dy: -(30 + Math.random() * 90),
        rot: Math.random() * 90 - 45,
      }),
    );
    startTransition(() => setParticles((prev) => [...prev, ...created]));
    created.forEach((p) => {
      const t = window.setTimeout(() => {
        startTransition(() =>
          setParticles((prev) => prev.filter((item) => item.id !== p.id)),
        );
      }, 1050);
      timeoutsRef.current.push(t);
    });
  }, [particleAmount, showHearts]);

  const onPetClick = useCallback(() => {
    spawnHearts();
  }, [spawnHearts]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 99999,
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
            zIndex: 100000,
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
          zIndex: 99999,
        }}
      />
    </div>
  );
}
