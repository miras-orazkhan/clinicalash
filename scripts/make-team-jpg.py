#!/usr/bin/env python3
"""Конвертация сырых портретов команды в оптимизированные JPEG для сайта."""
import os
from PIL import Image

SRC = "/home/z/my-project/scripts/team-raw"
DST = "/home/z/my-project/public/team"
os.makedirs(DST, exist_ok=True)

for f in sorted(os.listdir(SRC)):
    if not f.endswith(".png"):
        continue
    im = Image.open(os.path.join(SRC, f)).convert("RGB")
    # квадратный кроп по центру (если не квадрат)
    w, h = im.size
    s = min(w, h)
    im = im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
    im = im.resize((512, 512), Image.LANCZOS)
    out = os.path.join(DST, f.replace(".png", ".jpg"))
    im.save(out, "JPEG", quality=85, optimize=True)
    print(f"{out} {os.path.getsize(out) // 1024} KB")

print("DONE")
