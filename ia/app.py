import os
import sys
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from analyzer import analyze_image, analyze_video, _ocr_aggressive, _ocr_fast, _clean_ocr_text, extract_kilometrage, extract_plate

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:8080"])

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 200 * 1024 * 1024

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "bmp", "webp", "mp4", "avi", "mov", "mkv", "webm"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/analyze-image", methods=["POST"])
def analyze_image_endpoint():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "Aucun fichier fourni"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "Nom de fichier vide"}), 400
    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Type de fichier non supporte"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    try:
        analysis = analyze_image(filepath)
        return jsonify({"success": True, "analysis": analysis, "filename": filename})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/analyze-video", methods=["POST"])
def analyze_video_endpoint():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "Aucun fichier fourni"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "Nom de fichier vide"}), 400
    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Type de fichier non supporte"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    try:
        analysis = analyze_video(filepath)
        return jsonify({"success": True, "analysis": analysis, "filename": filename})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/debug-video", methods=["POST"])
def debug_video_endpoint():
    """Analyse video + retourne TOUS les textes OCR bruts pour debug."""
    if "file" not in request.files:
        return jsonify({"success": False, "error": "Aucun fichier fourni"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "Nom de fichier vide"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    cap = cv2.VideoCapture(filepath)
    if not cap.isOpened():
        return jsonify({"success": False, "error": "Cannot open video"}), 400
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    mid_frame = total // 2
    cap.set(cv2.CAP_PROP_POS_FRAMES, mid_frame)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        return jsonify({"success": False, "error": "Cannot read frame"}), 400

    # Collect ALL OCR outputs from all methods
    raw_results = {}

    # _ocr_aggressive results
    aggressive_texts = _ocr_aggressive(frame)
    raw_results["aggressive_full_frame"] = aggressive_texts

    # _ocr_fast on different PSM values
    for psm in [3, 6, 7, 8, 11, 12, 13]:
        try:
            t = _ocr_fast(frame, psm=psm)
            if t:
                raw_results[f"fast_psm{psm}"] = t
        except:
            pass

    # Also try region-based
    h, w = frame.shape[:2]
    regions = {
        "bottom_third": frame[h*2//3:h, :],
        "middle": frame[h//3:h*2//3, :],
        "top_third": frame[:h//3, :],
        "full": frame,
    }
    for name, region in regions.items():
        for psm in [6, 7]:
            try:
                t = _ocr_fast(region, psm=psm)
                if t:
                    raw_results[f"{name}_psm{psm}"] = t
            except:
                pass

    return jsonify({
        "success": True,
        "filename": filename,
        "frame": mid_frame,
        "raw_ocr": raw_results,
        "cleaned": {k: [_clean_ocr_text(t) for t in v] for k, v in raw_results.items()},
    })


@app.route("/api/extract-km", methods=["POST"])
def extract_km_endpoint():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "Aucun fichier fourni"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "Nom de fichier vide"}), 400
    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Type de fichier non supporte"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    try:
        result = extract_kilometrage(filepath)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/extract-plate", methods=["POST"])
def extract_plate_endpoint():
    if "file" not in request.files:
        return jsonify({"success": False, "error": "Aucun fichier fourni"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "Nom de fichier vide"}), 400
    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Type de fichier non supporte"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(filepath)

    try:
        result = extract_plate(filepath)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5001
    print(f"Python AI Service starting on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
