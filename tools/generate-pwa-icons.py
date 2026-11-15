#!/usr/bin/env python3
"""Verifica los iconos premium de la PWA y sincroniza rutas antiguas.

El diseño vigente son icon-premium-180.png, -192.png y -512.png.
No regenerar el símbolo simplificado que el usuario ha rechazado.
Se usa solo la biblioteca estándar de Python.
"""
from __future__ import annotations
from pathlib import Path
import shutil
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]
PNG_HEADER = b"\x89PNG\r\n\x1a\n"
SIZES = (180, 192, 512)


def validate_png(path: Path, expected_size: int) -> None:
    data = path.read_bytes()
    if not data.startswith(PNG_HEADER):
        raise ValueError(f"{path.name}: cabecera PNG incorrecta")
    off = len(PNG_HEADER)
    seen_ihdr = seen_idat = seen_end = False
    while off + 12 <= len(data):
        length = struct.unpack_from(">I", data, off)[0]
        typ = data[off + 4:off + 8]
        payload = data[off + 8:off + 8 + length]
        ending = off + 8 + length
        if len(payload) != length or ending + 4 > len(data):
            raise ValueError(f"{path.name}: bloque {typ!r} truncado")
        crc = struct.unpack_from(">I", data, ending)[0]
        if zlib.crc32(typ + payload) & 0xFFFFFFFF != crc:
            raise ValueError(f"{path.name}: CRC corrupto {typ!r}")
        if typ == b"IHDR":
            if seen_ihdr or length != 13:
                raise ValueError(f"{path.name}: bloque IHDR inválido")
            width, height = struct.unpack_from(">II", payload)
            if (width, height) != (expected_size, expected_size):
                raise ValueError(
                    f"{path.name}: {width}x{height}, se esperaba {expected_size}x{expected_size}"
                )
            seen_ihdr = True
        elif typ == b"IDAT":
            seen_idat = True
        elif typ == b"IEND":
            seen_end = True
            if ending + 4 != len(data):
                raise ValueError(f"{path.name}: datos despues de IEND")
            break
        off = ending + 4
    if not (seen_ihdr and seen_idat and seen_end):
        raise ValueError(f"{path.name}: faltan secciones PNG esenciales")


def main() -> None:
    for size in SIZES:
        premium = ROOT / f"icon-premium-{size}.png"
        if not premium.is_file():
            raise FileNotFoundError(
                f"{premium.name}: falta el icono industrial usado por iPhone/PWA"
            )
        validate_png(premium, size)
        # Pruebas antiguas pueden pedir icon-{size}.png: copiar el
        # premium verificado, nunca dibujar de nuevo el icono basico.
        legacy = ROOT / f"icon-{size}.png"
        shutil.copyfile(premium, legacy)
        validate_png(legacy, size)
        print(f"{premium.name}: icono premium validado ({premium.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
