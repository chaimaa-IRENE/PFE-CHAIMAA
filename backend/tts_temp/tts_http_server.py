import os
import sys

os.environ.setdefault("PYTHONUTF8", "1")
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import hashlib
import asyncio
import urllib.parse
import edge_tts
import threading

def safe_print(msg):
    try:
        print(msg, flush=True)
    except Exception:
        try:
            sys.stdout.buffer.write((str(msg) + "\n").encode("utf-8", "replace"))
            sys.stdout.buffer.flush()
        except Exception:
            pass

TTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tts_cache")
os.makedirs(TTS_DIR, exist_ok=True)

_key_locks = {}
_key_locks_guard = threading.Lock()

def get_key_lock(key):
    with _key_locks_guard:
        if key not in _key_locks:
            _key_locks[key] = threading.Lock()
        return _key_locks[key]

async def generate_tts(text, voice="ar-MA-JamalNeural", rate="-5%"):
    rate = rate.replace("pct", "%")
    h = hashlib.md5(f"{text}|{voice}|{rate}".encode()).hexdigest()
    path = os.path.join(TTS_DIR, f"{h}.mp3")
    if os.path.exists(path) and os.path.getsize(path) > 0:
        safe_print(f"[TTS] Cache hit: {h}")
        return path
    try:
        safe_print(f"[TTS] Generating: text='{text[:50]}' voice={voice}")
        tmp_path = path + ".tmp"
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        await communicate.save(tmp_path)
        os.rename(tmp_path, path)
        safe_print(f"[TTS] Done: {os.path.getsize(path)} bytes")
        return path
    except Exception as e:
        safe_print(f"[TTS] ERROR: {e}")
        if os.path.exists(path + ".tmp"):
            try: os.remove(path + ".tmp")
            except: pass
        return None

class TTSHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        safe_print(f"[HTTP] {self.address_string()} - {format % args}")

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if "/api/tts/speak" in parsed.path:
            text = params.get("text", ["hello"])[0]
            voice = params.get("voice", ["ar-MA-JamalNeural"])[0]
            rate = params.get("rate", ["-5%"])[0]

            text = urllib.parse.unquote(text)
            voice = urllib.parse.unquote(voice)
            rate = urllib.parse.unquote(rate)

            safe_print(f"[TTS] GET text='{text[:60]}' voice={voice}")

            h = hashlib.md5(f"{text}|{voice}|{rate}".encode()).hexdigest()
            key_lock = get_key_lock(h)
            with key_lock:
                path = asyncio.run(generate_tts(text, voice, rate))

            if path and os.path.exists(path) and os.path.getsize(path) > 0:
                self.send_response(200)
                self.send_header("Content-Type", "audio/mpeg")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "*")
                self.send_header("Cache-Control", "max-age=86400")
                self.send_header("Content-Length", str(os.path.getsize(path)))
                self.end_headers()
                with open(path, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "TTS generation failed"}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')

        text = "hello"
        voice = "ar-MA-JamalNeural"
        rate = "-5%"

        try:
            data = json.loads(body)
            text = data.get("text", "hello")
            voice = data.get("voice", "ar-MA-JamalNeural")
            rate = data.get("rate", "-5%")
        except:
            params = urllib.parse.parse_qs(body)
            text = params.get("text", ["hello"])[0]
            voice = params.get("voice", ["ar-MA-JamalNeural"])[0]
            rate = params.get("rate", ["-5%"])[0]

        safe_print(f"[TTS] POST text='{text[:60]}' voice={voice}")

        h = hashlib.md5(f"{text}|{voice}|{rate}".encode()).hexdigest()
        key_lock = get_key_lock(h)
        with key_lock:
            path = asyncio.run(generate_tts(text, voice, rate))

        if path and os.path.exists(path) and os.path.getsize(path) > 0:
            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "*")
            self.send_header("Content-Length", str(os.path.getsize(path)))
            self.end_headers()
            with open(path, "rb") as f:
                self.wfile.write(f.read())
        else:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "TTS generation failed"}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    server = ThreadingHTTPServer(("0.0.0.0", port), TTSHandler)
    server.timeout = 300
    safe_print(f"TTS server running on port {port}")
    server.serve_forever()