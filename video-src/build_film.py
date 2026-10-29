#!/usr/bin/env python3
"""Schneidet die Flow-Clips in video-src/flow/ zu einem Leistungsfilm mit Texten.

Ablauf: Clips trimmen/graden -> Karte rendern -> xfade-Kette -> Text-Overlays.
Aufruf: python3 video-src/build_film.py [ausgabe.mp4]
"""
import math
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
FLOW = os.path.join(ROOT, 'flow')
WORK = os.environ.get('WORK', os.path.join(ROOT, '.work'))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'sellita_leistungen.mp4')
W, H, FPS = 1920, 1080, 24
FONTS = '/usr/share/fonts/opentype/inter/'
SKY, RED, WHITE = (14, 165, 233), (239, 68, 68), (255, 255, 255)
os.makedirs(WORK, exist_ok=True)


def font(name, size):
    return ImageFont.truetype(FONTS + name, size)


# ---------------------------------------------------------------- Timeline
# (id, Quelle, start, ende, extra-Filter)
GRADE = 'eq=contrast=1.04:saturation=0.96,vignette=angle=0.32,noise=alls=4:allf=t+u'
SEGMENTS = [
    ('intro', '00_haus_intro.mp4', 0.0, 4.6, "curves=all='0/0 0.09/0 1/1',scale=1612:-2,pad=1920:1080:(ow-iw)/2:30:black"),
    ('leck', '01_leckortung.mp4', 0.0, 5.6, ''),
    ('bad', '02_badsanierung.mp4', 0.0, 8.0, ''),
    ('sanitaer', '03_sanitaer.mp4', 0.0, 8.0, ''),
    ('elektrik', '04_elektrik.mp4', 0.0, 8.0, ''),
    ('moebel', '05_moebel.mp4', 0.0, 8.0, ''),
    ('balkon', '06_balkon.mp4', 0.0, 8.0, ''),
    ('wohnung', '07_wohnung.mp4', 0.0, 8.0, ''),
    ('alles', '08_rundgang.mp4', 5.5, 8.0, 'minterpolate=fps=48:mi_mode=mci:mc_mode=aobmc:vsbmc=1,setpts=1.6*PTS,fps=24'),
    ('karte', None, 0, 6.0, ''),
    ('outro', '00_haus_intro.mp4', 0.0, 4.2, "reverse,tpad=stop_mode=clone:stop_duration=3.3,curves=all='0/0 0.09/0 1/1',scale=1250:-2,pad=1920:1080:(ow-iw)/2:20:black"),
]
# Übergang in Segment i+1: (xfade-Typ, Dauer)
TRANS = [('fadeblack', 0.8)] + [('smoothleft', 0.7)] * 6 + [('fade', 0.8), ('fadeblack', 0.9), ('fade', 1.0)]


def run(cmd):
    subprocess.run(cmd, check=True)


def prep_segment(i, seg):
    sid, src, a, b, extra = seg
    out = os.path.join(WORK, f'seg{i:02d}_{sid}.mp4')
    if os.path.exists(out) and not os.environ.get('FORCE'):
        return out
    if src is None:
        render_map(out, b - a)
        return out
    vf = [f'trim={a}:{b},setpts=PTS-STARTPTS']
    if extra:
        vf.append(extra)
    vf += [f'scale={W}:{H}:flags=lanczos', 'unsharp=5:5:0.35', GRADE, f'fps={FPS}', 'format=yuv420p']
    run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(FLOW, src), '-vf', ','.join(vf), '-an',
         '-c:v', 'libx264', '-crf', '12', '-preset', 'fast', out])
    return out


def duration(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                       capture_output=True, text=True, check=True)
    return float(r.stdout)


# ---------------------------------------------------------------- Karte (generiert)
HOME = (48.6417, 8.8996)
CITIES = {  # Name: (Lage, Beschriftung rechts/links)
    'Stuttgart': ((48.7758, 9.1829), 'r'), 'Tübingen': ((48.5216, 9.0576), 'l'),
    'Calw': ((48.714, 8.739), 'l'), 'Pforzheim': ((48.8922, 8.6946), 'r'), 'Karlsruhe': ((49.0069, 8.4037), 'r'),
    'Reutlingen': ((48.4914, 9.2043), 'r'), 'Ludwigsburg': ((48.8975, 9.192), 'r'), 'Heilbronn': ((49.1427, 9.2109), 'r'),
    'Freudenstadt': ((48.4636, 8.4112), 'r'), 'Baden-Baden': ((48.7606, 8.2398), 'r'), 'Bruchsal': ((49.1245, 8.5986), 'r'),
    'Offenburg': ((48.4733, 7.9441), 'r'), 'Heidelberg': ((49.3988, 8.6724), 'r'), 'Ulm': ((48.4011, 9.9876), 'l'),
    'Freiburg': ((47.999, 7.8421), 'r'),
}


def dist_km(a, b):
    r = math.pi / 180
    h = math.sin((b[0] - a[0]) * r / 2) ** 2 + math.cos(a[0] * r) * math.cos(b[0] * r) * math.sin((b[1] - a[1]) * r / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))


def ease_out(t):
    t = min(max(t, 0.0), 1.0)
    return 1 - (1 - t) ** 3


def ease_io(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def render_map(out, dur):
    ss = 2  # Supersampling
    cx, cy, R = 1330 * ss, 540 * ss, 400 * ss  # 100 km = R
    pxkm = R / 100
    proj = lambda p: (cx + (p[1] - HOME[1]) * 111.2 * math.cos(math.radians(HOME[0])) * pxkm,
                      cy - (p[0] - HOME[0]) * 111.2 * pxkm)
    f_city, f_home = font('Inter-Medium.otf', 22 * ss), font('Inter-SemiBold.otf', 26 * ss)
    rng = np.random.default_rng(7)
    dots = rng.uniform([0, 0], [W * ss, H * ss], size=(900, 2))
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                          '-r', str(FPS), '-i', '-', '-vf', GRADE + ',format=yuv420p', '-c:v', 'libx264', '-crf', '12',
                          '-preset', 'fast', out], stdin=subprocess.PIPE)
    n = int(round(dur * FPS))
    for k in range(n):
        t = k / FPS
        img = Image.new('RGB', (W * ss, H * ss), (6, 8, 11))
        d = ImageDraw.Draw(img, 'RGBA')
        for x, y in dots:  # feines Punktraster als Landkarten-Textur
            if math.hypot(x - cx, y - cy) < R * 1.6:
                d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(255, 255, 255, 18))
        grow = ease_out((t - 0.3) / 1.8)
        r = R * grow
        if r > 2:
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=SKY + (26,), outline=SKY + (230,), width=3 * ss)
            for km in (25, 50, 75):
                rr = km * pxkm
                if rr < r:
                    d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=(255, 255, 255, 28), width=ss)
        for j in range(3):  # Puls-Ringe
            ph = ((t * 0.55) + j / 3) % 1.0
            rr = 20 * ss + ph * R * 0.9
            d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=SKY + (int(90 * (1 - ph)),), width=2 * ss)
        for name, (pos, side) in CITIES.items():
            km = dist_km(HOME, pos)
            x, y = proj(pos)
            inside = km <= 100
            show = ease_out((r - km * pxkm) / (40 * ss)) if inside else ease_out((t - 2.2) / 0.8) * 0.45
            if show <= 0:
                continue
            col = WHITE if inside else (150, 160, 170)
            a = int(255 * show)
            dr = (5 if inside else 4) * ss
            d.ellipse([x - dr, y - dr, x + dr, y + dr], fill=col + (a,))
            lx, anc = (x + 12 * ss, 'lm') if side == 'r' else (x - 12 * ss, 'rm')
            d.text((lx, y), name, font=f_city, fill=col + (int(a * 0.9),), anchor=anc)
        d.ellipse([cx - 9 * ss, cy - 9 * ss, cx + 9 * ss, cy + 9 * ss], fill=SKY + (255,))
        d.ellipse([cx - 4 * ss, cy - 4 * ss, cx + 4 * ss, cy + 4 * ss], fill=(255, 255, 255, 255))
        d.text((cx + 16 * ss, cy + 2 * ss), 'Gärtringen', font=f_home, fill=(255, 255, 255, 255), anchor='lm')
        z = 1.0 + 0.04 * ease_io(t / dur)  # langsamer Push-in
        img = img.resize((int(W * z), int(H * z)), Image.LANCZOS)
        ox, oy = (img.width - W) // 2, (img.height - H) // 2
        p.stdin.write(img.crop((ox, oy, ox + W, oy + H)).tobytes())
    p.stdin.close()
    if p.wait():
        raise SystemExit('Karte: ffmpeg fehlgeschlagen')


# ---------------------------------------------------------------- Text-Bausteine
def text_layer(text, fnt, fill=WHITE, tracking=0.0, shadow=True):
    """Text als RGBA-Bild, optional mit weichem Schatten."""
    asc, desc = fnt.getmetrics()
    sp = fnt.size * tracking
    widths = [fnt.getlength(c) for c in text]
    tw = int(sum(widths) + sp * max(len(text) - 1, 0)) + 2
    pad = 30 if shadow else 2
    img = Image.new('RGBA', (tw + 2 * pad, asc + desc + 2 * pad), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = pad
    for c, w in zip(text, widths):
        d.text((x, pad), c, font=fnt, fill=fill + (255,))
        x += w + sp
    if shadow:
        sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
        sh.putalpha(img.getchannel('A').point(lambda v: v * 0.55).filter(ImageFilter.GaussianBlur(12)))
        sh = sh.transform(sh.size, Image.AFFINE, (1, 0, 0, 0, 1, -4))
        img = Image.alpha_composite(sh, img)
    return img, pad


def pill_layer(text, fnt, dot=None, bg=(10, 12, 16, 120), border=(255, 255, 255, 70), fg=WHITE,
               h=48, tracking=0.0, padx=22):
    t, _ = text_layer(text, fnt, fg, tracking, shadow=False)
    dotw = 22 if dot else 0
    w = int(t.width - 4 + 2 * padx + dotw)
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 2, fill=bg, outline=border, width=1)
    if dot:
        d.ellipse([padx, h / 2 - 5, padx + 10, h / 2 + 5], fill=dot + (255,))
    asc, desc = fnt.getmetrics()
    img.alpha_composite(t, (padx + dotw - 2, int((h - (asc + desc)) / 2) - 2 + 1))
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 2, fill=255)
    return img, mask


class El:
    """Ein Overlay-Element mit Ein-/Ausblendung."""

    def __init__(self, img, x, y, t_in, t_out, glass=None, dy=26, fade=0.6):
        self.arr = np.asarray(img, dtype=np.float32) / 255.0
        self.glass = None if glass is None else np.asarray(glass, dtype=np.float32)[..., None] / 255.0
        self.x, self.y, self.t_in, self.t_out, self.dy, self.fade = int(x), int(y), t_in, t_out, dy, fade

    def state(self, t):
        a_in = ease_out((t - self.t_in) / self.fade)
        a_out = 1 - ease_io((t - (self.t_out - 0.45)) / 0.45)
        a = min(a_in, a_out)
        off = (1 - a_in) * self.dy - (1 - a_out) * 10
        return a, int(round(off))


def blit(frame, el, t):
    a, off = el.state(t)
    if a <= 0.003:
        return
    h, w = el.arr.shape[:2]
    x, y = el.x, el.y + off
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + w, W), min(y + h, H)
    if x1 <= x0 or y1 <= y0:
        return
    src = el.arr[y0 - y:y1 - y, x0 - x:x1 - x]
    dst = frame[y0:y1, x0:x1]
    if el.glass is not None:  # Milchglas: Hintergrund unter der Pill weichzeichnen
        region = Image.fromarray((dst * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))
        g = el.glass[y0 - y:y1 - y, x0 - x:x1 - x] * a
        dst[:] = dst * (1 - g) + (np.asarray(region, dtype=np.float32) / 255.0) * g
    al = src[..., 3:4] * a
    dst[:] = dst * (1 - al) + src[..., :3] * al


def scrim(kind):
    """Abdunklung für Lesbarkeit (unten links bzw. unten mittig)."""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    if kind == 'left':
        m = np.clip((yy - H * 0.30) / (H * 0.70), 0, 1) ** 1.4 * np.clip(1.25 - xx / (W * 0.85), 0, 1)
        m = m * 0.78
    elif kind == 'bottom':
        m = np.clip((yy - H * 0.45) / (H * 0.55), 0, 1) ** 1.5 * 0.85
    else:  # top: für Logo und Fortschritt
        m = np.clip(1 - yy / 190, 0, 1) ** 1.6 * 0.45
    return m[..., None]


# ---------------------------------------------------------------- Texte je Segment
SERVICES = {
    'leck': (RED, 'Leckortung', 'Lecks finden, ohne aufzustemmen',
             'Wärmebild und Feuchtemessung zeigen, wo das Wasser wirklich ist.',
             ['Wärmebildkamera', 'Feuchtemessung', 'Zerstörungsfrei']),
    'bad': (SKY, 'Badsanierung', 'Aus alt wird Wohlfühlbad',
            'Komplett aus einer Hand, vom Rückbau bis zur letzten Fuge.',
            ['Rückbau', 'Neue Leitungen', 'Fliesen', 'Bodengleiche Dusche']),
    'sanitaer': (SKY, 'Sanitär', 'Sanitär, das einfach läuft',
                 'Armaturen, Duschen und Leitungen, sauber installiert.',
                 ['Armaturen', 'Duschsysteme', 'Kupfer & Verbundrohr']),
    'elektrik': ((250, 204, 21), 'Elektrik & Montage', 'Strom und Licht, fertig montiert',
                 'Steckdosen, Schalter und Leuchten fachgerecht angeschlossen.',
                 ['Steckdosen', 'Schalter', 'Leuchten']),
    'moebel': ((217, 160, 102), 'Möbelmontage', 'Möbel ab- und aufbauen',
               'Demontage und Montage, schnell, sauber und passgenau.',
               ['Demontage', 'Montage', 'Ausrichten']),
    'balkon': (SKY, 'Balkonsanierung', 'Der Balkon, wieder dicht',
               'Abdichtung, Drainage und neuer Belag, Schicht für Schicht.',
               ['Abdichtung', 'Drainage', 'Neue Fliesen']),
    'wohnung': (WHITE, 'Wohnungsrenovierung', 'Renoviert und bezugsfertig',
                'Alte Tapete runter, Wände glatt, neuer Boden.',
                ['Wände & Anstrich', 'Bodenbeläge', 'Sockelleisten']),
}
ORDER = ['leck', 'bad', 'sanitaer', 'elektrik', 'moebel', 'balkon', 'wohnung']


def chips_row(labels, fnt, x, y, t0, t_out, step=0.08, gap=12, maxw=W - 240):
    els, cx, cy = [], x, y
    for i, lab in enumerate(labels):
        img, mask = pill_layer(lab, fnt, h=46, padx=20)
        if cx + img.width > x + maxw:
            cx, cy = x, cy + 46 + gap
        els.append(El(img, cx, cy, t0 + i * step, t_out, glass=mask))
        cx += img.width + gap
    return els, cy + 46


def build_overlays(win):
    """win: id -> (sichtbar_ab, sichtbar_bis) in Filmzeit."""
    f_pill = font('Inter-SemiBold.otf', 20)
    f_head = font('InterDisplay-Bold.otf', 82)
    f_sub = font('Inter-Regular.otf', 31)
    f_chip = font('Inter-Medium.otf', 21)
    els, scrims = [], []
    M = 120

    # Intro
    a, b = win['intro']
    logo, lp = text_layer('SELLITA', font('InterDisplay-Bold.otf', 156), tracking=0.12)
    tag, tp = text_layer('Sanitär  •  Leckortung  •  Sanierung', font('Inter-Medium.otf', 34), (235, 238, 242), 0.04)
    pl, pm = pill_layer('HANDWERK AUS GÄRTRINGEN', f_pill, dot=SKY, tracking=0.14)
    y = H - 330
    els += [El(pl, (W - pl.width) / 2, y, a + 0.5, b, glass=pm),
            El(logo, (W - logo.width) / 2, y + 60 - lp, a + 0.7, b, dy=40, fade=0.9),
            El(tag, (W - tag.width) / 2, y + 250 - tp, a + 1.0, b)]
    scrims.append(('bottom', a, b))

    # Leistungen
    for n, sid in enumerate(ORDER, 1):
        a, b = win[sid]
        col, name, head, sub, chips = SERVICES[sid]
        t0 = a + 0.15
        pl, pm = pill_layer(f'{n:02d} / 07   ·   {name.upper()}', f_pill, dot=col, tracking=0.12)
        hd, hp = text_layer(head, f_head, tracking=-0.01)
        sb, sp = text_layer(sub, f_sub, (228, 232, 236))
        chip_y = H - M - 46
        sub_y = chip_y - 34 - 42
        head_y = sub_y - 18 - 92
        pill_y = head_y - 30 - 48
        els += [El(pl, M, pill_y, t0, b, glass=pm),
                El(hd, M - hp, head_y - hp, t0 + 0.12, b, dy=34),
                El(sb, M - sp, sub_y - sp, t0 + 0.26, b)]
        ce, _ = chips_row(chips, f_chip, M, chip_y, t0 + 0.4, b)
        els += ce
        scrims.append(('left', a, b))

    # Alles aus einer Hand
    a, b = win['alles']
    pl, pm = pill_layer('EIN ANSPRECHPARTNER', f_pill, dot=SKY, tracking=0.12)
    hd, hp = text_layer('Alles aus einer Hand', f_head, tracking=-0.01)
    labels = [SERVICES[s][1] for s in ORDER]
    ce, _ = chips_row(labels, f_chip, M, H - M - 46 - 58, a + 0.45, b, step=0.06, maxw=1080)
    els += [El(pl, M, H - M - 104 - 40 - 92 - 30 - 48, a + 0.15, b, glass=pm),
            El(hd, M - hp, H - M - 104 - 40 - 92 - hp, a + 0.27, b, dy=34)] + ce
    scrims.append(('left', a, b))

    # Karte
    a, b = win['karte']
    pl, pm = pill_layer('EINSATZGEBIET', f_pill, dot=SKY, tracking=0.14)
    h1, p1 = text_layer('100 km rund', f_head, tracking=-0.01)
    h2, p2 = text_layer('um Gärtringen', f_head, tracking=-0.01)
    s1, q1 = text_layer('Stuttgart, Böblingen, Tübingen,', f_sub, (228, 232, 236))
    s2, q2 = text_layer('Pforzheim, Karlsruhe und mehr.', f_sub, (228, 232, 236))
    y = 330
    els += [El(pl, M, y, a + 0.3, b, glass=pm),
            El(h1, M - p1, y + 78 - p1, a + 0.42, b, dy=34),
            El(h2, M - p2, y + 172 - p2, a + 0.52, b, dy=34),
            El(s1, M - q1, y + 300 - q1, a + 0.7, b),
            El(s2, M - q2, y + 344 - q2, a + 0.78, b)]

    # Outro mit Kontakt
    a, b = win['outro']
    logo, lp = text_layer('SELLITA', font('InterDisplay-Bold.otf', 128), tracking=0.12)
    tag, tp = text_layer('Sanitär  •  Leckortung  •  Sanierung', font('Inter-Medium.otf', 30), (235, 238, 242), 0.04)
    cta, cm = pill_layer('JETZT ANFRAGEN', font('Inter-Bold.otf', 22), bg=SKY + (235,), border=SKY + (255,),
                         h=56, tracking=0.14, padx=30)
    f_c = font('Inter-Medium.otf', 23)
    contacts = [pill_layer(s, f_c, h=50, padx=22) for s in
                ('0178 30 14 260', 'selita.service@web.de', 'Rohrweg 20 · 71116 Gärtringen')]
    y = H - 390
    t0 = a + 1.4
    els += [El(logo, (W - logo.width) / 2, y - lp, t0, b + 9, dy=40, fade=0.9),
            El(tag, (W - tag.width) / 2, y + 150 - tp, t0 + 0.25, b + 9),
            El(cta, (W - cta.width) / 2, y + 210, t0 + 0.5, b + 9)]
    tw = sum(c[0].width for c in contacts) + 14 * (len(contacts) - 1)
    cx = (W - tw) / 2
    for i, (img, mask) in enumerate(contacts):
        els.append(El(img, cx, y + 290, t0 + 0.7 + i * 0.1, b + 9, glass=mask))
        cx += img.width + 14
    scrims.append(('bottom', a, b + 9))

    # Logo oben links + Fortschritt oben rechts während der Leistungen
    ga, gb = win['leck'][0], win['karte'][1]
    mark, mp = text_layer('SELLITA', font('InterDisplay-Bold.otf', 30), tracking=0.16)
    els.append(El(mark, 64 - mp, 52 - mp, ga + 0.2, gb, dy=0))
    scrims.append(('top', ga, gb))
    return els, scrims


def progress_bar(frame, t, win, alpha):
    if alpha <= 0:
        return
    n, bw, gap, y = 7, 40, 8, 64
    x0 = W - 64 - (n * bw + (n - 1) * gap)
    for i, sid in enumerate(ORDER):
        a, b = win[sid]
        fill = min(max((t - a) / (b - a), 0), 1)
        x = x0 + i * (bw + gap)
        frame[y:y + 4, x:x + bw] = frame[y:y + 4, x:x + bw] * (1 - 0.25 * alpha) + 0.25 * alpha
        if fill > 0:
            fw = int(bw * fill)
            frame[y:y + 4, x:x + fw] = frame[y:y + 4, x:x + fw] * (1 - 0.95 * alpha) + 0.95 * alpha


def main():
    segs = [prep_segment(i, s) for i, s in enumerate(SEGMENTS)]
    durs = [duration(p) for p in segs]
    print('Segmente:', [f'{d:.2f}' for d in durs])

    # xfade-Kette
    starts, offs, run_len = [0.0], [], durs[0]
    parts, last = [], '0:v'
    for k, (typ, td) in enumerate(TRANS):
        off = run_len - td
        offs.append(off)
        starts.append(off)
        lab = f'x{k}'
        parts.append(f'[{last}][{k + 1}:v]xfade=transition={typ}:duration={td}:offset={off:.3f}[{lab}]')
        last = lab
        run_len = off + durs[k + 1]
    total = run_len
    base = os.path.join(WORK, 'base.mp4')
    cmd = ['ffmpeg', '-v', 'error', '-y']
    for p in segs:
        cmd += ['-i', p]
    cmd += ['-filter_complex', ';'.join(parts) + f';[{last}]fade=t=out:st={total - 1.0:.3f}:d=1.0,format=yuv420p[v]',
            '-map', '[v]', '-c:v', 'libx264', '-crf', '12', '-preset', 'fast', base]
    run(cmd)

    # Sichtbare Fenster (nach Einblendung bis vor Ausblendung)
    win = {}
    for i, (sid, *_r) in enumerate(SEGMENTS):
        a = starts[i] + (TRANS[i - 1][1] if i else 0)
        b = offs[i] if i < len(offs) else total - 1.0
        win[sid] = (a, b)
    print('Fenster:', {k: (round(v[0], 2), round(v[1], 2)) for k, v in win.items()})

    els, scrims = build_overlays(win)
    scr = {k: scrim(k) for k in ('left', 'bottom', 'top')}

    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', base, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                           stdout=subprocess.PIPE)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                            '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow',
                            '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)
    k = 0
    while True:
        raw = dec.stdout.read(W * H * 3)
        if len(raw) < W * H * 3:
            break
        t = k / FPS
        fr = np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(np.float32) / 255.0
        for kind, a, b in scrims:
            s = min(ease_io((t - a + 0.5) / 0.8), 1 - ease_io((t - b + 0.2) / 0.6))
            if s > 0:
                fr *= 1 - scr[kind] * s
        ga, gb = win['leck'][0], win['karte'][1]
        progress_bar(fr, t, win, min(ease_out((t - ga - 0.3) / 0.6), 1 - ease_io((t - gb + 0.45) / 0.45)))
        for el in els:
            blit(fr, el, t)
        enc.stdin.write((np.clip(fr, 0, 1) * 255 + 0.5).astype(np.uint8).tobytes())
        k += 1
    enc.stdin.close()
    if enc.wait() or dec.wait():
        raise SystemExit('Overlay: ffmpeg fehlgeschlagen')
    print(f'Fertig: {OUT}  ({k} Bilder, {k / FPS:.1f} s)')


if __name__ == '__main__':
    main()
