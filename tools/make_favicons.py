from PIL import Image, ImageDraw
import os

ASSETS = 'assets'
GOLD = (255, 205, 60, 255)      # #FFCD3C
GOLD_DEEP = (232, 180, 20, 255)
RED = (140, 10, 10, 255)        # deep red shadow
BG = (16, 17, 20, 255)          # #101114
BG2 = (24, 26, 31, 255)

def w_points(w, h, x0, y0):
    # W polyline within box (x0,y0,w,h): down-up-down-up strokes
    gx = [0.0, 0.22, 0.5, 0.78, 1.0]
    gy = [0.0, 1.0, 0.38, 1.0, 0.0]
    return [(x0 + gx[i] * w, y0 + gy[i] * h) for i in range(5)]

def draw_icon(size, path, rounded=True, padding=0.0):
    S = size
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # background
    if rounded:
        rad = int(S * 0.22)
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=rad, fill=BG)
        # subtle inner border
        d.rounded_rectangle([1, 1, S - 2, S - 2], radius=max(1, rad - 1), outline=(58, 62, 72, 255), width=max(1, S // 64))
    else:
        d.rectangle([0, 0, S - 1, S - 1], fill=BG)
    # glyph box
    m = S * (0.10 + padding)
    gw, gh = S - 2 * m, S - 2 * m
    pts = w_points(gw, gh, m, m + gh * 0.02)
    sw = max(2, int(S * 0.115))
    off = max(1, int(S * 0.022))
    # red shadow offset down-right
    d.line([(x + off, y + off) for x, y in pts], fill=RED, width=sw, joint='curve')
    # gold W
    d.line(pts, fill=GOLD, width=sw, joint='curve')
    im.save(path, optimize=True)
    return im

# favicon PNGs (transparent outside rounded badge)
for s in (16, 32, 48, 64, 96):
    draw_icon(s, f'{ASSETS}/favicon-{s}x{s}.png')
# multi-size ICO
bufs = []
for s in (16, 32, 48):
    im = Image.new('RGBA', (s, s))
    # re-render onto temp path then load
    tmp = f'{ASSETS}/.tmp-fav{s}.png'
    draw_icon(s, tmp)
    bufs.append(Image.open(tmp).convert('RGBA'))
    os.remove(tmp)
bufs[0].save(f'{ASSETS}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)], append_images=bufs[1:])
# apple touch (opaque square, iOS rounds it)
draw_icon(180, f'{ASSETS}/apple-touch-icon.png', rounded=False)
# web manifest icons (opaque)
draw_icon(192, f'{ASSETS}/web-app-manifest-192x192.png', rounded=False)
draw_icon(512, f'{ASSETS}/web-app-manifest-512x512.png', rounded=False)

# favicon.svg — same badge + W as vector
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="#101114"/>
<rect x="1" y="1" width="62" height="62" rx="13" fill="none" stroke="#3A3E48" stroke-width="1.5"/>
<g transform="translate(1.4,1.4)">
<polyline points="17.9,15.5 24.7,47.5 32,30.8 39.3,47.5 46.1,15.5" fill="none" stroke="#8C0A0A" stroke-width="7" stroke-linejoin="miter" stroke-linecap="square"/>
</g>
<polyline points="17.9,15.5 24.7,47.5 32,30.8 39.3,47.5 46.1,15.5" fill="none" stroke="#FFCD3C" stroke-width="7" stroke-linejoin="miter" stroke-linecap="square"/>
</svg>'''
open(f'{ASSETS}/favicon.svg', 'w').write(svg)
print('favicons generated')
