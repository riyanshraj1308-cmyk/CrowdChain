import {
    startTransition,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"

// User request: Build a Cursor Pet Framer component with an 8x4 sprite-sheet reader, follow/run-away behaviors, whole-page/this-area roaming, activation modes, idle antics and moods, optional grid, pixel snap, and click heart particles, with SSR/static safety and full property controls.


/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CursorPet({
    behavior = "Follow Cursor",
    start = "Auto Start",
    idleMood = "Rest",
    spriteSheet = "/pixel-cat-sprite.png",
    roam = "Whole Page",
    grid = false,
    gridSize = 24,
    gridColour = "#EEEEEE",
    size = 48,
    speed = 5,
    frameRate = 10,
    stopDistance = 24,
    escapeRadius = 140,
    idleAnticsChance = 6,
    clampToViewport = true,
    pixelSnap = false,
    showHearts = true,
    particleCharacter = "❤",
    particleColour = "#FF4F81",
    particleAmount = 10,
    particleSize = 18,
}) {

    const isStatic = false
    const rootRef = useRef(null)
    const rafRef = useRef(0)
    const [frame, setFrame] = useState({ row: 0, col: 0 })
    const [petPos, setPetPos] = useState({ x: size / 2, y: size / 2 })
    const [active, setActive] = useState(start === "Auto Start")
    const [particles, setParticles] = useState([])

    const activeRef = useRef(active)
    const returningRef = useRef(false)
    const petPosRef = useRef({ x: size / 2, y: size / 2 })
    const cursorRef = useRef({ x: size / 2, y: size / 2 })
    const originRef = useRef({ x: size / 2, y: size / 2 })
    const walkStepRef = useRef(0)
    const tickRef = useRef(0)
    const randomIdleModeRef = useRef("Rest")
    const anticsRef = useRef({
        type: "none",
        ticks: 0,
    })
    const timeoutsRef = useRef([])
    const particleIdRef = useRef(0)

    useEffect(() => {
        activeRef.current = active
    }, [active])

    const spriteSrc = useMemo(() => {
        if (typeof spriteSheet === "string") return spriteSheet
        if (spriteSheet && typeof spriteSheet.src === "string")
            return spriteSheet.src
        return "https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg"
    }, [spriteSheet])

    const setFrameSafe = useCallback((row, col) => {
        startTransition(() => setFrame({ row, col }))
    }, [])

    const classifyDirection = useCallback(
        (nx, ny) => {
            if (ny <= -0.5 && Math.abs(nx) < 0.5) return "north"
            if (ny >= 0.5 && Math.abs(nx) < 0.5) return "south"
            if (nx >= 0.5 && Math.abs(ny) < 0.5) return "east"
            if (nx <= -0.5 && Math.abs(ny) < 0.5) return "west"
            if (nx >= 0.5 && ny <= -0.5) return "northeast"
            if (nx <= -0.5 && ny <= -0.5) return "northwest"
            if (nx >= 0.5 && ny >= 0.5) return "southeast"
            return "southwest"
        },
        []
    )

    const directionFrame = useCallback((dir, step) => {
        const walk = step % 2
        const map = {
            north: { row: 1, col: 0 },
            south: { row: 1, col: 2 },
            east: { row: 1, col: 4 },
            west: { row: 1, col: 6 },
            northeast: { row: 2, col: 0 },
            northwest: { row: 2, col: 2 },
            southeast: { row: 2, col: 4 },
            southwest: { row: 2, col: 6 },
        }
        const entry = map[dir]
        return { row: entry.row, col: entry.col + walk }
    }, [])

    const clamp = useCallback(
        (x, y) => {
            if (roam === "This Area") {
                const rect = rootRef.current?.getBoundingClientRect()
                const w = rect?.width ?? size
                const h = rect?.height ?? size
                return {
                    x: Math.max(size / 2, Math.min(w - size / 2, x)),
                    y: Math.max(size / 2, Math.min(h - size / 2, y)),
                }
            }
            if (clampToViewport && typeof window !== "undefined") {
                return {
                    x: Math.max(
                        size / 2,
                        Math.min(window.innerWidth - size / 2, x)
                    ),
                    y: Math.max(
                        size / 2,
                        Math.min(window.innerHeight - size / 2, y)
                    ),
                }
            }
            return { x, y }
        },
        [clampToViewport, roam, size]
    )

    const setPetPosSafe = useCallback(
        (x, y) => {
            const next = clamp(x, y)
            petPosRef.current = next
            startTransition(() => setPetPos(next))
        },
        [clamp]
    )

    useEffect(() => {
        if (isStatic) return
        if (typeof document === "undefined") return
        const styleEl = document.createElement("style")
        styleEl.textContent = `@keyframes cursorPetHeartBurst{0%{transform:translate(0,0) scale(.3) rotate(0deg);opacity:0}20%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.25) rotate(var(--rot));opacity:0}}`
        document.head.appendChild(styleEl)
        return () => {
            styleEl.remove()
        }
    }, [isStatic])

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        const handleMove = (event) => {
            if (roam === "Whole Page") {
                cursorRef.current = { x: event.clientX, y: event.clientY }
            } else {
                const rect = rootRef.current?.getBoundingClientRect()
                if (!rect) return
                cursorRef.current = {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                }
            }
        }
        window.addEventListener("mousemove", handleMove)
        return () => window.removeEventListener("mousemove", handleMove)
    }, [isStatic, roam])

    useEffect(() => {
        if (isStatic) return
        if (typeof window === "undefined") return
        const targetMs = 1000 / Math.max(1, frameRate)
        let last = 0
        const loop = (time) => {
            rafRef.current = window.requestAnimationFrame(loop)
            if (time - last < targetMs) return
            last = time
            tickRef.current += 1

            const nearEdge = (() => {
                if (roam === "Whole Page") {
                    const w = window.innerWidth
                    const h = window.innerHeight
                    const { x, y } = petPosRef.current
                    return {
                        top: y <= size,
                        bottom: y >= h - size,
                        left: x <= size,
                        right: x >= w - size,
                    }
                }
                const rect = rootRef.current?.getBoundingClientRect()
                const w = rect?.width ?? size
                const h = rect?.height ?? size
                const { x, y } = petPosRef.current
                return {
                    top: y <= size,
                    bottom: y >= h - size,
                    left: x <= size,
                    right: x >= w - size,
                }
            })()

            const updateIdle = () => {
                if (anticsRef.current.ticks > 0) {
                    anticsRef.current.ticks -= 1
                    if (anticsRef.current.type === "groom")
                        setFrameSafe(0, 5 + (tickRef.current % 3))
                    else if (anticsRef.current.type === "sleepDrowsy")
                        setFrameSafe(0, 2)
                    else if (anticsRef.current.type === "sleepLoop")
                        setFrameSafe(0, 3 + (tickRef.current % 2))
                    else if (anticsRef.current.type === "scratchTop")
                        setFrameSafe(3, tickRef.current % 2)
                    else if (anticsRef.current.type === "scratchBottom")
                        setFrameSafe(3, 2 + (tickRef.current % 2))
                    else if (anticsRef.current.type === "scratchRight")
                        setFrameSafe(3, 4 + (tickRef.current % 2))
                    else if (anticsRef.current.type === "scratchLeft")
                        setFrameSafe(3, 6 + (tickRef.current % 2))
                    if (
                        anticsRef.current.ticks === 0 &&
                        anticsRef.current.type === "sleepDrowsy"
                    ) {
                        anticsRef.current = { type: "sleepLoop", ticks: 40 }
                    } else if (anticsRef.current.ticks === 0) {
                        anticsRef.current = { type: "none", ticks: 0 }
                        setFrameSafe(0, 0)
                    }
                    return
                }

                const chance =
                    Math.max(0, Math.min(100, idleAnticsChance)) / 100
                if (Math.random() < chance) {
                    const scratchCandidates = []
                    if (nearEdge.top) scratchCandidates.push("scratchTop")
                    if (nearEdge.bottom) scratchCandidates.push("scratchBottom")
                    if (nearEdge.right) scratchCandidates.push("scratchRight")
                    if (nearEdge.left) scratchCandidates.push("scratchLeft")
                    if (scratchCandidates.length > 0 && Math.random() < 0.5) {
                        const kind =
                            scratchCandidates[
                                Math.floor(
                                    Math.random() * scratchCandidates.length
                                )
                            ]
                        anticsRef.current = { type: kind, ticks: 24 }
                    } else if (Math.random() < 0.5) {
                        anticsRef.current = { type: "groom", ticks: 24 }
                    } else {
                        anticsRef.current = { type: "sleepDrowsy", ticks: 12 }
                    }
                    return
                }
                setFrameSafe(0, 0)
            }

            if (!activeRef.current && !returningRef.current) {
                if (
                    idleMood === "Random" &&
                    tickRef.current % Math.max(1, Math.round(frameRate * 3)) ===
                        0
                ) {
                    const list = [
                        "Rest",
                        "Grooming",
                        "Asleep",
                    ]
                    randomIdleModeRef.current =
                        list[Math.floor(Math.random() * list.length)]
                }
                const mode =
                    idleMood === "Random" ? randomIdleModeRef.current : idleMood
                if (mode === "Rest") setFrameSafe(0, 0)
                if (mode === "Grooming")
                    setFrameSafe(0, 5 + (tickRef.current % 3))
                if (mode === "Asleep")
                    setFrameSafe(0, 3 + (tickRef.current % 2))
                return
            }

            const target = returningRef.current
                ? originRef.current
                : cursorRef.current
            const dx = target.x - petPosRef.current.x
            const dy = target.y - petPosRef.current.y
            const dist = Math.hypot(dx, dy)

            if (returningRef.current && dist <= stopDistance) {
                returningRef.current = false
                activeRef.current = false
                startTransition(() => setActive(false))
                updateIdle()
                return
            }

            if (
                !returningRef.current &&
                behavior === "Run Away" &&
                dist >= escapeRadius
            ) {
                updateIdle()
                return
            }
            if (!returningRef.current && dist <= stopDistance) {
                updateIdle()
                return
            }

            const inv = dist > 0 ? 1 / dist : 0
            let nx = dx * inv
            let ny = dy * inv
            if (!returningRef.current && behavior === "Run Away") {
                nx *= -1
                ny *= -1
            }
            walkStepRef.current += 1
            const dir = classifyDirection(nx, ny)
            const f = directionFrame(dir, walkStepRef.current)
            setFrameSafe(f.row, f.col)
            setPetPosSafe(
                petPosRef.current.x + nx * speed,
                petPosRef.current.y + ny * speed
            )
        }
        rafRef.current = window.requestAnimationFrame(loop)
        return () => {
            window.cancelAnimationFrame(rafRef.current)
        }
    }, [
        behavior,
        classifyDirection,
        directionFrame,
        escapeRadius,
        frameRate,
        idleAnticsChance,
        idleMood,
        isStatic,
        roam,
        setFrameSafe,
        setPetPosSafe,
        size,
        speed,
        stopDistance,
    ])

    useEffect(() => {
        if (typeof window === "undefined") return
        const rect = rootRef.current?.getBoundingClientRect()
        const initial =
            roam === "Whole Page"
                ? {
                      x: (rect?.width ?? size) / 2,
                      y: (rect?.height ?? size) / 2,
                  }
                : {
                      x: (rect?.width ?? size) / 2,
                      y: (rect?.height ?? size) / 2,
                  }
        petPosRef.current = initial
        originRef.current = initial
        startTransition(() => setPetPos(initial))
    }, [roam, size])

    useEffect(() => {
        if (start === "Auto Start") {
            if (roam === "Whole Page") {
                const rect = rootRef.current?.getBoundingClientRect()
                if (rect) {
                    const viewportPos = {
                        x: rect.left + petPosRef.current.x,
                        y: rect.top + petPosRef.current.y,
                    }
                    petPosRef.current = viewportPos
                    originRef.current = viewportPos
                    startTransition(() => setPetPos(viewportPos))
                }
            }
            activeRef.current = true
            startTransition(() => setActive(true))
        } else {
            activeRef.current = false
            returningRef.current = false
            startTransition(() => setActive(false))
        }
    }, [roam, start])

    useEffect(() => {
        return () => {
            if (typeof window !== "undefined") {
                timeoutsRef.current.forEach((t) => window.clearTimeout(t))
            }
        }
    }, [])

    const petScreenPos = useMemo(() => {
        if (roam === "This Area") {
            const rect = rootRef.current?.getBoundingClientRect()
            return {
                x: (rect?.left ?? 0) + petPos.x,
                y: (rect?.top ?? 0) + petPos.y,
            }
        }
        return petPos
    }, [petPos, roam])

    const spawnHearts = useCallback(() => {
        if (!showHearts || typeof window === "undefined") return
        const created: Particle[] = Array.from({
            length: Math.max(1, particleAmount),
        }).map(() => ({
            id: ++particleIdRef.current,
            x: petScreenPos.x,
            y: petScreenPos.y,
            dx: Math.random() * 100 - 50,
            dy: -(30 + Math.random() * 90),
            rot: Math.random() * 90 - 45,
        }))
        startTransition(() => setParticles((prev) => [...prev, ...created]))
        created.forEach((p) => {
            const t = window.setTimeout(() => {
                startTransition(() =>
                    setParticles((prev) =>
                        prev.filter((item) => item.id !== p.id)
                    )
                )
            }, 1050)
            timeoutsRef.current.push(t)
        })
    }, [particleAmount, petScreenPos.x, petScreenPos.y, showHearts])

    const onPetClick = useCallback(() => {
        spawnHearts()
        if (start === "Auto Start") return
        if (start === "Click to Start") {
            if (!activeRef.current) {
                if (roam === "Whole Page") {
                    const rect = rootRef.current?.getBoundingClientRect()
                    if (rect) {
                        const viewportPos = {
                            x: rect.left + petPosRef.current.x,
                            y: rect.top + petPosRef.current.y,
                        }
                        petPosRef.current = viewportPos
                        originRef.current = viewportPos
                        startTransition(() => setPetPos(viewportPos))
                    }
                }
                activeRef.current = true
                startTransition(() => setActive(true))
            }
            return
        }
        if (start === "Click to Toggle") {
            if (!activeRef.current && !returningRef.current) {
                if (roam === "Whole Page") {
                    const rect = rootRef.current?.getBoundingClientRect()
                    if (rect) {
                        const viewportPos = {
                            x: rect.left + petPosRef.current.x,
                            y: rect.top + petPosRef.current.y,
                        }
                        petPosRef.current = viewportPos
                        startTransition(() => setPetPos(viewportPos))
                    }
                }
                activeRef.current = true
                startTransition(() => setActive(true))
                originRef.current = { ...petPosRef.current }
            } else {
                returningRef.current = true
            }
        }
    }, [roam, spawnHearts, start])

    const gridBackground = useMemo(() => {
        if (roam !== "This Area" || !grid) return undefined
        return {
            backgroundImage: `repeating-linear-gradient(0deg, transparent 0 ${gridSize - 1}px, ${gridColour} ${gridSize - 1}px ${gridSize}px), repeating-linear-gradient(90deg, transparent 0 ${gridSize - 1}px, ${gridColour} ${gridSize - 1}px ${gridSize}px)`,
        }
    }, [grid, gridColour, gridSize, roam])

    const staticCol =
        idleMood === "Grooming" ? 5 : idleMood === "Asleep" ? 3 : 0
    const renderFrame = isStatic ? { row: 0, col: staticCol } : frame
    const wholePageIsFixed =
        roam === "Whole Page" && (active || returningRef.current)
    const drawPosition = useMemo(() => {
        if (wholePageIsFixed) return petPos
        if (roam === "Whole Page") {
            const rect = rootRef.current?.getBoundingClientRect()
            return {
                x: petPos.x - (rect?.left ?? 0),
                y: petPos.y - (rect?.top ?? 0),
            }
        }
        return petPos
    }, [petPos, roam, wholePageIsFixed])

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                ...gridBackground,
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
                    position: wholePageIsFixed ? "fixed" : "absolute",
                    left: drawPosition.x - size / 2,
                    top: drawPosition.y - size / 2,
                    width: size,
                    height: size,
                    cursor: "pointer",
                    backgroundImage: `url(${spriteSrc})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${size * 8}px ${size * 4}px`,
                    backgroundPosition: `${-renderFrame.col * size}px ${-renderFrame.row * size}px`,
                    imageRendering: pixelSnap
                        ? ("pixelated")
                        : ("auto"),
                    zIndex: 99999,
                }}
            />
        </div>
    )
}

