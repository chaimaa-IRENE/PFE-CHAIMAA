import asyncio
import sys
import os
import json
import hashlib
import edge_tts

TTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tts_cache")
os.makedirs(TTS_DIR, exist_ok=True)

async def generate(text: str, voice: str = "ar-MA-JamalNeural", rate: str = "-5%", pitch: str = "+0Hz"):
    rate = rate.replace("pct", "%")
    h = hashlib.md5(f"{text}|{voice}|{rate}".encode()).hexdigest()
    path = os.path.join(TTS_DIR, f"{h}.mp3")

    if os.path.exists(path) and os.path.getsize(path) > 0:
        print(json.dumps({"status": "cached", "path": path}))
        return

    try:
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await communicate.save(path)
        print(json.dumps({"status": "ok", "path": path}))
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "error": "No text provided"}))
        sys.exit(1)

    text = sys.argv[1]
    voice = sys.argv[2] if len(sys.argv) > 2 else "ar-MA-JamalNeural"
    rate = sys.argv[3] if len(sys.argv) > 3 else "-5%"

    asyncio.run(generate(text, voice, rate))