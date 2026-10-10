"""Corta la exportación del mapa de Xaero (PNG) en teselas WebP para la web (public/img/safari).

Uso:  python scripts/safari-tiles.py "<ruta a Safari.png>" [origen_x origen_z]
  origen_x/z = bloque de la esquina superior izquierda del PNG (sale en el nombre de las piezas de la
  carpeta de exportación, p. ej. 0_0_x-1696_z-1712.png). 1 píxel = 1 bloque.
  El Safari es un círculo de radio ~1536 centrado en (0,0): se recorta a un cuadrado de 3072 y lo de fuera
  del círculo queda transparente. En el zoom z la imagen mide 192*2^z (z=4: 1 píxel = 1 bloque).
"""
import os, shutil, sys
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
src = sys.argv[1]
ox, oz = (int(v) for v in sys.argv[2:4]) if len(sys.argv) >= 4 else (-1696, -1712)
HALF, R = 1536, 1530
out = os.path.join(os.path.dirname(__file__), '..', 'public', 'img', 'safari')

im = Image.open(src).convert('RGBA')
x0, y0 = -HALF - ox, -HALF - oz
im = im.crop((x0, y0, x0 + 2 * HALF, y0 + 2 * HALF))
yy, xx = np.ogrid[:2 * HALF, :2 * HALF]
inside = (xx - HALF) ** 2 + (yy - HALF) ** 2 <= R ** 2
im.putalpha(Image.fromarray((inside * 255).astype(np.uint8)))

shutil.rmtree(out, ignore_errors=True)
for z in range(5):
    size = 192 * 2 ** z
    n = -(-size // 256)
    lvl = Image.new('RGBA', (n * 256, n * 256))  # teselas siempre de 256: Leaflet estira las más pequeñas
    lvl.paste(im.resize((size, size), Image.LANCZOS))
    os.makedirs(os.path.join(out, str(z)))
    for ty in range(n):
        for tx in range(n):
            t = lvl.crop((tx * 256, ty * 256, tx * 256 + 256, ty * 256 + 256))
            t.save(os.path.join(out, str(z), f'{tx}_{ty}.webp'), quality=82, method=6)  # también las vacías: evita 404
print('teselas en', os.path.abspath(out))
