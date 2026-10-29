#!/usr/bin/env python3
"""Hintergrund-Film für die Webseite: dieselben Clips wie build_film.py, aber ohne Texte und ohne Karte,
als Bildsequenz für den scroll-gesteuerten Player (public/video/frames + manifest.json).

Aufruf: python3 video-src/build_web.py
"""
import glob
import json
import os
import subprocess

import build_film as bf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'video')
FPS, WIDTH, QUALITY, XF = 12, 1280, 58, 0.6
IDS = ['intro', 'leck', 'bad', 'sanitaer', 'elektrik', 'moebel', 'balkon', 'wohnung', 'alles', 'outro']


def main():
    segs = [(i, s) for i, s in enumerate(bf.SEGMENTS) if s[0] in IDS]
    paths = [bf.prep_segment(i, s) for i, s in segs]
    durs = [bf.duration(p) for p in paths]

    # Überblendungen zwischen allen Segmenten; Zeiten je Segment für die Seite merken
    parts, last, run_len, marks = [], '0:v', durs[0], {IDS[0]: [0.0, durs[0] - XF / 2]}
    for k in range(1, len(paths)):
        off = run_len - XF
        parts.append(f'[{last}][{k}:v]xfade=transition=fade:duration={XF}:offset={off:.3f}[x{k}]')
        last = f'x{k}'
        marks[IDS[k - 1]][1] = off + XF / 2
        marks[IDS[k]] = [off + XF / 2, off + durs[k]]
        run_len = off + durs[k]

    frames = os.path.join(OUT, 'frames')
    os.makedirs(frames, exist_ok=True)
    for f in glob.glob(os.path.join(frames, 'f_*')):
        os.remove(f)
    cmd = ['ffmpeg', '-v', 'error', '-y']
    for p in paths:
        cmd += ['-i', p]
    cmd += ['-filter_complex', ';'.join(parts) + f';[{last}]fps={FPS},scale={WIDTH}:-2:flags=lanczos[v]',
            '-map', '[v]', '-c:v', 'libwebp', '-quality', str(QUALITY), '-compression_level', '6',
            '-start_number', '0', os.path.join(frames, 'f_%04d.webp')]
    bf.run(cmd)
    count = len(glob.glob(os.path.join(frames, 'f_*.webp')))
    manifest = {'count': count, 'fps': FPS, 'w': WIDTH, 'h': WIDTH * 9 // 16, 'ext': 'webp', 'path': 'video/frames',
                'marks': {k: [round(a, 3), round(b, 3)] for k, (a, b) in marks.items()}}
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=1)
    print(json.dumps(manifest))


if __name__ == '__main__':
    main()
