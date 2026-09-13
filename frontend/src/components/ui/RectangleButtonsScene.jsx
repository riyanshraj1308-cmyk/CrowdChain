import { RectangleButtons } from "@designcodeio/threeui/components/RectangleButtons";

/**
 * ThreeUI <RectangleButtons /> stage (glassmorphism-cta variant).
 *
 * Uses the package's officially exported deep entry so only React + the
 * lazily-loaded effect chunk ship to the browser — none of the WebGL `three`
 * shader code. Visuals run inside the component's own sandboxed iframe,
 * byte-identical to the registered canonical source.
 *
 * `.shader-frame` (defined in index.css) is the sizing stage: the iframe
 * fills it, so give the frame an explicit height where you use it.
 */
export default function RectangleButtonsScene({
  variant = "glassmorphism-cta",
  mode = "dark",
  hue = 0,
  saturation = 1.0,
  brightness = 1.0,
  className = "",
  ...props
}) {
  return (
    <div className={`shader-frame ${className}`.trim()}>
      <RectangleButtons
        variant={variant}
        mode={mode}
        hue={hue}
        saturation={saturation}
        brightness={brightness}
        {...props}
      />
    </div>
  );
}
