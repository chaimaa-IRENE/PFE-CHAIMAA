"""Edge TTS Server — JamalNeural voice on port 5000"""
import asyncio, logging, sys, io
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from edge_tts import Communicate, list_voices

app = Flask(__name__)
CORS(app)
VOICE = "ar-MA-JamalNeural"
RATE = "-5%"

def generate_audio(text, voice=VOICE, rate=RATE):
    """Synchronously run edge-tts and return MP3 bytes."""
    async def _run():
        mp3 = b""
        async for chunk in Communicate(text, voice=voice, rate=rate).stream():
            if chunk["type"] == "audio":
                mp3 += chunk["data"]
        return mp3
    return asyncio.run(_run())

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "voice": VOICE})

@app.route("/api/tts/voices")
def voices():
    voices_list = asyncio.run(list_voices())
    return jsonify(voices_list)

@app.route("/api/tts/speak")
def speak():
    text = request.args.get("text", "")
    voice = request.args.get("voice", VOICE)
    rate = request.args.get("rate", RATE)
    if not text:
        return jsonify({"error": "Missing 'text' param"}), 400
    try:
        mp3 = generate_audio(text, voice, rate)
        if not mp3:
            return jsonify({"error": "No audio generated"}), 500
        return Response(mp3, mimetype="audio/mpeg")
    except Exception as e:
        logging.exception("TTS error")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, stream=sys.stdout)
    print(f"Edge-TTS server starting on port 5000 with voice {VOICE}", flush=True)
    app.run(host="0.0.0.0", port=5000, threaded=True)
