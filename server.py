#!/usr/bin/env python3
"""Local dev/preview server for the ETAX clean-URL SPA.

    python3 server.py            # http://localhost:8000
    PORT=3000 python3 server.py

Serves real files as-is; any other path (e.g. /about, /service/vat-consultancy)
falls back to index.html so the History-API router can render it — the same
job 404.html does on GitHub Pages. (`python3 -m http.server` returns a hard
404 on those paths, which is why this file exists.)
"""
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class SPAHandler(SimpleHTTPRequestHandler):
    def _fallback(self):
        # translate_path ignores the query string, so this checks the file itself
        if not os.path.exists(self.translate_path(self.path)):
            self.path = "/index.html"

    def do_GET(self):
        self._fallback()
        super().do_GET()

    def do_HEAD(self):
        self._fallback()
        super().do_HEAD()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    ThreadingHTTPServer(("0.0.0.0", port), SPAHandler).serve_forever()
