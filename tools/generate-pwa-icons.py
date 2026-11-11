#!/usr/bin/env python3
"""Genera los PNG PWA de PlegadoX sin dependencias de terceros.

Reproduce el icono vectorial favicon.svg (64 x 64) con submuestreo 2x2.
Se ejecuta desde la raíz del repositorio o desde cualquier directorio.
"""
from pathlib import Path
import struct
import zlib
import binascii

ROOT = Path(__file__).resolve().parents[1]
BACKGROUND = (8, 26, 44)
STEEL = (129, 187, 213)
CYAN = (0, 188, 242)
LINE = (34, 190, 245)
FIRST = [(11, 18), (53, 18), (53, 27), (37, 27), (28, 46), (11, 46), (24, 18)]
SECOND = [(37, 30), (50, 46), (38, 46), (29, 34)]


def in_polygon(x, y, polygon):
    hit = False
    for i in range(len(polygon)):
        ax, ay = polygon[i]
        bx, by = polygon[(i + 1) % len(polygon)]
        if (ay > y) != (by > y):
            crossing = ax + (y - ay) * (bx - ax) / (by - ay)
            if x < crossing:
                hit = not hit
    return hit


def in_background(x, y):
    if x < 0 or y < 0 or x >= 64 or y >= 64:
        return False
    # SVG: rx=13 en un cuadrado de 64 x 64.
    cx = 13 if x < 13 else 51 if x > 51 else x
    cy = 13 if y < 13 else 51 if y > 51 else y
    return (x - cx) ** 2 + (y - cy) ** 2 <= 13 ** 2


def at(x, y):
    if not in_background(x, y):
        return (0, 0, 0, 0)
    color = BACKGROUND
    if in_polygon(x, y, FIRST):
        color = STEEL
    if in_polygon(x, y, SECOND):
        color = CYAN
    # Trazo horizontal de 3 px con extremos redondeados.
    if 8 <= x <= 56 and abs(y - 53) <= 1.5 or (
        (x - 8) ** 2 + (y - 53) ** 2 <= 1.5 ** 2 or
        (x - 56) ** 2 + (y - 53) ** 2 <= 1.5 ** 2
    ):
        color = LINE
    return (*color, 255)


def chunk(tag, data):
    header = tag + data
    return struct.pack(">I", len(data)) + header + struct.pack(
        ">I", binascii.crc32(header) & 0xffffffff
    )


def write_png(size):
    rows = bytearray()
    # 2x2 antialias para bordes suaves en iOS/Android.
    for py in range(size):
        rows.append(0)  # filtro PNG 0
        for px in range(size):
            samples = [at((px + dx) * 64 / size, (py + dy) * 64 / size)
                       for dy in (0.25, 0.75) for dx in (0.25, 0.75)]
            alpha = sum(c[3] for c in samples) // 4
            if alpha:
                rgb = [sum(c[k] * c[3] for c in samples) //
                       max(1, sum(c[3] for c in samples)) for k in range(3)]
            else:
                rgb = [0, 0, 0]
            rows.extend((*rgb, alpha))
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    encoded = (b"\\x89PNG\\r\\n\\x1a\\n" + chunk(b"IHDR", ihdr) +
               chunk(b"IDAT", zlib.compress(rows, level=9)) +
               chunk(b"IEND", b""))
    dest = ROOT / f"icon-{size}.png"
    dest.write_bytes(encoded)
    print(f"{dest.name}: {size}x{size}, {len(encoded)} bytes")


if __name__ == "__main__":
    for width in (180, 192, 512):
        write_png(width)
