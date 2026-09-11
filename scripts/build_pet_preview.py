"""One-off: build a self-contained preview HTML from the Vite dist output.

Inlines the built CSS and JS into a single file and rewrites the sprite
reference to a base64 data URI, so the page renders standalone. The real
app keeps using /pet-sprite.png from public/.
"""
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "frontend"
DIST = ROOT / "dist"
OUT = ROOT / "cursorpet-preview.html"

html = (DIST / "index.html").read_text(encoding="utf-8")

css_m = re.search(r'<link rel="stylesheet"[^>]*href="([^"]+)"', html)
if css_m:
    css = (DIST / css_m.group(1).lstrip("/")).read_text(encoding="utf-8")
    html = html.replace(css_m.group(0), f"<style>{css}</style>")

js_m = re.search(r'<script[^>]*src="([^"]+)"', html)
if js_m:
    js = (DIST / js_m.group(1).lstrip("/")).read_text(encoding="utf-8")
    html = html.replace(js_m.group(0), f'<script type="module">{js}</script>')

sprite_b64 = base64.b64encode(
    (ROOT / "public" / "pet-sprite.png").read_bytes()
).decode("ascii")
html = html.replace("/pet-sprite.png", f"data:image/png;base64,{sprite_b64}")

OUT.write_text(html, encoding="utf-8")
print("wrote", OUT, f"({OUT.stat().st_size/1e6:.1f} MB)")
