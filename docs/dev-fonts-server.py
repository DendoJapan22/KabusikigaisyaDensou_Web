from http.server import SimpleHTTPRequestHandler, HTTPServer
import os
os.chdir(os.environ.get('FONT_DIR', 'fonts'))

class H(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, *a):
        pass

HTTPServer(('127.0.0.1', 8343), H).serve_forever()
