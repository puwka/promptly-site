"""
Static file server for Promptly site on H1Cloud / Pterodactyl-style panels.
Listens on SERVER_PORT or PORT from the environment.
"""

from __future__ import annotations

import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent

# Clean URL → file (same idea as vercel.json cleanUrls)
CLEAN_ROUTES = {
    "/": "index.html",
    "/pricing": "pricing.html",
    "/documentation": "documentation.html",
    "/support": "support.html",
    "/privacy": "privacy.html",
    "/terms": "terms.html",
    "/refund": "refund.html",
    "/checkout": "checkout.html",
}


class PromptlyHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path or "/")

        if path != "/" and path.endswith("/"):
            path = path.rstrip("/") or "/"

        mapped = CLEAN_ROUTES.get(path)
        if mapped:
            self.path = f"/{mapped}"
            if parsed.query:
                self.path += f"?{parsed.query}"
            return super().do_GET()

        # /pricing.html still works; unknown paths without extension → 404 page-ish
        candidate = ROOT / path.lstrip("/")
        if path != "/" and not candidate.exists() and "." not in Path(path).name:
            self.send_error(404, "Not found")
            return

        return super().do_GET()

    def log_message(self, fmt, *args):
        print(f"[http] {self.address_string()} - {fmt % args}")


def main():
    port = int(os.environ.get("SERVER_PORT") or os.environ.get("PORT") or "8080")
    host = "0.0.0.0"
    server = ThreadingHTTPServer((host, port), PromptlyHandler)
    print(f"Promptly site serving {ROOT}")
    print(f"Listening on http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
