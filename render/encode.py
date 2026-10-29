"""Wandelt die Cycles-Renderbilder in WebP für die Website und schreibt das Manifest für den Scroll-Player.

Aufruf: python3 render/encode.py render/final 0.88 [quality]
"""
import json
import os
import sys

from PIL import Image

src, pmax = sys.argv[1], float(sys.argv[2])
q = int(sys.argv[3]) if len(sys.argv) > 3 else 80
dst = 'public/video/frames'
os.makedirs(dst, exist_ok=True)
files = sorted(f for f in os.listdir(f'{src}/frames') if f.endswith('.png'))
w = h = 0
for f in files:
    im = Image.open(f'{src}/frames/{f}').convert('RGB')
    w, h = im.size
    im.save(f'{dst}/{f[:-4]}.webp', 'WEBP', quality=q, method=6)
json.dump({'count': len(files), 'pmax': pmax, 'w': w, 'h': h, 'ext': 'webp', 'path': 'video/frames'}, open('public/video/manifest.json', 'w'))
total = sum(os.path.getsize(f'{dst}/{f}') for f in os.listdir(dst))
print(len(files), 'frames', f'{total / 1e6:.1f} MB')
