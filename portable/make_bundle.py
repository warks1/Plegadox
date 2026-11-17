"""Genera el ZIP portátil de Windows a partir de los ficheros web originales."""
from __future__ import annotations

import json
from pathlib import Path
import shutil
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
FOLDER = DIST / "PlegadoX-USB-Windows"
EXTENSIONS = {".js", ".html", ".css", ".json", ".svg", ".png", ".webmanifest", ".ico"}


def build():
    executable = DIST / "PlegadoX.exe"
    if not executable.is_file():
        raise FileNotFoundError(f"No se generó el ejecutable: {executable}")
    if FOLDER.exists():
        shutil.rmtree(FOLDER)
    web_dir = FOLDER / "app"
    web_dir.mkdir(parents=True)
    copied = []
    for source in ROOT.iterdir():
        if source.is_file() and source.suffix.lower() in EXTENSIONS:
            shutil.copy2(source, web_dir / source.name)
            copied.append(source.name)
    if not {"index.html", "build-info.json", "sw.js"}.issubset(copied):
        raise RuntimeError("Faltan archivos web indispensables")
    info = json.loads((web_dir / "build-info.json").read_text(encoding="utf-8"))
    shutil.copy2(executable, FOLDER / "PlegadoX.exe")
    backups = FOLDER / "MIS_PROYECTOS"
    backups.mkdir()
    (backups / "LEEME.txt").write_text(
        "Guarda aquí las copias integrales exportadas de PlegadoX.\n"
        "Las piezas del navegador del PC NO se copian automáticamente al USB.\n"
        "En PlegadoX USB pulsa GUARDAR COPIA EN USB para crear aquí un backup completo.\n"
        "Para llevar las piezas a otro PC, restaura la copia desde el programa.\n",
        encoding="utf-8-sig")
    (FOLDER / "INSTRUCCIONES.txt").write_text(
        f"PLEGADOX USB · {info['build']} · versión {info['version']}\n\n"
        "1. Extrae TODO este ZIP a una carpeta del pendrive (FAT32/exFAT/NTFS).\n"
        "2. En un PC con Windows 10/11, haz doble clic en PlegadoX.exe.\n"
        "3. La ventana portátil inicia PlegadoX en el navegador predeterminado.\n"
        "4. Mantén la ventana abierta mientras uses el software. Al terminar, ciérrala.\n"
        "5. No retires el USB hasta cerrar el programa.\n\n"
        "No necesita instalar Python ni conexión a internet para ejecutar los archivos web.\n"
        "El ejecutable todavía no está firmado digitalmente. Windows podría avisar.\n"
        "El puerto 8765 debe estar libre; sólo escucha en 127.0.0.1 (tu propio PC).\n"
        "No se ejecuta automáticamente al conectar el USB.\n"
        "Los datos del navegador quedan en ese PC: usa Guardar copia en USB y restaura en otro PC.\n"
        "Para INSTALAR en Windows, usa el instalador PlegadoX-Instalador-Windows.exe separado.\n"
        "La validación 2D/3D sigue siendo provisional; no autoriza trabajo CNC real.\n",
        encoding="utf-8-sig")
    archive = DIST / "PlegadoX-USB-Windows.zip"
    with ZipFile(archive, "w", ZIP_DEFLATED, compresslevel=6) as zf:
        for file in sorted(FOLDER.rglob("*")):
            if file.is_file():
                zf.write(file, file.relative_to(DIST))
    print(f"PAQUETE_USB_OK {archive.name}; app={len(copied)} archivos; versión={info['version']}")


if __name__ == "__main__":
    build()
