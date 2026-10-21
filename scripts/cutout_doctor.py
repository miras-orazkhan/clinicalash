#!/usr/bin/env python3
"""Chroma-key (green screen) removal for the hero doctor photo.

Outputs /home/z/my-project/public/hero-doctor.png with transparent background.
"""
import numpy as np
from PIL import Image
from scipy import ndimage

SRC = "/home/z/my-project/scripts/doctor-raw.png"
DST = "/home/z/my-project/public/hero-doctor.png"

img = Image.open(SRC).convert("RGB")
rgb = np.asarray(img).astype(np.float32)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

# --- 1. Greenness metric: how much green dominates over the other channels.
# Works across the shaded/vignetted green backdrop because it is relative.
max_rb = np.maximum(r, b)
greenness = g - max_rb

# Soft matte: 0 for strongly green pixels, 1 for clearly subject pixels.
T_HI, T_LO = 70.0, 25.0  # greenness >= T_HI -> background, <= T_LO -> subject
alpha = np.clip((T_HI - greenness) / (T_HI - T_LO), 0.0, 1.0)

# --- 2. Keep interior holes (e.g. greenish reflections inside the coat) opaque.
solid = ndimage.binary_fill_holes(alpha > 0.5)
alpha = np.where(solid, np.maximum(alpha, 1.0), alpha)

# Remove tiny isolated specks of subject floating in the background.
labeled, n = ndimage.label(alpha > 0.5)
if n > 0:
    sizes = ndimage.sum(np.ones_like(alpha), labeled, range(1, n + 1))
    keep = np.zeros(n + 1, bool)
    keep[1:] = sizes >= max(500, 0.0002 * alpha.size)
    alpha = np.where(keep[labeled], alpha, 0.0)

# --- 3. Feather the cutout edge slightly (1px gaussian on the matte).
alpha = ndimage.gaussian_filter(alpha, sigma=0.8)
alpha = np.clip(alpha, 0.0, 1.0)

# --- 4. Despill: neutralize green fringe near the edge.
fringe = (g > max_rb + 8) & (alpha < 0.98)
g2 = np.where(fringe, np.minimum(g, max_rb + 8), g)
rgb = np.stack([r, g2, b], axis=-1)

# --- 5. Crop to subject bbox with a small margin, then save.
ys, xs = np.where(alpha > 0.02)
pad = 12
y0, y1 = max(0, ys.min() - pad), min(alpha.shape[0], ys.max() + pad)
x0, x1 = max(0, xs.min() - pad), min(alpha.shape[1], xs.max() + pad)

rgba = np.dstack([rgb, alpha * 255.0]).astype(np.uint8)
out = Image.fromarray(rgba, "RGBA").crop((x0, y0, x1, y1))
out.save(DST)

# Report
a = out.getchannel("A")
hist = a.histogram()
fully = sum(hist[:8]) / (out.width * out.height)
corners = [out.getpixel((2, 2)), out.getpixel((out.width - 3, 2)), out.getpixel((2, out.height - 3)), out.getpixel((out.width - 3, out.height - 3))]
print(f"saved {DST} size={out.size} fully_transparent={fully:.1%}")
print("corners rgba:", corners)
