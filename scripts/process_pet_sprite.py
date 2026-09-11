"""Rebuild pet-sprite.png CORRECTLY.

The source CursorPet.png is a clean 8x4 grid of 200x246 cells (verified by
connected-component analysis: every cat blob fits inside its cell). The
previous script corrupted frames by cropping/resizing/re-centering each
cell independently.

Correct transform (zero resampling):
1. Flood-fill the border-connected near-white background -> transparent.
2. Erode the leftover light fringe (bg pixels 245-249 adjacent to
   transparency) so no pale halo survives around the cats.
3. Pad each cell HORIZONTALLY: 200x246 -> 246x246 (centered). Additionally
   shift each row's content UP so paws keep a healthy bottom margin inside
   the frame (the source cats sit nearly flush with the cell bottom, which
   reads as "cut off" when rendered small). Per-row shift = up to 16px,
   only as much as needed to leave a 14px bottom margin.
"""
from collections import deque

from PIL import Image

SRC = "../CursorPet.png"
DST = "../frontend/public/pet-sprite.png"

BG_HI = 250          # flood-fill threshold (background is pure white)
FRINGE_HI = 249      # fringe erosion upper bound
FRINGE_LO = 235      # fringe erosion lower bound

img = Image.open(SRC).convert("RGBA")
W, H = img.size
assert W % 8 == 0 and H % 4 == 0, "source must be an exact 8x4 grid"
CW, CH = W // 8, H // 4  # 200 x 246
px = img.load()

# --- 1. flood fill border-connected near-white background ---
seen = bytearray(W * H)
dq = deque()

def near_white(p):
    return p[0] >= BG_HI and p[1] >= BG_HI and p[2] >= BG_HI

def seed(x, y):
    i = y * W + x
    if not seen[i] and near_white(px[x, y]):
        seen[i] = 1
        dq.append((x, y))

for x in range(W):
    seed(x, 0)
    seed(x, H - 1)
for y in range(H):
    seed(0, y)
    seed(W - 1, y)

while dq:
    x, y = dq.popleft()
    px[x, y] = (255, 255, 255, 0)
    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
        if 0 <= nx < W and 0 <= ny < H:
            i = ny * W + nx
            if not seen[i] and near_white(px[nx, ny]):
                seen[i] = 1
                dq.append((nx, ny))

# --- 2. erode the light fringe around transparency ---
changed = True
passes = 0
while changed and passes < 6:
    changed = False
    passes += 1
    for y in range(H):
        for x in range(W):
            i = y * W + x
            p = px[x, y]
            if p[3] == 0 or p[0] >= FRINGE_HI and p[1] >= FRINGE_HI and p[2] >= FRINGE_HI:
                continue
            if p[3] != 0 and p[0] >= FRINGE_LO and p[1] >= FRINGE_LO and p[2] >= FRINGE_LO:
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < W and 0 <= ny < H and px[nx, ny][3] == 0:
                        px[x, y] = (p[0], p[1], p[2], 0)
                        changed = True
                        break

# --- 3. pad each cell to a square 246x246 frame (horizontal-centered) ---
CELL = CH  # 246
MIN_BOTTOM_MARGIN = 14
MAX_SHIFT = 16

# per-row upward shift, from the row's actual content extent
row_shift = []
for r in range(4):
    max_y = 0
    for c in range(8):
        for y in range(r * CH, (r + 1) * CH):
            for x in range(c * CW, (c + 1) * CW):
                if px[x, y][3] != 0:
                    max_y = max(max_y, y - r * CH)
    bottom_margin = CH - 1 - max_y
    shift = max(0, min(MAX_SHIFT, MIN_BOTTOM_MARGIN - bottom_margin))
    row_shift.append(shift)
    print(f"row {r}: content bottom in-cell y={max_y}, margin={bottom_margin}px -> shift up {shift}px")

out = Image.new("RGBA", (8 * CELL, 4 * CELL), (0, 0, 0, 0))
for r in range(4):
    shift = row_shift[r]
    for c in range(8):
        # drop the top `shift` px (empty margin) so nothing clips below
        cell = img.crop((c * CW, r * CH + shift, (c + 1) * CW, (r + 1) * CH))
        ox = c * CELL + (CELL - CW) // 2  # horizontal centering
        oy = r * CELL
        out.paste(cell, (ox, oy))

out.save(DST)
print(f"saved {DST}: {out.size[0]}x{out.size[1]}  cell={CELL}x{CELL} (8x4)")

# sanity: per-cell opaque pixel counts + transparent corners
opx = out.load()
ocw, och = CELL, CELL
for r in range(4):
    report = []
    for c in range(8):
        corner = opx[c * ocw + 2, r * och + 2][3]
        opaque = sum(
            1
            for y in range(r * och, (r + 1) * och, 6)
            for x in range(c * ocw, (c + 1) * ocw, 6)
            if opx[x, y][3] != 0
        )
        report.append(f"c{c}:a{corner}/{opaque}")
    print(" ".join(report))
