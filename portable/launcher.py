"""Lanzador USB Windows de PlegadoX: HTTP restringido a localhost, sin instalación."""
from __future__ import annotations

import http.server
import pathlib
import sys
import threading
import webbrowser
import secrets
import json
import os
import tempfile
from datetime import datetime

HOST = "127.0.0.1"
PORT = 8765


def program_directory() -> pathlib.Path:
    """Los archivos web residen junto al EXE, nunca en el temporal de PyInstaller."""
    if getattr(sys, "frozen", False):
        return pathlib.Path(sys.executable).resolve().parent / "app"
    return pathlib.Path(__file__).resolve().parents[1]


USB_API = "/__plegadox_usb__/"
MAX_BACKUP_BYTES = 4 * 1024 * 1024


def handler_for(directory: pathlib.Path, token: str, backup_dir: pathlib.Path):
    class AppHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(directory), **kwargs)

        def log_message(self, _format, *args):
            pass

        def end_headers(self):
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            super().end_headers()

        def _json(self, code: int, content: dict):
            body = json.dumps(content, ensure_ascii=False).encode("utf-8")
            self.send_response(code)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _expected_origin(self):
            return f"http://{HOST}:{self.server.server_port}"

        def _valid_host(self):
            return self.headers.get("Host") == f"{HOST}:{self.server.server_port}"

        def do_GET(self):
            if self.path.split("?", 1)[0] == USB_API + "status":
                if not self._valid_host():
                    return self._json(403, {"error": "Host no autorizado"})
                return self._json(200, {
                    "mode": "usb", "available": True, "token": token,
                    "folder": "MIS_PROYECTOS", "maxBytes": MAX_BACKUP_BYTES
                })
            return super().do_GET()

        def do_POST(self):
            if self.path.split("?", 1)[0] != USB_API + "backup":
                return self._json(404, {"error": "Ruta desconocida"})
            # Defensa contra solicitudes desde otras webs (CSRF) y
            # reenrutamiento de dominios a 127.0.0.1 (DNS rebinding).
            if (not self._valid_host() or
                self.headers.get("Origin") != self._expected_origin() or
                not secrets.compare_digest(
                    self.headers.get("X-PlegadoX-USB-Token", ""), token)):
                return self._json(403, {"error": "Origen o sesión no autorizados"})
            if self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower() != "application/json":
                return self._json(415, {"error": "Se requiere application/json"})
            try:
                length = int(self.headers.get("Content-Length", "-1"))
            except ValueError:
                length = -1
            if length < 1 or length > MAX_BACKUP_BYTES:
                return self._json(413, {"error": "Copia demasiado grande o vacía"})
            try:
                payload = json.loads(self.rfile.read(length))
            except (ValueError, UnicodeError):
                return self._json(400, {"error": "JSON de copia no válido"})
            if (not isinstance(payload, dict) or
                payload.get("format") != "plegadox-complete-project-v1" or
                payload.get("schemaVersion") != 1 or
                not isinstance(payload.get("piece"), dict) or
                not isinstance(payload.get("machine"), dict) or
                not isinstance(payload.get("importedTools"), list) or
                not isinstance(payload.get("library"), list)):
                return self._json(422, {"error": "Formato de copia completa no reconocido"})
            filename = ("PlegadoX-BACKUP-" + datetime.now().strftime("%Y%m%d-%H%M%S") +
                        "-" + secrets.token_hex(4) + ".json")
            temporary = None
            try:
                backup_dir.mkdir(parents=True, exist_ok=True)
                # Escribir primero un temporal para que apagar o quitar el USB
                # no deje una copia truncada con el nombre definitivo.
                with tempfile.NamedTemporaryFile(
                    "w", encoding="utf-8", dir=backup_dir,
                    prefix=".plegadox-", suffix=".tmp", delete=False
                ) as handle:
                    temporary = pathlib.Path(handle.name)
                    # Copia compacta para que el tamaño guardado coincida
                    # con el límite de restauración en otros PC.
                    json.dump(payload, handle, ensure_ascii=False, separators=(",", ":"))
                    handle.flush()
                    os.fsync(handle.fileno())
                if temporary.stat().st_size > MAX_BACKUP_BYTES:
                    return self._json(413, {"error": "La copia excede 4 MB una vez escrita"})
                os.replace(temporary, backup_dir / filename)
            except OSError:
                return self._json(507, {"error": "No se pudo escribir el USB. Comprueba que tiene espacio y permisos"})
            finally:
                if temporary and temporary.exists():
                    temporary.unlink(missing_ok=True)
            return self._json(201, {"saved": True, "file": filename, "folder": "MIS_PROYECTOS"})

    return AppHandler


def serve(directory: pathlib.Path, port: int = PORT):
    if not (directory / "index.html").is_file() or not (directory / "build-info.json").is_file():
        raise FileNotFoundError("Falta la carpeta app con PlegadoX completo junto al ejecutable.")
    token = secrets.token_urlsafe(24)
    return http.server.ThreadingHTTPServer(
        (HOST, port), handler_for(directory, token, directory.parent / "MIS_PROYECTOS")
    )


def main():
    import tkinter as tk
    from tkinter import messagebox

    root = tk.Tk()
    root.title("PLEGADOX · Edición portátil USB")
    root.geometry("490x275")
    root.resizable(False, False)
    root.configure(bg="#0a1728")

    try:
        server = serve(program_directory())
    except (OSError, FileNotFoundError) as error:
        messagebox.showerror("PlegadoX · No se puede iniciar", str(error), parent=root)
        root.destroy()
        return 1

    threading.Thread(target=server.serve_forever, name="plegadox-local", daemon=True).start()
    url = f"http://{HOST}:{PORT}/"

    tk.Label(root, text="PLEGADOX", bg="#0a1728", fg="#e9f5ff",
             font=("Segoe UI", 28, "bold")).pack(pady=(24, 3))
    tk.Label(root, text="EDICIÓN PORTÁTIL  ·  USB / WINDOWS", bg="#0a1728",
             fg="#81b9df", font=("Segoe UI", 10, "bold")).pack()
    tk.Label(root, text="Servidor privado en este PC: 127.0.0.1:8765",
             bg="#0a1728", fg="#c9d9e9", font=("Segoe UI", 10)).pack(pady=(15, 8))

    def open_app():
        webbrowser.open(url, new=2)

    def close_app():
        server.shutdown()
        server.server_close()
        root.destroy()

    tk.Button(root, text="ABRIR PLEGADOX", command=open_app,
              bg="#147bd4", fg="white", activebackground="#2c99ea",
              activeforeground="white", relief="flat", cursor="hand2",
              font=("Segoe UI", 11, "bold"), padx=28, pady=11).pack(pady=(4, 10))
    tk.Button(root, text="Cerrar servidor portátil", command=close_app,
              bg="#0a1728", fg="#b6cde1", relief="flat", cursor="hand2").pack()
    root.protocol("WM_DELETE_WINDOW", close_app)
    root.after(400, open_app)
    root.mainloop()
    return 0


def self_test():
    """Prueba el propio ejecutable empaquetado: web local sin abrir ventanas."""
    import json
    from urllib.request import urlopen

    server = serve(program_directory(), 0)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        base = f"http://{HOST}:{server.server_port}/"
        with urlopen(base, timeout=8) as response:
            if b"PLEGA" not in response.read():
                raise RuntimeError("La interfaz HTML no responde")
        with urlopen(base + "build-info.json", timeout=8) as response:
            data = json.load(response)
            if not data.get("version") or not data.get("build"):
                raise RuntimeError("Metadatos incompletos en el paquete")
        # Validar archivos reales desde la copia USB, no el árbol del repositorio.
        import re
        sw = (program_directory() / "sw.js").read_text(encoding="utf-8")
        match = re.search(r"const\s+APP_FILES\s*=\s*\[(.*?)\]\s*;", sw, re.S)
        if not match:
            raise RuntimeError("Falta el manifiesto de recursos locales APP_FILES")
        paths = re.findall(r'"(\./[^"]*)"', match.group(1))
        if len(paths) < 65:
            raise RuntimeError("Paquete USB incompleto: faltan módulos")
        for path in paths:
            with urlopen(base + path, timeout=8) as response:
                if response.status != 200:
                    raise RuntimeError(f"No responde el archivo {path}")
        return 0
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    raise SystemExit(self_test() if "--self-test" in sys.argv else main())
