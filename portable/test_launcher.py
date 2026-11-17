"""Pruebas de la versión portable sin necesidad de mostrar ventanas."""
import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.request import urlopen
from launcher import HOST, PORT, serve, backup_directory
from unittest.mock import patch


class PortableTests(unittest.TestCase):
    def test_private_bind_and_fixed_origin(self):
        self.assertEqual(HOST, "127.0.0.1")
        self.assertEqual(PORT, 8765)

    def test_installed_backups_survive_separate_program_directory(self):
        with tempfile.TemporaryDirectory() as temp:
            base = Path(temp)
            app = base / "Programs" / "PlegadoX" / "app"
            app.mkdir(parents=True)
            (app.parent / "installed-mode.marker").write_text("installed", encoding="utf-8")
            local = base / "LocalAppData"
            with patch.dict("os.environ", {"LOCALAPPDATA": str(local)}):
                self.assertEqual(backup_directory(app), local / "PlegadoX" / "MIS_PROYECTOS")
            (app.parent / "installed-mode.marker").unlink()
            self.assertEqual(backup_directory(app), app.parent / "MIS_PROYECTOS")

    def test_no_missing_assets_are_accepted(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaises(FileNotFoundError):
                serve(Path(temp), 0)

    def test_http_local_responds(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            (folder / "index.html").write_text("<h1>PlegadoX</h1>", encoding="utf-8")
            (folder / "build-info.json").write_text(json.dumps({"version":"x"}), encoding="utf-8")
            server = serve(folder, 0)
            try:
                threading.Thread(target=server.serve_forever, daemon=True).start()
                url = f"http://127.0.0.1:{server.server_port}/"
                with urlopen(url, timeout=4) as response:
                    self.assertIn(b"PlegadoX", response.read())
                    self.assertEqual(response.headers.get("Cache-Control"), "no-store")
                with urlopen(url + "build-info.json", timeout=4) as response:
                    self.assertEqual(json.load(response)["version"], "x")
                from urllib.request import Request
                from urllib.error import HTTPError
                with self.assertRaises(HTTPError) as denied:
                    urlopen(Request(url, headers={"Host": "other.example"}), timeout=4)
                self.assertEqual(denied.exception.code, 403)
            finally:
                server.shutdown()
                server.server_close()




class BundleIntegrityTests(unittest.TestCase):
    def test_real_app_resources_resolve(self):
        from verify_bundle import verify
        root = Path(__file__).resolve().parents[1]
        found = verify(root)
        self.assertGreaterEqual(found["sw_entries"], 65)
        self.assertGreaterEqual(found["assets"], 65)

    def test_missing_resource_is_detected(self):
        from verify_bundle import verify
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            (folder / "index.html").write_text("<h1>PlegadoX</h1>", encoding="utf-8")
            with self.assertRaises(FileNotFoundError):
                verify(folder)


    def test_usb_backup_persists_in_sibling_folder(self):
        import urllib.request
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            app = root / "app"
            app.mkdir()
            (app / "index.html").write_text("<h1>PlegadoX</h1>", encoding="utf-8")
            (app / "build-info.json").write_text('{"version":"x"}', encoding="utf-8")
            server = serve(app, 0)
            threading.Thread(target=server.serve_forever, daemon=True).start()
            try:
                origin = f"http://127.0.0.1:{server.server_port}"
                with urlopen(origin + "/__plegadox_usb__/status", timeout=4) as response:
                    status = json.load(response)
                self.assertEqual(status["folder"], "MIS_PROYECTOS")
                self.assertEqual(status["mode"], "usb")
                payload = {
                    "format":"plegadox-complete-project-v1","schemaVersion":1,
                    "piece":{"name":"Omega"},
                    "machine":{"ram":[],"bed":[]},
                    "importedTools":[],"library":[]
                }
                def request(token, origin_header, content_type="application/json", data=payload):
                    return urllib.request.Request(
                        origin + "/__plegadox_usb__/backup",
                        data=json.dumps(data).encode("utf-8"),
                        headers={
                            "Origin": origin_header,
                            "X-PlegadoX-USB-Token": token,
                            "Content-Type": content_type
                        },
                        method="POST"
                    )
                from urllib.error import HTTPError
                with self.assertRaises(HTTPError) as denied:
                    urlopen(request(status["token"], "https://malicious.example"), timeout=4)
                self.assertEqual(denied.exception.code, 403)
                with self.assertRaises(HTTPError) as denied:
                    urlopen(request("token-invalido", origin), timeout=4)
                self.assertEqual(denied.exception.code, 403)
                with self.assertRaises(HTTPError) as denied:
                    urlopen(request(status["token"], origin, "text/plain"), timeout=4)
                self.assertEqual(denied.exception.code, 415)
                with self.assertRaises(HTTPError) as denied:
                    urlopen(request(status["token"], origin, data={"format":"otro"}), timeout=4)
                self.assertEqual(denied.exception.code, 422)
                self.assertFalse((root / "MIS_PROYECTOS").exists(), "un rechazo nunca crea copias")
                with urlopen(request(status["token"], origin), timeout=4) as response:
                    result = json.load(response)
                    self.assertEqual(response.status, 201)
                saved = root / "MIS_PROYECTOS" / result["file"]
                self.assertTrue(saved.is_file())
                self.assertEqual(json.loads(saved.read_text(encoding="utf-8"))["piece"]["name"], "Omega")
                self.assertEqual(len(list(saved.parent.glob("*.json"))), 1)
            finally:
                server.shutdown()
                server.server_close()

if __name__ == "__main__":
    unittest.main()
