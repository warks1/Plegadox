"""Lanzador USB Windows de PlegadoX: HTTP restringido a localhost, sin instalación."""
from __future__ import annotations

import http.server
import pathlib
import sys
import threading
import webbrowser

HOST = "127.0.0.1"
PORT = 8765


def program_directory() -> pathlib.Path:
    """Los archivos web residen junto al EXE, nunca en el temporal de PyInstaller."""
    if getattr(sys, "frozen", False):
        return pathlib.Path(sys.executable).resolve().parent / "app"
    return pathlib.Path(__file__).resolve().parents[1]


def handler_for(directory: pathlib.Path):
    class AppHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(directory), **kwargs)

        def log_message(self, _format, *args):
            pass

        def end_headers(self):
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            super().end_headers()

    return AppHandler


def serve(directory: pathlib.Path, port: int = PORT):
    if not (directory / "index.html").is_file() or not (directory / "build-info.json").is_file():
        raise FileNotFoundError("Falta la carpeta app con PlegadoX completo junto al ejecutable.")
    return http.server.ThreadingHTTPServer((HOST, port), handler_for(directory))


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
        return 0
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    raise SystemExit(self_test() if "--self-test" in sys.argv else main())
