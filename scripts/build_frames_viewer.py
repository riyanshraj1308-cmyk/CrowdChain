"""One-off: emit frontend/pet-frames.html showing every frame of
pet-sprite.png in a labeled grid on a dark background, for visual check."""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SPRITE = ROOT / "frontend" / "public" / "pet-sprite.png"
OUT = ROOT / "frontend" / "pet-frames.html"

b64 = base64.b64encode(SPRITE.read_bytes()).decode("ascii")

cells = []
ROWS_TO_SHOW = [2]
for r in ROWS_TO_SHOW:
    for c in range(8):
        cells.append(
            f'<div class="cell"><div class="img" style="background-position:'
            f'{-c * 160}px {-r * 160}px"></div>'
            f'<span>r{r}c{c}</span></div>'
        )

html = f"""<!doctype html>
<html><head><meta charset="utf-8"><style>
body {{ background:#1b1918; color:#eee; font-family:monospace; margin:16px; }}
.grid {{ display:grid; grid-template-columns:repeat(4, 164px); gap:6px; }}
.cell {{ width:164px; text-align:center; }}
.img {{ width:160px; height:160px; margin:0 auto;
  background-image:url(data:image/png;base64,{b64});
  background-size:1280px 640px; background-repeat:no-repeat;
  image-rendering:auto; border:1px solid #555; }}
span {{ font-size:11px; color:#aaa; }}
h3 {{ margin:14px 0 4px; }}
</style></head><body>
<h2>pet-sprite.png frames (8x4, 246px cells shown at 100px)</h2>
<div class="grid">{''.join(cells)}</div>
</body></html>"""

OUT.write_text(html, encoding="utf-8")
print("wrote", OUT, f"({OUT.stat().st_size/1e6:.1f} MB)")
