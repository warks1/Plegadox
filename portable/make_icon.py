"""Construye el icono de Windows desde el icono premium de PlegadoX."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
image = Image.open(ROOT / "icon-premium-512.png").convert("RGBA")
image.save(Path(__file__).with_name("plegadox.ico"),
           sizes=[(16,16), (24,24), (32,32), (48,48), (64,64), (128,128), (256,256)])
print("ICO_PREMIUM_OK")
