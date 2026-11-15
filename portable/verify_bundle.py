"""Auditoría obligatoria del contenido web REAL del ZIP de PlegadoX USB.

Comprueba referencias del service worker, HTML, manifest, CSS y módulos JS.
Se ejecuta sobre la carpeta app generada (no sobre archivos de desarrollo).
No usa red ni instala herramientas.
"""
from __future__ import annotations

from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

SW_RE = re.compile(r"const\s+APP_FILES\s*=\s*\[(.*?)\]\s*;", re.S)
SW_FILE_RE = re.compile(r"""["'](\.\/[^"']*)["']""")
CSS_URL_RE = re.compile(r"""url\(\s*['"]?([^)'"]+)""", re.I)
JS_IMPORT_RE = re.compile(
    r"""(?:\bfrom\s*|\bimport\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]"""
)


class LocalAssets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in {"src", "href", "poster"} and value:
                self.refs.append(value)
            if key == "srcset" and value:
                self.refs.extend(part.strip().split()[0] for part in value.split(",") if part.strip())


def local_reference(root: Path, source: Path, ref: str) -> Path | None:
    raw = ref.strip()
    if not raw or raw.startswith(("#", "data:", "blob:", "mailto:", "tel:", "javascript:")):
        return None
    uri = urlsplit(raw)
    if uri.scheme or uri.netloc:
        return None
    if not uri.path or "{" in uri.path or "}" in uri.path:
        return None
    target = (root / uri.path.lstrip("/")) if uri.path.startswith("/") else (source.parent / unquote(uri.path))
    target = target.resolve()
    if not target.is_relative_to(root.resolve()):
        raise ValueError(f"Referencia externa a la carpeta USB: {source.name}: {raw}")
    return target


def verify(app_dir: Path) -> dict:
    root = app_dir.resolve()
    required = ["index.html", "styles.css", "sw.js", "manifest.webmanifest",
                "build-info.json", "splash-foto-premium.html", "plegadox-premium-selected.png"]
    missing = set(path for path in required if not (root / path).is_file())
    if missing:
        raise FileNotFoundError("Faltan archivos esenciales: " + ", ".join(sorted(missing)))

    info = json.loads((root / "build-info.json").read_text(encoding="utf-8"))
    sw = (root / "sw.js").read_text(encoding="utf-8")
    if f"const CACHE='{info['cache']}'" not in sw:
        raise ValueError("La caché PWA no coincide con build-info.json")

    match = SW_RE.search(sw)
    if not match:
        raise ValueError("No se reconoce la lista APP_FILES del service worker")
    sw_items = SW_FILE_RE.findall(match.group(1))
    if len(sw_items) < 65:
        raise ValueError("Lista APP_FILES incompleta")
    checked = set()

    def check(source: Path, ref: str):
        target = local_reference(root, source, ref)
        if target is not None:
            if not target.is_file() and not (target == root and (root / "index.html").is_file()):
                missing.add(str(target.relative_to(root)))
            else:
                checked.add(str(target.relative_to(root)) if target != root else "./")

    for ref in sw_items:
        check(root / "sw.js", ref)

    manifest_file = root / "manifest.webmanifest"
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    check(manifest_file, manifest["start_url"])
    for ico in manifest["icons"]:
        check(manifest_file, ico["src"])

    for html in root.glob("*.html"):
        parser = LocalAssets()
        parser.feed(html.read_text(encoding="utf-8"))
        for ref in parser.refs:
            check(html, ref)

    for css in root.glob("*.css"):
        for ref in CSS_URL_RE.findall(css.read_text(encoding="utf-8")):
            check(css, ref)

    for js in root.glob("*.js"):
        for ref in JS_IMPORT_RE.findall(js.read_text(encoding="utf-8")):
            check(js, ref)

    if missing:
        raise FileNotFoundError("Recursos faltantes en el paquete USB: " + ", ".join(sorted(missing)))
    return {"version": info["version"], "assets": len(checked), "sw_entries": len(sw_items)}


if __name__ == "__main__":
    folder = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / "dist" / "PlegadoX-USB-Windows" / "app"
    result = verify(folder)
    print(f"PLEGADOX_USB_ASSETS_OK version={result['version']} assets={result['assets']} sw_entries={result['sw_entries']}")
