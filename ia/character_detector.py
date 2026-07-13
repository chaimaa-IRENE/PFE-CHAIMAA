import cv2
import numpy as np

# Character templates (simple binary digits/letters)
CHAR_TEMPLATES = {}

def _build_templates():
    if CHAR_TEMPLATES:
        return
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    for ch in chars:
        img = np.zeros((30, 20), dtype=np.uint8)
        cv2.putText(img, ch, (2, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.8, 255, 2)
        CHAR_TEMPLATES[ch] = img


def detect_characters_from_plate(plate_region, min_area=30, max_area=2000, aspect_ratio_range=(0.3, 1.5)):
    """Extract individual character blobs from a plate region using connected components."""
    gray = cv2.cvtColor(plate_region, cv2.COLOR_BGR2GRAY) if len(plate_region.shape) == 3 else plate_region.copy()
    chars = []

    # Try multiple thresholds
    for thresh_val in [0, 100, 127, 150, 200]:
        if thresh_val == 0:
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        else:
            _, binary = cv2.threshold(gray, thresh_val, 255, cv2.THRESH_BINARY)

        # Also try inverse
        for inv in [False, True]:
            bw = cv2.bitwise_not(binary) if inv else binary
            num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(bw, 8)

            for i in range(1, num_labels):
                area = stats[i, cv2.CC_STAT_AREA]
                if area < min_area or area > max_area:
                    continue
                x = stats[i, cv2.CC_STAT_LEFT]
                y = stats[i, cv2.CC_STAT_TOP]
                cw = stats[i, cv2.CC_STAT_WIDTH]
                ch = stats[i, cv2.CC_STAT_HEIGHT]
                if cw == 0 or ch == 0:
                    continue
                aspect = cw / ch
                if aspect < aspect_ratio_range[0] or aspect > aspect_ratio_range[1]:
                    continue
                char_roi = bw[y:y+ch, x:x+cw]
                chars.append({
                    "roi": char_roi,
                    "x": x, "y": y, "w": cw, "h": ch,
                    "aspect": aspect,
                    "area": area,
                })
    return chars


def extract_text_from_chars(chars, sort_by_x=True):
    """Reconstruct text from detected character blobs."""
    if not chars:
        return ""
    if sort_by_x:
        chars = sorted(chars, key=lambda c: c["x"])
    # Group overlapping Y coordinates into rows
    rows = []
    for c in chars:
        placed = False
        for row in rows:
            if abs(row["y_avg"] - c["y"]) < row["h_avg"]:
                row["chars"].append(c)
                placed = True
                break
        if not placed:
            rows.append({"y_avg": c["y"], "h_avg": c["h"], "chars": [c]})
    # Return the row with most chars
    if not rows:
        return ""
    best_row = max(rows, key=lambda r: len(r["chars"]))
    best_row["chars"].sort(key=lambda c: c["x"])
    return "".join(chr_classify_char(c["roi"]) for c in best_row["chars"])


def chr_classify_char(roi, template_size=(20, 30)):
    """Classify a character blob using template matching with font templates."""
    _build_templates()
    if roi.size == 0:
        return "?"

    resized = cv2.resize(roi, template_size, interpolation=cv2.INTER_NEAREST)
    best_score = -1
    best_char = "?"

    for ch, templ in CHAR_TEMPLATES.items():
        # Use simple pixel matching (normalized correlation)
        result = cv2.matchTemplate(resized, templ, cv2.TM_CCOEFF_NORMED)
        _, score, _, _ = cv2.minMaxLoc(result)
        if score > best_score:
            best_score = score
            best_char = ch

    return best_char if best_score > 0.2 else "?"


def detect_plate_characters_yolo(plate_region, model=None):
    """Use YOLO to detect individual characters in plate region (if fine-tuned)."""
    if model is None:
        return []
    try:
        results = model(plate_region, verbose=False)
        chars = []
        names = model.names
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = names.get(cls_id, "")
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                if len(label) == 1 and label.isalnum():
                    chars.append({"char": label, "conf": conf, "x": x1, "y": y1, "w": x2-x1, "h": y2-y1})
        return chars
    except Exception:
        return []
