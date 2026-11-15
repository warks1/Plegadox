"""Pruebas de la versión portable sin necesidad de mostrar ventanas."""
import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.request import urlopen
from launcher import HOST, PORT, serve


class PortableTests(unittest.TestCase):
    def test_private_bind_and_fixed_origin(self):
        self.assertEqual(HOST, "127.0.0.1")
        self.assertEqual(PORT, 8765)

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
            finally:
                server.shutdown()
                server.server_close()


if __name__ == "__main__":
    unittest.main()
