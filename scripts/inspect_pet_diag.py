"""Diagnostic: color-coded ASCII of row-2 cells' head regions.
P = pink (inner ear), W = white (muzzle/bib), G = gray body, D = dark.
Head = top 40% of content. Pink-ear side and muzzle sliver side reveal
which way the head is turned (back-view cat).
"""
from PIL import Image

img = Image.open("../frontend/public/pet-sprite.png").convert("RGBA")
W, H = img.size
CW, CH = W // 8, H // 4
px = img.load()


def classify(p):
    r, g, b, a = p
    if a == 0:
        return " "
    if r > 170 and g < 160 and b < 160 and r - g > 40:
        return "P"  # pink
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    if lum > 200:
        return "W"  # white
    if lum > 90:
        return "G"  # gray
    return "D"  # dark


def dump(c, r):
    minx, miny, maxx, maxy = CW, CH, -1, -1
    for y in range(r * CH, (r + 1) * CH):
        for x in range(c * CW, (c + 1) * CW):
            if px[x, y][3] != 0:
                lx, ly = x - c * CW, y - r * CH
                minx = min(minx, lx)
                maxx = max(maxx, lx)
                miny = min(miny, ly)
                maxy = max(maxy, ly)
    w = maxx - minx + 1
    head_h = int((maxy - miny) * 0.40)
    step = max(1, w // 56)
    print(f"-- r{r}c{c} head (content x {minx}-{maxx}, w={w}) --")
    # pink + white pixel stats over the head band
    pinks, whites = [], []
    for y in range(miny, miny + head_h):
        for x in range(minx, maxx + 1):
            p = px[c * CW + x, r * CH + y]
            if p[3] == 0:
                continue
            cls = classify(p)
            if cls == "P":
                pinks.append(x)
            elif cls == "W" and y < miny + head_h * 0.7:
                whites.append(x)
    mid = (minx + maxx) / 2
    if pinks:
        pc = sum(pinks) / len(pinks)
        side = "RIGHT of center" if pc > mid else "LEFT of center"
        print(f"   pink ear px: n={len(pinks)}, centroid x={pc:.0f} ({side}, center={mid:.0f})")
    else:
        print("   no pink pixels in head band")
    if whites:
        wc = sum(whites) / len(whites)
        side = "RIGHT of center" if wc > mid else "LEFT of center"
        print(f"   white px (top 70%): n={len(whites)}, centroid x={wc:.0f} ({side})")
    for y in range(miny, miny + head_h, max(1, head_h // 14)):
        line = "".join(
            classify(px[c * CW + x, r * CH + y])
            for x in range(minx, maxx + 1, step)
        )
        print("   " + line)


for c in (0, 1, 2, 3, 4, 5, 6, 7):
    dump(c, 2)
