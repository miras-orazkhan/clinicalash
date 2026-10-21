#!/usr/bin/env python3
"""Download candidates and check which PNGs really have transparent backgrounds."""
import io
import json
import urllib.request

from PIL import Image

RAW = open("/home/z/my-project/scripts/imgsearch-doctor.json").read()
DATA = json.loads(RAW[RAW.index("{"):])
RESULTS = DATA["results"]

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}

def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=60).read()

for i, r in enumerate(RESULTS):
    url = r["original_url"]
    try:
        blob = fetch(url)
        img = Image.open(io.BytesIO(blob))
        has_alpha = img.mode in ("RGBA", "LA", "PA") or "transparency" in img.info
        transparent_ratio = 0.0
        if has_alpha and img.mode == "RGBA":
            a = img.getchannel("A")
            hist = a.histogram()
            transparent_ratio = sum(hist[:16]) / (img.width * img.height)
        print(
            f"{i} | {img.format} {img.mode} {img.width}x{img.height} "
            f"| alpha={has_alpha} transparent={transparent_ratio:.1%} | {url}"
        )
    except Exception as exc:  # noqa: BLE001
        print(f"{i} | FAIL {type(exc).__name__}: {exc} | {url}")
