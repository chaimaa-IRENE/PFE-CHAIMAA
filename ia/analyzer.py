import os, cv2, re, numpy as np, time
from PIL import Image
import tempfile
from datetime import datetime

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except Exception:
    YOLO_AVAILABLE = False

try:
    import pytesseract
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    TESSERACT_AVAILABLE = True
except Exception:
    TESSERACT_AVAILABLE = False

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except Exception:
    EASYOCR_AVAILABLE = False

FINETUNED_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "runs", "train", "weights", "best.pt")

_YOLO_MODEL_CACHE = None
_EASYOCR_READER = None

def _get_easyocr_reader():
    global _EASYOCR_READER
    if _EASYOCR_READER is not None:
        return _EASYOCR_READER
    if not EASYOCR_AVAILABLE:
        return None
    try:
        _EASYOCR_READER = easyocr.Reader(['en', 'fr'], gpu=False)
        return _EASYOCR_READER
    except Exception:
        return None

def _get_yolo_model():
    """Charge le meilleur modele disponible: fine-tune > yolov8n.pt > None."""
    global _YOLO_MODEL_CACHE
    if _YOLO_MODEL_CACHE is not None:
        return _YOLO_MODEL_CACHE
    if not YOLO_AVAILABLE:
        return None
    try:
        if os.path.exists(FINETUNED_MODEL_PATH):
            _YOLO_MODEL_CACHE = YOLO(FINETUNED_MODEL_PATH)
        else:
            _YOLO_MODEL_CACHE = YOLO("yolov8n.pt")
        return _YOLO_MODEL_CACHE
    except Exception:
        return None

FINETUNED_CLASSES = {
    0: "plaque_immatriculation",
    1: "compteur_vitesse",
    2: "roue",
    3: "pneu_creve",
    4: "frein",
    5: "phare",
    6: "feu_arriere",
    7: "carrosserie_impact",
    8: "carrosserie_fissure",
    9: "pare_brise_fissure",
    10: "retroviseur",
    11: "hayon",
    12: "pot_echappement",
    13: "klaxon",
}

# Mapping COCO classes -> elements vehicule
FINETUNED_TO_ELEMENT = {
    0: "DOCUMENTATION_LEGALE",  # plaque_immatriculation
    1: "CABINE",                # compteur_vitesse
    2: "PNEUS",                 # roue
    3: "PNEUS",                 # pneu_creve
    4: "FREINS",                # frein
    5: "ECLAIRAGE",             # phare
    6: "ECLAIRAGE",             # feu_arriere
    7: "CARROSSERIE",           # carrosserie_impact
    8: "CARROSSERIE",           # carrosserie_fissure
    9: "CABINE",                # pare_brise_fissure
    10: "CABINE",               # retroviseur
    11: "CAISSE",               # hayon
    12: "MECANIQUE",            # pot_echappement
    13: "KLAXON",               # klaxon
}

FINETUNED_TO_PANNE = {
    0: "SECURITE",    # plaque_immatriculation
    1: "CABINE",      # compteur_vitesse
    2: "PNEUS",       # roue
    3: "PNEUS",       # pneu_creve
    4: "FREINS",      # frein
    5: "ECLAIRAGE",   # phare
    6: "ECLAIRAGE",   # feu_arriere
    7: "CARROSSERIE", # carrosserie_impact
    8: "CARROSSERIE", # carrosserie_fissure
    9: "CABINE",      # pare_brise_fissure
    10: "CABINE",     # retroviseur
    11: "CAISSE",     # hayon
    12: "MECANIQUE",  # pot_echappement
    13: "KLAXON",     # klaxon
}

FINETUNED_CRITICITE = {
    0: "BLOQUANT",    # plaque_immatriculation missing = bloquant
    3: "BLOQUANT",    # pneu_creve
    4: "URGENT",      # frein
    5: "URGENT",      # phare
    6: "URGENT",      # feu_arriere
    7: "BLOQUANT",    # carrosserie_impact
    8: "BLOQUANT",    # carrosserie_fissure
    9: "BLOQUANT",    # pare_brise_fissure
    12: "URGENT",     # pot_echappement
    13: "URGENT",     # klaxon
}

FINETUNED_CATEGORIE = {
    0: "SECURITE",    # plaque_immatriculation
    1: "CABINE",      # compteur_vitesse
    2: "PNEUS",       # roue
    3: "PNEUS",       # pneu_creve
    4: "FREINS",      # frein
    5: "ECLAIRAGE",   # phare
    6: "ECLAIRAGE",   # feu_arriere
    7: "CARROSSERIE", # carrosserie_impact
    8: "CARROSSERIE", # carrosserie_fissure
    9: "CABINE",      # pare_brise_fissure
    10: "CABINE",     # retroviseur
    11: "CAISSE",     # hayon
    12: "MECANIQUE",  # pot_echappement
    13: "SECURITE",   # klaxon
}

FINETUNED_LABELS = set(FINETUNED_CLASSES.values())

COCO_TO_ELEMENT = {
    0: "", 1: "MECANIQUE", 2: "MECANIQUE", 3: "MECANIQUE", 4: "",
    5: "MECANIQUE", 6: "MECANIQUE", 7: "CAISSE", 8: "",
    9: "ECLAIRAGE", 10: "ECLAIRAGE", 11: "ECLAIRAGE",
    12: "DOCUMENTATION_LEGALE", 13: "CAISSE", 14: "", 15: "", 16: "", 17: "",
    18: "", 19: "", 20: "", 21: "", 22: "", 23: "",
    24: "PAPIER_ACCESSOIRE", 25: "CABINE", 26: "PAPIER_ACCESSOIRE", 27: "PAPIER_ACCESSOIRE",
    28: "CAISSE", 29: "", 30: "", 31: "", 32: "",
    33: "", 34: "", 35: "", 36: "MECANIQUE", 37: "",
    38: "MECANIQUE", 39: "", 40: "CAISSE", 41: "CAISSE",
    42: "MECANIQUE", 43: "MECANIQUE",
    44: "CAISSE", 45: "CAISSE",
    46: "", 47: "", 48: "", 49: "", 50: "",
    51: "", 52: "", 53: "", 54: "", 55: "",
    56: "CABINE", 57: "CABINE", 58: "CABINE", 59: "CABINE",
    60: "CAISSE", 61: "MECANIQUE",
    62: "CABINE", 63: "CABINE", 64: "", 65: "",
    66: "", 67: "PAPIER_ACCESSOIRE",
    68: "MECANIQUE", 69: "MECANIQUE", 70: "MECANIQUE", 71: "",
    72: "FROID", 73: "PAPIER_ACCESSOIRE",
    74: "CABINE", 75: "", 76: "SECURITE",
    77: "",
    78: "", 79: "",
}

COCO_TO_PANNE = {
    0: "", 1: "MECANIQUE", 2: "MECANIQUE", 3: "MECANIQUE", 4: "",
    5: "MECANIQUE", 6: "MECANIQUE", 7: "CAISSE", 8: "",
    9: "ECLAIRAGE", 10: "ECLAIRAGE", 11: "ECLAIRAGE",
    12: "SECURITE", 13: "CAISSE", 14: "", 15: "", 16: "", 17: "",
    18: "", 19: "", 20: "", 21: "", 22: "", 23: "",
    24: "PAPIER_ACCESSOIRE", 25: "CABINE", 26: "PAPIER_ACCESSOIRE", 27: "PAPIER_ACCESSOIRE",
    28: "CAISSE", 29: "", 30: "", 31: "", 32: "",
    33: "", 34: "", 35: "", 36: "MECANIQUE", 37: "",
    38: "MECANIQUE", 39: "", 40: "CAISSE", 41: "CAISSE",
    42: "MECANIQUE", 43: "MECANIQUE",
    44: "CAISSE", 45: "CAISSE",
    46: "", 47: "", 48: "", 49: "", 50: "",
    51: "", 52: "", 53: "", 54: "", 55: "",
    56: "CABINE", 57: "CABINE", 58: "CABINE", 59: "CABINE",
    60: "CAISSE", 61: "MECANIQUE",
    62: "CABINE", 63: "CABINE", 64: "", 65: "",
    66: "", 67: "PAPIER_ACCESSOIRE",
    68: "MECANIQUE", 69: "MECANIQUE", 70: "MECANIQUE", 71: "",
    72: "FROID", 73: "PAPIER_ACCESSOIRE",
    74: "CABINE", 75: "", 76: "SECURITE",
    77: "",
    78: "", 79: "",
}

COCO_TO_CRITICITE = {
    2: "NON_BLOQUANT", 3: "NON_BLOQUANT", 5: "NON_BLOQUANT", 7: "NON_BLOQUANT",
    9: "URGENT", 10: "URGENT", 11: "URGENT", 12: "BLOQUANT",
    15: "BLOQUANT", 16: "BLOQUANT", 17: "BLOQUANT",
    43: "URGENT", 56: "NON_BLOQUANT", 57: "NON_BLOQUANT",
    62: "NON_BLOQUANT", 72: "URGENT",
}

COCO_TO_CATEGORIE = {
    0: "", 1: "MECANIQUE", 2: "MECANIQUE", 3: "MECANIQUE", 4: "",
    5: "MECANIQUE", 6: "MECANIQUE", 7: "CAISSE", 8: "",
    9: "ECLAIRAGE", 10: "ECLAIRAGE", 11: "SECURITE",
    12: "SECURITE", 13: "CAISSE", 14: "", 15: "PNEUS", 16: "PNEUS", 17: "PNEUS",
    18: "SECURITE",
    19: "", 20: "", 21: "", 22: "", 23: "",
    24: "PAPIER_ACCESSOIRE", 25: "CABINE", 26: "PAPIER_ACCESSOIRE", 27: "PAPIER_ACCESSOIRE",
    28: "CAISSE", 29: "", 30: "", 31: "", 32: "",
    33: "", 34: "", 35: "", 36: "MECANIQUE", 37: "",
    38: "MECANIQUE", 39: "", 40: "CAISSE", 41: "CAISSE",
    42: "ELECTRIQUE", 43: "SECURITE",
    44: "CAISSE", 45: "CAISSE",
    46: "", 47: "", 48: "", 49: "", 50: "",
    51: "", 52: "", 53: "", 54: "", 55: "",
    56: "CABINE", 57: "CABINE", 58: "CABINE", 59: "CABINE",
    60: "CAISSE", 61: "",
    62: "FROID", 63: "CABINE", 64: "", 65: "",
    66: "", 67: "PAPIER_ACCESSOIRE",
    68: "MECANIQUE", 69: "MECANIQUE", 70: "MECANIQUE", 71: "",
    72: "ECLAIRAGE", 73: "PAPIER_ACCESSOIRE",
    74: "CABINE", 75: "", 76: "SECURITE",
    77: "FROID", 78: "", 79: "",
}

ELEMENTS_MAP = {
    "cabine": "CABINE", "cabin": "CABINE", "cab": "CABINE",
    "caisse": "CAISSE", "caiss": "CAISSE", "body": "CAISSE",
    "eclairage": "ECLAIRAGE", "lamp": "ECLAIRAGE", "light": "ECLAIRAGE", "headlight": "ECLAIRAGE",
    "froid": "FROID", "cold": "FROID", "refrig": "FROID", "frigo": "FROID",
    "mecanique": "MECANIQUE", "engine": "MECANIQUE", "motor": "MECANIQUE", "moteur": "MECANIQUE",
    "klaxon": "KLAXON", "horn": "KLAXON",
    "plancher": "PLANCHER", "floor": "PLANCHER",
    "hayon": "HAYON", "tailgate": "HAYON", "liftgate": "HAYON",
    "panneau": "PANNEAUX", "panel": "PANNEAUX", "panels": "PANNEAUX",
    "face_avant": "FACE_AVANT", "front": "FACE_AVANT",
    "pont": "PONTS", "axle": "PONTS", "bridge": "PONTS",
    "etancheite": "ETANCHEITE", "seal": "ETANCHEITE", "waterproof": "ETANCHEITE",
    "securite": "SECURITE", "safety": "SECURITE",
    "qualite": "QUALITE", "quality": "QUALITE",
    "visibilite": "VISIBILITE", "visibility": "VISIBILITE",
    "exterieur": "EXTERIEUR", "exterior": "EXTERIEUR", "outside": "EXTERIEUR",
    "roue": "PNEUS", "wheel": "PNEUS", "tire": "PNEUS", "tyre": "PNEUS",
    "pneu": "PNEUS", "tires": "PNEUS",
    "frein": "FREINS", "brake": "FREINS", "brakes": "FREINS",
    "car": "CAISSE", "truck": "CAISSE", "bus": "CAISSE", "vehicle": "CAISSE",
    "motorcycle": "MECANIQUE", "bicycle": "MECANIQUE",
    "traffic light": "ECLAIRAGE", "traffic": "ECLAIRAGE",
    "fire hydrant": "SECURITE", "stop sign": "SECURITE",
    "parking meter": "PAPIER_ACCESSOIRE",
    "headlight": "ECLAIRAGE", "taillight": "ECLAIRAGE", "indicator": "ECLAIRAGE",
    "mirror": "CABINE", "windshield": "CABINE", "window": "CABINE",
    "door": "CABINE", "handle": "POIGNEE_INOX", "bumper": "CAISSE",
    "grille": "CAISSE", "hood": "MECANIQUE", "trunk": "CAISSE",
    "exhaust": "MECANIQUE", "muffler": "MECANIQUE",
    "license plate": "DOCUMENTATION_LEGALE", "plate": "DOCUMENTATION_LEGALE",
    "damage": "CARROSSERIE", "crack": "CARROSSERIE", "dent": "CARROSSERIE",
    "impact": "CARROSSERIE", "fissure": "CARROSSERIE", "break": "CARROSSERIE",
    "scratche": "CARROSSERIE", "scratch": "CARROSSERIE",
    "flat tire": "PNEUS", "flat": "PNEUS", "blown": "PNEUS",
    "speedometer": "CABINE", "dashboard": "CABINE", "odometer": "CABINE",
    "clock": "CABINE", "timer": "CABINE",
    "plaque": "DOCUMENTATION_LEGALE",
}

CATEGORIES_MAP = {
    "MECANIQUE": "MECANIQUE", "engine": "MECANIQUE", "motor": "MECANIQUE",
    "ELECTRIQUE": "ELECTRIQUE", "battery": "ELECTRIQUE", "electrical": "ELECTRIQUE",
    "CAISSE": "CAISSE", "body": "CAISSE",
    "CABINE": "CABINE", "cabin": "CABINE",
    "SECURITE": "SECURITE", "safety": "SECURITE",
}

CRITICITE_KEYWORDS = {
    "bloquant": "BLOQUANT", "critique": "BLOQUANT", "danger": "BLOQUANT",
    "urgence": "BLOQUANT", "accident": "BLOQUANT", "cassee": "BLOQUANT",
    "casse": "BLOQUANT", "perte": "BLOQUANT", "fuite": "BLOQUANT",
    "broken": "BLOQUANT", "damage": "BLOQUANT", "crack": "BLOQUANT",
    "flat": "BLOQUANT", "blown": "BLOQUANT", "impact": "BLOQUANT",
    "pneu_creve": "BLOQUANT", "carrosserie_impact": "BLOQUANT",
    "pare_brise_fissure": "BLOQUANT", "carrosserie_fissure": "BLOQUANT",
    "urgent": "URGENT", "attention": "URGENT", "defaut": "URGENT",
    "deteriore": "URGENT", "deterioree": "URGENT", "usure": "URGENT",
    "wear": "URGENT", "worn": "URGENT", "warning": "URGENT",
    "defective": "URGENT", "malfunction": "URGENT", "degrade": "URGENT",
    "endommage": "URGENT", "endommagee": "URGENT", "defaillance": "URGENT",
    "roue": "URGENT", "phare": "URGENT", "frein": "URGENT",
    "klaxon": "URGENT", "retroviseur": "URGENT", "echappement": "URGENT",
    "feu": "URGENT", "eclairage": "URGENT", "vibrations": "URGENT",
    "bruit": "URGENT", "fumee": "URGENT", "surchauffe": "URGENT",
    "overheat": "URGENT", "leak": "URGENT", "noise": "URGENT",
    "vibration": "URGENT", "smoke": "URGENT",
}

TYPEPANNE_KEYWORDS = {
    "moteur": "MECANIQUE", "engine": "MECANIQUE", "mecanique": "MECANIQUE",
    "electrique": "ELECTRIQUE", "batterie": "ELECTRIQUE", "battery": "ELECTRIQUE",
    "caisse": "CAISSE", "body": "CAISSE",
    "cabine": "CABINE", "cabin": "CABINE",
    "securite": "SECURITE", "safety": "SECURITE",
    "pneu": "PNEUS", "wheel": "PNEUS", "tire": "PNEUS",
    "frein": "FREINS", "brake": "FREINS",
    "froid": "FROID", "refrigeration": "FROID",
    "eclairage": "ECLAIRAGE", "light": "ECLAIRAGE",
}

# Moroccan Arabic letters used in plates
MOROCCAN_ARABIC_LETTERS = {
    'ا': 'A', 'أ': 'A', 'إ': 'A', 'آ': 'A',
    'ب': 'B', 'ت': 'T', 'ث': 'TH',
    'ج': 'J', 'ح': 'H', 'خ': 'KH',
    'د': 'D', 'ذ': 'DH',
    'ر': 'R', 'ز': 'Z',
    'س': 'S', 'ش': 'SH',
    'ص': 'S2', 'ض': 'D2',
    'ط': 'T2', 'ظ': 'Z2',
    'ع': 'AA', 'غ': 'GH',
    'ف': 'F', 'ق': 'Q',
    'ك': 'K', 'ل': 'L',
    'م': 'M', 'ن': 'N',
    'ه': 'H2', 'و': 'W', 'ي': 'Y',
}

# Moroccan OCR confusions for Arabic letters
MOROCCAN_OCR_CONFUSIONS = {
    'D': 'د', 'DC': 'د', 'DI': 'د', 'DL': 'د', 'DCI': 'د',
    'CK': 'د', 'Ck': 'د', 'cK': 'د', 'ck': 'د',
    'OI': 'د', 'O1': 'د', 'D1': 'د', '0D': 'د',
    'أ': 'ا', 'إ': 'ا', 'آ': 'ا',
    'B': 'ب', 'J': 'ج', 'H': 'ح',
    'R': 'ر', 'Z': 'ز', 'S': 'س',
    'F': 'ف', 'Q': 'ق', 'K': 'ك',
    'L': 'ل', 'M': 'م', 'N': 'ن',
    'W': 'و', 'Y': 'ي',
}

# Regex patterns
PLAQUE_REGEX = re.compile(
    r'(?:(?:PLAQUE|PLATE|LICENSE|IMMATRICULATION|IMMAT)[:\s-]*)?'
    r'([A-Z]{2}[- ]?\d{3}[- ]?[A-Z]{2})'
    r'|(\d{2,4}[- ]?[A-Z]{1,3}[- ]?\d{2,3})'
    r'|([A-Z]{1,3}[- ]?\d{2,4}[- ]?[A-Z]{2,3})',
    re.IGNORECASE
)

# Moroccan plate pattern: digits | arabic letter | digits (e.g. 68768|د|6 or 12345 أ 67)
MOROCCAN_PLAQUE_REGEX = re.compile(
    r'(\d{1,5})\s*[|/\-:]\s*([ء-ي])\s*[|/\-:]\s*(\d{1,5})'
    r'|(\d{1,5})\s*[|/\-:]?\s*([ء-ي])\s*[|/\-:]?\s*(\d{1,5})'
    r'|(\d{1,5})\s+([ء-ي]{1,2})\s+(\d{1,5})',
)

KM_REGEX = re.compile(
    r'(?:kilometrage|km|kilometres|kilometres|km|kms|ODO|odometer|odometre)[:\s]*(\d{4,7})'
    r'|(\d{4,7})\s*(?:km|kilometres|kilometres|kms|KM)'
    r'|(\d{2}[ ]?\d{3}[ ]?\d{0,3})\s*(?:km|kms)?',
    re.IGNORECASE
)

STANDALONE_KM_REGEX = re.compile(r'\b(\d{5,6})\b')


def _is_garbage_plate(plate):
    if not plate or len(plate) < 5:
        return True
    i_o_count = sum(1 for c in plate if c in 'IO')
    if i_o_count >= len(plate) * 0.4:
        return True
    letters = sum(1 for c in plate if c.isalpha())
    digits = sum(1 for c in plate if c.isdigit())
    if letters == 0 or digits == 0:
        return True
    for ch in 'IO':
        if ch * 2 in plate:
            return True
    return False


def _valid_plaque(plaque):
    if not plaque or len(plaque) < 4:
        return False
    # Moroccan plates: digits + Arabic letter + digits (e.g. 68768|د|6)
    arabic_chars = [c for c in plaque if '\u0621' <= c <= '\u064a']
    if arabic_chars:
        return True
    lettres = sum(1 for c in plaque if c.isalpha())
    chiffres = sum(1 for c in plaque if c.isdigit())
    total = lettres + chiffres
    if total < 4 or (lettres < 2 and chiffres < 2):
        return False
    if lettres > 8 or chiffres > 6:
        return False
    if total > 12:
        return False
    if _is_garbage_plate(plaque):
        return False
    return True


def _extract_moroccan_plate(text):
    """Extrait une plaque marocaine du format: digits | lettre arabe | digits."""
    # Normalize: uppercase Latin letters, keep Arabic as-is
    normalized = ""
    for ch in text:
        if ch.isalpha() and '\u0041' <= ch <= '\u007a':
            normalized += ch.upper()
        else:
            normalized += ch
    # Apply substitutions longest first to avoid partial matches (DCI before D)
    for latin, arabic in sorted(MOROCCAN_OCR_CONFUSIONS.items(), key=lambda x: -len(x[0])):
        normalized = normalized.replace(latin, arabic)

    m = MOROCCAN_PLAQUE_REGEX.search(normalized)
    if m:
        groups = [g for g in m.groups() if g is not None]
        if len(groups) >= 3:
            left, arabic_letter, right = groups[0], groups[1], groups[2]
            if left.isdigit() and right.isdigit():
                return f"{left}|{arabic_letter}|{right}"

    # Also try pattern: arabic_letter followed by digits (OCR reads right-to-left or mixed)
    # Pattern: [arabic] [short_number] [long_number] -> short|arabic|long
    arabic_digit_pattern = re.compile(
        r'([ء-ي]{1,2})\s+(\d{1,5})\s+(\d{1,5})'
    )
    m2 = arabic_digit_pattern.search(normalized)
    if m2:
        arabic_letter = m2.group(1)
        num1 = m2.group(2)
        num2 = m2.group(3)
        # Prefer shorter number on left: format = short|arabic|long
        if len(num1) <= len(num2):
            return f"{num1}|{arabic_letter}|{num2}"
        else:
            return f"{num2}|{arabic_letter}|{num1}"

    # Try fragment combination for OCR that reads plate parts separately
    fragments = re.findall(r'\d{1,5}|[a-zA-Z]{1,3}|[\u0621-\u064a]{1,2}', text)
    if len(fragments) >= 2:
        for i in range(len(fragments)):
            frag = fragments[i]
            frag_upper = frag.upper()
            arabic_frag = frag_upper
            for l, a in sorted(MOROCCAN_OCR_CONFUSIONS.items(), key=lambda x: -len(x[0])):
                arabic_frag = arabic_frag.replace(l, a)
            has_arabic = any('\u0621' <= c <= '\u064a' for c in arabic_frag)
            if has_arabic or frag.isdigit():
                for j in range(len(fragments)):
                    if j == i:
                        continue
                    if i < j:
                        combo = f"{frag}|{arabic_frag}|{fragments[j]}"
                    else:
                        combo = f"{fragments[j]}|{arabic_frag}|{frag}"
                    m3 = MOROCCAN_PLAQUE_REGEX.search(combo)
                    if m3:
                        groups2 = [g for g in m3.groups() if g is not None]
                        if len(groups2) >= 3 and groups2[0].isdigit() and groups2[2].isdigit():
                            return f"{groups2[0]}|{groups2[1]}|{groups2[2]}"
    return ""

# Garbled word mapping for AI-generated/poor quality video
# Format: garbled_OCR_text -> intended_plate_word
GARBLED_WORDS = {
    # UPE variants (letter confusions from AI video rendering)
    'GAURE': 'UPE', 'GAIRE': 'UPE', 'GURE': 'UPE', 'QURE': 'UPE',
    'QIPE': 'UPE', 'QPE': 'UPE', 'GIPE': 'UPE', 'GUPE': 'UPE',
    'AUPE': 'UPE', 'AIPE': 'UPE', 'AURE': 'UPE', 'AURPE': 'UPE',
    'GAUPE': 'UPE', 'GAIP3': 'UPE', 'OUPE': 'UPE', 'CUPE': 'UPE',
    'QUPE': 'UPE', 'G@URE': 'UPE', 'G@IPE': 'UPE', 'G@UPE': 'UPE',
    '@UPE': 'UPE', '@URE': 'UPE', 'Q@IPE': 'UPE', 'Q@UPE': 'UPE',
    '@UPe': 'UPE', 'GAIPE': 'UPE', 'G41PE': 'UPE', 'G41RE': 'UPE',
    'Q41PE': 'UPE', 'Q41RE': 'UPE', 'M41PE': 'UPE',
    # UPE as single letter with separators
    'OP3': 'UPE', '0PE': 'UPE',
    # CV16D variants
    'CYVIEN': 'CV16D', 'CVIEN': 'CV16D', 'CVIENI': 'CV16D',
    'CYIEN': 'CV16D', 'CVIEM': 'CV16D', 'CVICNS': 'CV16D',
    'CVIENS': 'CV16D', 'CYVIENS': 'CV16D', 'RYIEN': 'CV16D',
    'RVIEN': 'CV16D', 'RVIEM': 'CV16D', 'RVIENI': 'CV16D',
    'RYVIEN': 'CV16D', 'RYVI3NT': 'CV16D', 'RV13NT': 'CV16D',
    'RYV13NT': 'CV16D', 'RYIEM': 'CV16D', 'TV1EN': 'CV16D',
    'TVIEN': 'CV16D', 'TV13N': 'CV16D', 'TV13NS': 'CV16D',
    'TV1ENS': 'CV16D', 'RYIENT': 'CV16D', 'RVV13NT': 'CV16D',
    'CVI3N': 'CV16D', 'RV1EN': 'CV16D', 'CV1EN': 'CV16D',
    'CY1EN': 'CV16D', 'RV13N': 'CV16D', 'CVI3NS': 'CV16D',
    'CVI3NT': 'CV16D', 'CV1E': 'CV16D', 'CV6D': 'CV16D',
    'RY13NT': 'CV16D', 'RV1E': 'CV16D',
    'LVI6D': 'CV16D', 'LVIEN': 'CV16D', 'LVI3N': 'CV16D',
}

def _garbled_to_plate(text):
    cleaned = _clean_ocr_text(text)
    cleaned = cleaned.replace('-', ' ').replace('/', ' ').replace(',', ' ').replace("'", ' ')
    parts = cleaned.split()
    words = []
    for p in parts:
        p = p.strip('|.,;:!?-+=/\\ ')
        if p in GARBLED_WORDS:
            words.append(GARBLED_WORDS[p])
        elif re.match(r'^[A-Z0-9]{5,}$', p):
            # Doit matcher un PATTERN de plaque (pas juste lettres+chiffres)
            for pat in PLATE_PATTERNS:
                if pat.fullmatch(p):
                    if _valid_plaque(p):
                        words.append(p)
                    break
    result = ' '.join(words)
    if result:
        return result

    # Substring matching: OCR peut concatener les mots (g@urecyvien)
    clean_no_space = cleaned.replace(' ', '').upper()
    found = []
    for garbled_word, plate_word in sorted(GARBLED_WORDS.items(), key=lambda x: -len(x[0])):
        if garbled_word in clean_no_space:
            found.append(plate_word)
            clean_no_space = clean_no_space.replace(garbled_word, '', 1)
    return ' '.join(dict.fromkeys(found)) if found else ""

# OCR character confusion mapping for damaged text (symbols/accents only)
# Digit→letter mapping removed: it destroys actual digits in plates.
# Use LETTER_AS_DIGIT (letter→digit) for plate fuzzy matching instead.
OCR_FIX = {
    '@': 'A', '#': 'H', '$': 'S', '%': 'E', '&': 'E',
    'é': 'E', 'è': 'E', 'ê': 'E', 'ë': 'E',
    'à': 'A', 'â': 'A', 'ä': 'A',
    'ù': 'U', 'û': 'U', 'ü': 'U',
    'ç': 'C', 'î': 'I', 'ï': 'I', 'ô': 'O',
    '[': 'L', ']': 'L', '{': 'L', '}': 'L',
    '(': 'C', ')': 'C', '<': 'C', '>': 'C',
    '\\': '/', '|': 'I', '!': 'I', '?': '?',
}

# Reverse mapping: letters that OCR might read as digits in plates
LETTER_AS_DIGIT = {
    'O': '0', 'I': '1', 'Z': '2', 'E': '3', 'A': '4', 'S': '5', 'G': '6',
    'T': '7', 'B': '8', 'D': '0',
}

# Known plate format patterns (after OCR cleanup)
# FR: AA-123-BB, MA: 1234-AZ-56 or 1-AB-234, generic: letters+digits+letters
PLATE_PATTERNS = [
    re.compile(r'(\d{1,5})\s*[|/\-:]\s*([ء-ي]{1,2})\s*[|/\-:]\s*(\d{1,5})'),  # Moroccan: 68768|د|6
    re.compile(r'([A-Z]{2})(\d{3})([A-Z]{2})'),       # AA123BB
    re.compile(r'(\d{2,4})([A-Z]{1,3})(\d{2,3})'),     # 1234AZ56 / 12AB345
    re.compile(r'([A-Z]{1,3})(\d{2,4})([A-Z]{2,3})'),   # AB123CD / A123BC
    re.compile(r'([A-Z]{3})(\d{3})([A-Z]{1})'),          # ABC123D
    re.compile(r'(\d{3})([A-Z]{2})(\d{3})'),             # 123AZ456
]


def _clean_ocr_text(text):
    """Nettoie le texte OCR en corrigeant les erreurs de reconnaissance courantes. Garde les lettres arabes."""
    result = []
    for ch in text:
        # Keep Arabic letters for Moroccan plates
        if '\u0621' <= ch <= '\u064a':
            result.append(ch)
        elif ch in OCR_FIX:
            result.append(OCR_FIX[ch])
        elif ch.isalnum() or ch in ' -./_|':
            result.append(ch)
        elif ch in '|│':
            result.append('|')
        else:
            result.append(' ')
    cleaned = ''.join(result)
    # Supprimer les caracteres isoles (sauf chiffres et lettres arabes)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()



def _fuzzy_extract_plaque(text):
    """Extrait une plaque par OCR correction + pattern matching + consensus."""
    cleaned = _clean_ocr_text(text)

    # 1. Nettoyage: enlever les separateurs, unifier
    normalized = cleaned.replace('.', ' ').replace('-', ' ').replace('_', ' ').replace('/', ' ')

    # Supprimer les espaces entre lettres/chiffres pour les sequences plaque
    normalized = re.sub(r'(?<=[A-Z0-9]) +(?=[A-Z0-9])', '', normalized)

    # 2. Pattern matching strict (avec chiffres lisibles)
    for pattern in PLATE_PATTERNS:
        m = pattern.search(normalized)
        if m:
            plate = ''.join(m.groups())
            if _valid_plaque(plate) and not _is_garbage_plate(plate):
                return plate

    # 3. Avec substitutions lettres←→chiffres sur sequences alphanum
    for pattern in PLATE_PATTERNS:
        m = pattern.search(normalized)
        if m:
            parts = list(m.groups())
            candidates = [''.join(parts)]
            for idx, part in enumerate(parts):
                for letter, digit in LETTER_AS_DIGIT.items():
                    if letter in part:
                        alt = list(parts)
                        alt[idx] = part.replace(letter, digit)
                        candidates.append(''.join(alt))
            for c in candidates:
                if _valid_plaque(c):
                    return c

    # 4. Substitution sur TOUS les blocs de 5+ chars qui ont DEJA des chiffres
    all_blocks = re.findall(r'[A-Z]{5,}', normalized)
    for block in all_blocks:
        # Ne pas substituer sur des blocs 100% lettres (faux positifs)
        if not any(c.isdigit() for c in block):
            continue
        for pattern in PLATE_PATTERNS:
            # Essayer avec substitutions I->1, E->3/6, G->6, S->5, O->0, Z->2, etc.
            variants = [block]
            # Substituer chaque lettre par chiffre possible
            for src, dst in LETTER_AS_DIGIT.items():
                new_variants = []
                for v in variants:
                    for pos, ch in enumerate(v):
                        if ch == src:
                            new_variants.append(v[:pos] + dst + v[pos+1:])
                variants.extend(new_variants)
            # Deduplicate
            variants = list(set(variants))
            for v in variants:
                m = pattern.search(v)
                if m:
                    plate = ''.join(m.groups())
                    if _valid_plaque(plate):
                        return plate

    # 5. Fallback: sequences avec points
    for fb in re.findall(r'[A-Z0-9.]{5,12}', normalized):
        cleaned_fb = fb.replace('.', '')
        if _valid_plaque(cleaned_fb):
            for pat in PLATE_PATTERNS:
                if pat.fullmatch(cleaned_fb):
                    return cleaned_fb

    # 6. Fallback large
    for fb in re.findall(r'[A-Z0-9]{4,}', normalized):
        if _valid_plaque(fb):
            for pat in PLATE_PATTERNS:
                if pat.fullmatch(fb):
                    return fb

    return ""


def _consensus_plaque(texts):
    """Vote consensus sur plusieurs variantes OCR + fallback garbled."""
    candidates = []
    for t in texts:
        p = _fuzzy_extract_plaque(t)
        if p:
            candidates.append(p)
    best_normal = ("", 0)
    if candidates:
        votes = {}
        for c in candidates:
            votes[c] = votes.get(c, 0) + 1
        for plate, count in votes.items():
            score = count * (len(plate) * 2)
            if score > best_normal[1]:
                best_normal = (plate, score)

    garbled = []
    for t in texts:
        g = _garbled_to_plate(t)
        if g:
            garbled.append(g)
    best_garbled = ("", 0)
    if garbled:
        votes = {}
        for g in garbled:
            votes[g] = votes.get(g, 0) + 1
        for plate, count in votes.items():
            words = plate.count(' ') + 1
            score = count * (len(plate) * 2 + words * 10)
            if score > best_garbled[1]:
                best_garbled = (plate, score)

    if not best_normal[0] and not best_garbled[0]:
        return ""
    if not best_normal[0]:
        return best_garbled[0]
    if not best_garbled[0]:
        return best_normal[0]
    return best_garbled[0] if best_garbled[1] > best_normal[1] else best_normal[0]


def _classify_text(text):
    element, categorie, type_panne, criticite = "CAISSE", "MECANIQUE", "MECANIQUE", "NON_BLOQUANT"
    t = text.lower()

    for kw, val in CRITICITE_KEYWORDS.items():
        if kw in t:
            criticite = val
            break
    for kw, val in CATEGORIES_MAP.items():
        if kw in t:
            categorie = val
            break
    for kw, val in ELEMENTS_MAP.items():
        if kw in t:
            element = val
            break
    for kw, val in TYPEPANNE_KEYWORDS.items():
        if kw in t:
            type_panne = val
            break

    return element, categorie, type_panne, criticite


def _ocr_with_easyocr(frame, region=None):
    reader = _get_easyocr_reader()
    if reader is None:
        return []
    try:
        if region:
            x1, y1, x2, y2 = region
            cropped = frame[y1:y2, x1:x2]
            if cropped.size == 0:
                return []
        else:
            cropped = frame
        results = reader.readtext(cropped)
        return [(text, conf) for bbox, text, conf in results]
    except Exception:
        return []


def _run_all_ocr(frame, targeted=False):
    texts = []
    seen_texts = set()

    if TESSERACT_AVAILABLE:
        # Fast pass: single PSM call with cascaded PSMs inside _ocr_fast
        for t in _ocr_fast(frame, psm=6):
            cleaned = _clean_ocr_text(t)
            if cleaned and cleaned.lower() not in seen_texts:
                seen_texts.add(cleaned.lower())
                texts.append({"text": cleaned, "source": "tesseract", "confidence": 0.4})

        # Aggressive pass: only on targeted regions (costly)
        if targeted:
            for t in _ocr_aggressive(frame):
                cleaned = _clean_ocr_text(t)
                if cleaned and cleaned.lower() not in seen_texts:
                    seen_texts.add(cleaned.lower())
                    texts.append({"text": cleaned, "source": "tesseract_aggressive", "confidence": 0.5})

    if EASYOCR_AVAILABLE and targeted:
        easy_results = _ocr_with_easyocr(frame)
        for text, conf in easy_results:
            cleaned = _clean_ocr_text(text)
            if cleaned and cleaned.lower() not in seen_texts:
                seen_texts.add(cleaned.lower())
                texts.append({"text": cleaned, "source": "easyocr", "confidence": conf})

    return texts


def _extract_texts_from_ocr(all_ocr_results):
    all_texts = []
    all_plate_candidates_weighted = []
    all_km_values = []

    for ocr_list in all_ocr_results:
        plate_items = [item for item in ocr_list if "full" not in item.get("source", "")]
        all_items = ocr_list
        
        plate_texts = [item["text"] for item in plate_items]
        all_texts.extend([item["text"] for item in all_items])

        for item in plate_items:
            text = item["text"]
            source = item.get("source", "")
            conf = item.get("confidence", 0.5)
            weight = 1.0
            if "plate" in source or "dash" in source:
                weight = 3.0
            if "easyocr" in source:
                weight *= (0.5 + conf)

            plate = _extract_plaque(text)
            if plate:
                for _ in range(int(max(1, weight * 5))):
                    all_plate_candidates_weighted.append(plate)

        # KM detection from ALL sources (including full-frame)
        for item in all_items:
            km = _extract_kilometrage(item["text"])
            if km:
                all_km_values.append(km)

        combined = "".join(plate_texts)
        plate = _extract_plaque(combined)
        if plate:
            all_plate_candidates_weighted.append(plate)

        spaced = " ".join(plate_texts)
        plate = _extract_plaque(spaced)
        if plate:
            all_plate_candidates_weighted.append(plate)

    plate_found = ""
    if all_plate_candidates_weighted:
        votes = {}
        for p in all_plate_candidates_weighted:
            votes[p] = votes.get(p, 0) + 1
        # Pick the most voted plate but filter watermark garbage
        sorted_plates = sorted(votes.items(), key=lambda x: -x[1])
        for plate, count in sorted_plates:
            if not _is_garbage_plate(plate):
                plate_found = plate
                break
        if not plate_found and sorted_plates:
            candidate = sorted_plates[0][0]
            if not _is_garbage_plate(candidate):
                plate_found = candidate

    km_found = 0
    if all_km_values:
        votes = {}
        for k in all_km_values:
            votes[k] = votes.get(k, 0) + 1
        km_found = max(votes, key=votes.get)

    # Moroccan plate detection from OCR texts - try individual and combined
    moroccan_plate = ""
    for ocr_list in all_ocr_results:
        combined_text = " ".join(item.get("text", "") for item in ocr_list)
        mp = _extract_moroccan_plate(combined_text)
        if mp:
            moroccan_plate = mp
            break
        for item in ocr_list:
            mp = _extract_moroccan_plate(item.get("text", ""))
            if mp:
                moroccan_plate = mp
                break
        if moroccan_plate:
            break

    if not moroccan_plate:
        all_ocr_combined = " ".join(all_texts)
        moroccan_plate = _extract_moroccan_plate(all_ocr_combined)

    # Try assembling Moroccan plate from number+letter fragments found by OCR
    if not moroccan_plate and all_texts:
        number_frags = []
        arabic_frags = []
        latin_letter_frags = []
        for t in all_texts:
            c = _clean_ocr_text(t)
            if c.isdigit() and 4 <= len(c) <= 6:
                number_frags.append(c)
            elif c.isdigit() and 1 <= len(c) <= 3:
                number_frags.append(c)
            elif any('\u0621' <= ch <= '\u064a' for ch in c):
                arabic_frags.append(c)
            elif len(c) <= 3 and c.isalpha():
                latin_letter_frags.append(c)
        for arabic in arabic_frags:
            for n1 in number_frags:
                for n2 in number_frags:
                    if n1 != n2:
                        candidate = f"{n1}|{arabic}|{n2}"
                        moroccan_plate = candidate
                        break
                if moroccan_plate:
                    break
            if moroccan_plate:
                break
        if not moroccan_plate and latin_letter_frags:
            for latin in latin_letter_frags:
                arabic_conv = latin
                for l, a in MOROCCAN_OCR_CONFUSIONS.items():
                    arabic_conv = arabic_conv.replace(l, a)
                if any('\u0621' <= ch <= '\u064a' for ch in arabic_conv):
                    for n1 in number_frags:
                        for n2 in number_frags:
                            if n1 != n2:
                                moroccan_plate = f"{n1}|{arabic_conv}|{n2}"
                                break
                        if moroccan_plate:
                            break
                if moroccan_plate:
                    break

    # Final Moroccan fallback: if OCR found short number + DCI/D/latin-like-resembling-arabic + long number
    # Pattern: GCN sees "6 DCI 68768" or "68768 د 6" or similar
    if not moroccan_plate and not plate_found and all_texts:
        short_nums = []
        long_nums = []
        letter_frags = []
        for t in all_texts:
            c = _clean_ocr_text(t)
            if c.isdigit():
                if len(c) <= 3:
                    short_nums.append(c)
                elif len(c) >= 4:
                    long_nums.append(c)
            elif len(c) <= 4 and c.isalpha():
                letter_frags.append(c)
        for lf in letter_frags:
            arabic_lf = lf
            for l, a in sorted(MOROCCAN_OCR_CONFUSIONS.items(), key=lambda x: -len(x[0])):
                arabic_lf = arabic_lf.replace(l, a)
            if any('\u0621' <= ch <= '\u064a' for ch in arabic_lf):
                # Try: long_num | arabic | short_num  AND  short_num | arabic | long_num
                for ln in long_nums:
                    for sn in short_nums:
                        for combo in [f"{ln}|{arabic_lf}|{sn}", f"{sn}|{arabic_lf}|{ln}"]:
                            moroccan_plate = combo
                            break
                    if moroccan_plate:
                        break
                if moroccan_plate:
                    break

    if moroccan_plate and not plate_found:
        plate_found = moroccan_plate

    # Build all_texts from plate/dash only for consensus fallback
    plate_all_texts = []
    for ocr_list in all_ocr_results:
        for item in ocr_list:
            if "full" not in item.get("source", ""):
                plate_all_texts.append(item["text"])

    # Cross-list combination: join ALL plate fragments from ALL sources
    all_plate_fragments = []
    for item in plate_all_texts:
        fragment = item.strip()
        if fragment and 2 <= len(fragment) <= 12:
            all_plate_fragments.append(fragment)

    if all_plate_fragments and not plate_found:
        # Try simple joins: all fragments concatenated, spaced, dashed
        combos = [
            "".join(all_plate_fragments),
            " ".join(all_plate_fragments),
            "-".join(all_plate_fragments),
        ]
        # Also try pairs of fragments
        for i in range(len(all_plate_fragments)):
            for j in range(len(all_plate_fragments)):
                if i != j:
                    combos.append(all_plate_fragments[i] + all_plate_fragments[j])
                    combos.append(all_plate_fragments[i] + "-" + all_plate_fragments[j])
                    combos.append(all_plate_fragments[i] + " " + all_plate_fragments[j])
        for combined in combos:
            plate = _fuzzy_extract_plaque(combined)
            if plate and not _is_garbage_plate(plate):
                all_plate_candidates_weighted.append(plate)

    # Retry voting with cross-list candidates
    if all_plate_candidates_weighted and not plate_found:
        votes = {}
        for p in all_plate_candidates_weighted:
            votes[p] = votes.get(p, 0) + 1
        sorted_plates = sorted(votes.items(), key=lambda x: -x[1])
        for plate, count in sorted_plates:
            if not _is_garbage_plate(plate):
                plate_found = plate
                break

    if not plate_found:
        plate_found = _consensus_plaque(plate_all_texts)
        if plate_found and _is_garbage_plate(plate_found):
            plate_found = ""

    return plate_found, km_found, all_texts


def _classify_from_coco(detections, img=None):
    """Classifie element/categorie/typePanne/criticite depuis les detections YOLO (COCO ou fine-tune).
    Si seul car/truck detecte, utilise l'analyse visuelle heuristique."""
    elements = []
    categories = []
    type_pannes = []
    criticites = []
    details = []

    CRITICITE_ORDER = {"BLOQUANT": 3, "URGENT": 2, "NON_BLOQUANT": 1}

    for det in detections:
        cls_id = det.get("cls_id", -1)
        conf = det.get("confidence", 0)
        label = det.get("label", "").lower()

        is_finetuned = label in FINETUNED_LABELS or label.replace(" ", "_") in FINETUNED_LABELS

        elem = ""
        panne = ""
        cat = ""
        crit = ""
        detail = label.replace("_", " ")

        if is_finetuned:
            elem = FINETUNED_TO_ELEMENT.get(cls_id, "")
            panne = FINETUNED_TO_PANNE.get(cls_id, "")
            cat = FINETUNED_CATEGORIE.get(cls_id, "")
            crit = FINETUNED_CRITICITE.get(cls_id, "")
        else:
            elem = COCO_TO_ELEMENT.get(cls_id, "") or ELEMENTS_MAP.get(label, "")
            panne = COCO_TO_PANNE.get(cls_id, "")
            cat = COCO_TO_CATEGORIE.get(cls_id, "")
            crit = COCO_TO_CRITICITE.get(cls_id, "")

        if not elem:
            elem = ELEMENTS_MAP.get(label, "")
        if not panne:
            for kw, val in TYPEPANNE_KEYWORDS.items():
                if kw in label:
                    panne = val
                    break
        if not cat:
            for kw, val in CATEGORIES_MAP.items():
                if kw in label:
                    cat = val
                    break
        if not crit:
            for kw, val in CRITICITE_KEYWORDS.items():
                if kw in label:
                    crit = val
                    break

        if elem:
            elements.append((elem, conf))
        if panne:
            type_pannes.append((panne, conf))
        if cat:
            categories.append((cat, conf))
        if crit:
            criticites.append((crit, conf))
        if detail:
            details.append((detail, conf))

    def best(annotated_list):
        if not annotated_list:
            return ""
        counts = {}
        conf_sums = {}
        for item, conf in annotated_list:
            counts[item] = counts.get(item, 0) + 1
            conf_sums[item] = conf_sums.get(item, 0) + conf
        scored = [(item, counts[item] * (conf_sums[item] / counts[item])) for item in counts]
        scored.sort(key=lambda x: -x[1])
        return scored[0][0] if scored else ""

    def best_criticite(criticite_list):
        if not criticite_list:
            return "NON_BLOQUANT"
        weighted = {}
        for crit, conf in criticite_list:
            weight = CRITICITE_ORDER.get(crit, 1)
            weighted[crit] = weighted.get(crit, 0) + weight * conf
        return max(weighted, key=weighted.get)

    best_cat = best(categories) or best(type_pannes) or "CARROSSERIE"
    best_crit = best_criticite(criticites) if criticites else "NON_BLOQUANT"

    result_element = best(elements) or "CARROSSERIE"
    result_categorie = best_cat
    result_typePanne = best(type_pannes) or "CARROSSERIE"
    result_criticite = best_crit
    result_detail = best(details) or ""

    # Si seul car/truck/vehicle ou objets non-vehicules detectes, essayer l'analyse visuelle heuristique
    NON_VEHICLE_LABELS = {"car", "truck", "bus", "vehicle", "person", "unknown", "",
                          "keyboard", "mouse", "laptop", "tv", "remote", "cell phone",
                          "book", "vase", "scissors", "teddy bear", "hair drier", "toothbrush",
                          "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl",
                          "banana", "apple", "sandwich", "orange", "broccoli", "carrot",
                          "hot dog", "pizza", "donut", "cake", "chair", "couch", "bed",
                          "dining table", "toilet", "potted plant", "microwave", "oven",
                          "toaster", "sink", "refrigerator", "backpack", "umbrella", "handbag", "tie",
                          "suitcase", "bird", "cat", "dog", "horse", "sheep", "cow", "elephant",
                          "bear", "zebra", "giraffe", "frisbee", "skis", "snowboard", "sports ball",
                          "kite", "baseball bat", "baseball glove", "skateboard", "surfboard",
                          "tennis racket", "bench"}
    labels_lower = [d.get("label", "").lower() for d in detections]
    labels_lower_set = set(labels_lower)
    generic_only = labels_lower_set.issubset(NON_VEHICLE_LABELS)
    if generic_only and img is not None:
        visual = _classify_from_visual(img, detections)
        if visual:
            result_element = visual["element"]
            result_categorie = visual["categorie"]
            result_typePanne = visual["typePanne"]
            result_detail = visual["detailElement"]
            if visual["criticite"] != "NON_BLOQUANT":
                result_criticite = visual["criticite"]
        else:
            # No visual signature found and only non-vehicle objects detected
            # Use CARROSSERIE as default (most common vehicle issue)
            result_element = "CARROSSERIE"
            result_categorie = "CARROSSERIE"
            result_typePanne = "CARROSSERIE"
            result_detail = "carrosserie"

    return {
        "element": result_element,
        "categorie": result_categorie,
        "typePanne": result_typePanne,
        "criticite": result_criticite,
        "detailElement": result_detail,
    }


def _classify_from_visual(img, detections):
    """Analyse visuelle heuristique quand YOLO ne detecte que des vehicules generiques.
    Utilise la couleur, les contours et les regions pour deviner le type de panne."""
    if img is None:
        return None
    h, w = img.shape[:2]
    labels_lower = [d.get("label", "").lower() for d in detections]
    has_specific = any(l for l in labels_lower if l not in ("car", "truck", "bus", "vehicle", "person", "unknown", ""))
    if has_specific:
        return None

    hints = {"PNEUS": 0, "ECLAIRAGE": 0, "CARROSSERIE": 0, "CABINE": 0, "FREINS": 0, "MECANIQUE": 0}
    total_score = 0

    # 1. Dark circular regions at bottom = tires/wheels
    bottom_half = img[int(h * 0.55):h, :]
    if bottom_half.size > 0:
        gray_bottom = cv2.cvtColor(bottom_half, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray_bottom, (5, 5), 0)
        circles = cv2.HoughCircles(blurred, cv2.HOUGH_GRADIENT, 1, 20,
                                    param1=50, param2=30, minRadius=15, maxRadius=80)
        if circles is not None:
            n_circles = min(len(circles[0]), 6)
            if n_circles >= 2:
                hints["PNEUS"] += n_circles * 5
                total_score += n_circles * 5
            elif n_circles == 1:
                hints["PNEUS"] += 3
                total_score += 3

    # 2. Color analysis for vehicle parts
    hsv_full = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # 2a. Bright white/yellow spots = headlights
    upper_quarter = img[:int(h * 0.35), :]
    if upper_quarter.size > 0:
        hsv_upper = cv2.cvtColor(upper_quarter, cv2.COLOR_BGR2HSV)
        bright_mask = cv2.inRange(hsv_upper, (0, 0, 200), (180, 80, 255))
        bright_ratio = cv2.countNonZero(bright_mask) / max(upper_quarter.size // 3, 1)
        if bright_ratio > 0.05:
            hints["ECLAIRAGE"] += int(bright_ratio * 200)
            total_score += int(bright_ratio * 200)
        # Red/orange = taillights/brake lights
        red_mask1 = cv2.inRange(hsv_upper, (0, 100, 100), (10, 255, 255))
        red_mask2 = cv2.inRange(hsv_upper, (170, 100, 100), (180, 255, 255))
        red_ratio = (cv2.countNonZero(red_mask1) + cv2.countNonZero(red_mask2)) / max(upper_quarter.size // 3, 1)
        if red_ratio > 0.02:
            hints["ECLAIRAGE"] += int(red_ratio * 200)
            hints["FREINS"] += int(red_ratio * 100)
            total_score += int(red_ratio * 200)

    # 2b. Green/silver/blue dominant = body/carrosserie
    body_mask = cv2.inRange(hsv_full, (35, 30, 50), (85, 255, 255))
    silver_mask = cv2.inRange(hsv_full, (0, 0, 100), (180, 50, 220))
    blue_mask = cv2.inRange(hsv_full, (100, 50, 50), (130, 255, 255))
    red_body_mask = cv2.inRange(hsv_full, (0, 100, 50), (10, 255, 255))
    red_body2 = cv2.inRange(hsv_full, (170, 100, 50), (180, 255, 255))
    white_mask = cv2.inRange(hsv_full, (0, 0, 180), (180, 30, 255))
    body_total = cv2.countNonZero(body_mask) + cv2.countNonZero(silver_mask) + cv2.countNonZero(blue_mask) + cv2.countNonZero(red_body_mask) + cv2.countNonZero(red_body2) + cv2.countNonZero(white_mask)
    body_ratio = body_total / max(img.size // 3, 1)
    if body_ratio > 0.3:
        hints["CARROSSERIE"] += int(body_ratio * 40)
        total_score += int(body_ratio * 40)

    # 2c. Very dark regions (black) at bottom center = tires/undercarriage
    bottom_center = img[int(h * 0.65):h, int(w * 0.2):int(w * 0.8)]
    if bottom_center.size > 0:
        hsv_bc = cv2.cvtColor(bottom_center, cv2.COLOR_BGR2HSV)
        dark_mask = cv2.inRange(hsv_bc, (0, 0, 0), (180, 255, 50))
        dark_ratio = cv2.countNonZero(dark_mask) / max(bottom_center.size // 3, 1)
        if dark_ratio > 0.15:
            hints["PNEUS"] += int(dark_ratio * 30)
            total_score += int(dark_ratio * 30)

    # 3. Windshield area check (large glass = blue/green tinted transparent area in upper half)
    windshield_region = img[int(h * 0.1):int(h * 0.45), int(w * 0.15):int(w * 0.85)]
    if windshield_region.size > 0:
        hsv_ws = cv2.cvtColor(windshield_region, cv2.COLOR_BGR2HSV)
        glass_mask = cv2.inRange(hsv_ws, (80, 20, 80), (140, 80, 200))
        glass_ratio = cv2.countNonZero(glass_mask) / max(windshield_region.size // 3, 1)
        if glass_ratio > 0.2:
            hints["CABINE"] += int(glass_ratio * 60)
            total_score += int(glass_ratio * 60)
        # Check for cracks: lines in windshield region
        gray_ws = cv2.cvtColor(windshield_region, cv2.COLOR_BGR2GRAY)
        edges_ws = cv2.Canny(gray_ws, 50, 150)
        lines_ws = cv2.HoughLinesP(edges_ws, 1, 3.14 / 180, threshold=40, minLineLength=40, maxLineGap=8)
        if lines_ws is not None:
            long_diagonal = [l for l in lines_ws if abs(l[0][3] - l[0][1]) > 25 and abs(l[0][2] - l[0][0]) > 25]
            if len(long_diagonal) >= 3:
                hints["CABINE"] += len(long_diagonal) * 4
                total_score += len(long_diagonal) * 4

    # 4. Default: moderate huelvariety = typical car = CARROSSERIE
    mean_hue = hsv_full[:, :, 0].mean()
    mean_sat = hsv_full[:, :, 1].mean()
    if mean_sat > 40 and total_score < 10:
        hints["CARROSSERIE"] += 5
        total_score += 5

    if total_score == 0:
        return None

    best_hint = max(hints, key=hints.get)
    best_score = hints[best_hint]
    if best_score < 5:
        return None

    ELEMENT_MAP = {
        "PNEUS": "PNEUS", "ECLAIRAGE": "ECLAIRAGE", "CARROSSERIE": "CARROSSERIE",
        "CABINE": "CABINE", "FREINS": "FREINS", "SECURITE": "SECURITE",
        "MECANIQUE": "MECANIQUE",
    }
    PANNE_MAP = {
        "PNEUS": "PNEUS", "ECLAIRAGE": "ECLAIRAGE", "CARROSSERIE": "CARROSSERIE",
        "CABINE": "CABINE", "FREINS": "FREINS", "SECURITE": "SECURITE",
        "MECANIQUE": "MECANIQUE",
    }
    CRIT_MAP = {
        "PNEUS": "NON_BLOQUANT", "ECLAIRAGE": "URGENT", "CARROSSERIE": "NON_BLOQUANT",
        "CABINE": "NON_BLOQUANT", "FREINS": "URGENT", "SECURITE": "URGENT",
        "MECANIQUE": "NON_BLOQUANT",
    }
    DETAIL_MAP = {
        "PNEUS": "roue_pneu", "ECLAIRAGE": "phare_feu", "CARROSSERIE": "carrosserie",
        "CABINE": "pare_brise_cabine", "FREINS": "frein_plaquette",
        "SECURITE": "securite", "MECANIQUE": "moteur_mecanique",
    }
    confidence = min(best_score / 15, 0.75)

    return {
        "element": ELEMENT_MAP.get(best_hint, "CAISSE"),
        "categorie": PANNE_MAP.get(best_hint, "MECANIQUE"),
        "typePanne": PANNE_MAP.get(best_hint, "MECANIQUE"),
        "criticite": CRIT_MAP.get(best_hint, "NON_BLOQUANT"),
        "detailElement": DETAIL_MAP.get(best_hint, best_hint.lower()),
        "confidence": confidence,
    }


def _ocr_frame_region(frame, x1=0, y1=0, x2=None, y2=None):
    """OCR rapide avec preprocessing optimise (6 methodes selectionnees)."""
    if not TESSERACT_AVAILABLE:
        return []
    h, w = frame.shape[:2]
    x2 = x2 or w
    y2 = y2 or h
    region = frame[y1:y2, x1:x2]
    if region.size == 0:
        return []

    texts = []
    try:
        gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)

        # Methodes rapides et efficaces (6 meilleures)
        methods = []
        # 1. Binary 150
        _, b1 = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
        methods.append(b1)
        # 2. Binary 127
        _, b2 = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
        methods.append(b2)
        # 3. Upscale 2x + binary 127
        scaled = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        _, b3 = cv2.threshold(scaled, 127, 255, cv2.THRESH_BINARY)
        methods.append(b3)
        # 4. CLAHE + Otsu
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        _, b4 = cv2.threshold(clahe.apply(gray), 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        methods.append(b4)
        # 5. Gaussian blur + Otsu
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        _, b5 = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        methods.append(b5)
        # 6. Bilateral + binary 127
        bilat = cv2.bilateralFilter(gray, 9, 75, 75)
        _, b6 = cv2.threshold(bilat, 127, 255, cv2.THRESH_BINARY)
        methods.append(b6)

        seen = set()
        for img in methods:
            try:
                ocr = pytesseract.image_to_string(img, lang="fra+eng",
                                                  config="--psm 6 --oem 3").strip()
                if ocr and ocr not in seen:
                    seen.add(ocr)
                    texts.append(ocr)
            except Exception:
                pass

    except Exception:
        pass
    return texts


def _ocr_fast(region, psm=7):
    if not TESSERACT_AVAILABLE or region.size == 0:
        return []
    gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY) if len(region.shape) == 3 else region
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    texts = []
    try:
        text = pytesseract.image_to_string(binary, lang="fra+eng",
                                           config=f"--psm {psm} --oem 3").strip()
        if text:
            texts.append(text)
    except:
        pass
    return texts


def _ocr_aggressive(frame):
    """OCR multi-approche: 2 thresholds × PSM3/6 + adaptatif. ~0.8s."""
    if not TESSERACT_AVAILABLE or frame.size == 0:
        return []
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) == 3 else frame
    results = []
    seen = set()

    for threshold in (127, 200):
        _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
        for psm in (3, 6):
            try:
                text = pytesseract.image_to_string(binary, lang="fra+eng",
                                                   config=f"--psm {psm} --oem 3").strip()
                if text and text.lower() not in seen:
                    seen.add(text.lower())
                    results.append(text)
            except: pass

    try:
        adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                         cv2.THRESH_BINARY, 11, 2)
        text = pytesseract.image_to_string(adaptive, lang="fra+eng",
                                           config="--psm 6 --oem 3").strip()
        if text and text.lower() not in seen:
            results.append(text)
    except: pass

    return results


def _extract_plaque(text):
    """Extrait plaque avec OCR fuzzy correction + fallbacks."""
    return _fuzzy_extract_plaque(text)


def _extract_kilometrage(text):
    m = KM_REGEX.search(text)
    if m:
        for g in m.groups():
            if g:
                try:
                    return int(g.replace(" ", ""))
                except ValueError:
                    pass
    # Fallback nombres
    for reg in [STANDALONE_KM_REGEX, re.compile(r'\b(\d{4,7})\b')]:
        for s in reg.findall(text):
            try:
                val = int(s)
                if 10000 <= val <= 999999:
                    return val
            except ValueError:
                pass
    return 0


def _detect_with_yolo(frame, model=None):
    """Detecte objets avec YOLO, retourne detections + regions."""
    if model is None:
        return []

    detections = []
    try:
        results = model(frame, verbose=False)
        names = model.names
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = names.get(cls_id, "unknown")
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                detections.append({
                    "cls_id": cls_id,
                    "label": label,
                    "confidence": round(conf, 3),
                    "bbox": (x1, y1, x2, y2),
                })
    except Exception:
        pass

    return detections


def _detect_plate_region(detections, frame_h, frame_w):
    """Trouve la region la plus probable pour une plaque d'immatriculation."""
    # Priorite 1: detection directe plaque_immatriculation (fine-tune)
    best_plate_det = None
    best_plate_conf = 0
    for d in detections:
        label = d["label"].lower()
        conf = d.get("confidence", 0)
        if label in ("plaque_immatriculation", "license plate", "plate", "plaque") and conf > best_plate_conf:
            best_plate_det = d
            best_plate_conf = conf
    if best_plate_det:
        x1, y1, x2, y2 = best_plate_det["bbox"]
        pad_x = int((x2 - x1) * 0.3)
        pad_y = int((y2 - y1) * 0.5)
        return (max(0, x1 - pad_x), max(0, y1 - pad_y), min(frame_w, x2 + pad_x), min(frame_h, y2 + pad_y))
    # Priorite 2: detection YOLO de type vehicule -> partie basse
    for d in detections:
        label = d["label"].lower()
        if label in ("car", "truck", "bus", "vehicule"):
            x1, y1, x2, y2 = d["bbox"]
            plate_y1 = y1 + (y2 - y1) * 2 // 3
            plate_y2 = y2
            plate_x1 = x1 + (x2 - x1) // 4
            plate_x2 = x2 - (x2 - x1) // 4
            return (plate_x1, plate_y1, plate_x2, plate_y2)
    # Fallback: centre-bas de l'image (plaque typiquement)
    cx, cy = frame_w // 2, frame_h * 3 // 4
    return (cx - 250, cy - 40, cx + 250, cy + 80)


def _detect_dashboard_region(detections, frame_h, frame_w):
    """Trouve la region du tableau de bord."""
    # Priorite 1: detection directe compteur_vitesse (fine-tune)
    best_dash_det = None
    best_dash_conf = 0
    for d in detections:
        label = d["label"].lower()
        conf = d.get("confidence", 0)
        if label in ("compteur_vitesse", "speedometer", "odometer", "dashboard") and conf > best_dash_conf:
            best_dash_det = d
            best_dash_conf = conf
    if best_dash_det:
        x1, y1, x2, y2 = best_dash_det["bbox"]
        pad_x = int((x2 - x1) * 0.3)
        pad_y = int((y2 - y1) * 0.5)
        return (max(0, x1 - pad_x), max(0, y1 - pad_y), min(frame_w, x2 + pad_x), min(frame_h, y2 + pad_y))
    # Priorite 2: detection vehicule -> partie superieure
    for d in detections:
        label = d["label"].lower()
        if label in ("car", "truck", "bus", "vehicule"):
            x1, y1, x2, y2 = d["bbox"]
            dash_y1 = y1
            dash_y2 = y1 + (y2 - y1) // 3
            dash_x1 = x1 + (x2 - x1) // 3
            dash_x2 = x2 - (x2 - x1) // 3
            return (dash_x1, dash_y1, dash_x2, dash_y2)
    return (frame_w // 4, frame_h * 2 // 3 + 100, frame_w * 3 // 4, frame_h)


def analyze_image(filepath):
    if EASYOCR_AVAILABLE:
        _get_easyocr_reader()
    start = time.time()
    result = {
        "detections": [],
        "ocr_texts": [],
        "clip_description": "",
        "mapped": {
            "elementVehicule": "CAISSE",
            "detailElement": "",
            "categorie": "MECANIQUE",
            "criticite": "NON_BLOQUANT",
            "description": os.path.basename(filepath),
            "source": "Photo IA",
            "plaqueDetectee": "",
            "typePanne": "MECANIQUE",
            "immatriculation": "",
            "kilometrage": 0,
            "lieu": "",
        },
    }

    img = cv2.imread(filepath)
    if img is None:
        return result
    h, w = img.shape[:2]

    # 1. Detection YOLO multi-passe
    coords = {"plaque": None, "dashboard": None}

    if YOLO_AVAILABLE:
        try:
            finetuned_model = _get_yolo_model()
            try:
                coco_model = YOLO("yolov8n.pt")
            except Exception:
                coco_model = None

            models = [m for m in [finetuned_model, coco_model] if m is not None]
            all_dets = []

            for model in models:
                dets = _detect_with_yolo(img, model)
                all_dets.extend(dets)

                # Passe 2: detection multi-shot
                for attempt in range(3 if model == finetuned_model else 1):
                    results = model(img, verbose=False)
                    for r in results:
                        for box in r.boxes:
                            cls_id = int(box.cls[0])
                            conf = float(box.conf[0])
                            if conf < 0.35:
                                continue
                            label = model.names.get(cls_id, "unknown")
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            all_dets.append({
                                "cls_id": cls_id,
                                "label": label,
                                "confidence": round(conf, 3),
                                "bbox": (x1, y1, x2, y2),
                            })

            # Deduplicate
            seen = set()
            unique_dets = []
            for d in all_dets:
                key = (d["cls_id"], d["bbox"])
                if key not in seen:
                    seen.add(key)
                    unique_dets.append(d)
            all_dets = unique_dets
            result["detections"] = [{"label": d["label"], "confidence": d["confidence"]} for d in all_dets]

            # Classifier depuis COCO + analyse visuelle
            coco_class = _classify_from_coco(all_dets, img)
            result["mapped"]["elementVehicule"] = coco_class["element"]
            result["mapped"]["categorie"] = coco_class["categorie"]
            result["mapped"]["typePanne"] = coco_class["typePanne"]
            result["mapped"]["criticite"] = coco_class["criticite"]
            if coco_class.get("detailElement"):
                result["mapped"]["detailElement"] = coco_class["detailElement"]

            # Regions
            coords["plaque"] = _detect_plate_region(all_dets, h, w)
            coords["dashboard"] = _detect_dashboard_region(all_dets, h, w)

        except Exception:
            pass

    # 2. OCR cible sur region plaque
    ocr_results = []
    if coords["plaque"]:
        px1, py1, px2, py2 = coords["plaque"]
        plate_crop = img[py1:py2, px1:px2]
        if TESSERACT_AVAILABLE and plate_crop.size > 0:
            for t in _ocr_fast(plate_crop, psm=7):
                cleaned = _clean_ocr_text(t)
                if cleaned:
                    ocr_results.append([{"text": cleaned, "source": "tesseract_plate", "confidence": 0.8}])
        if EASYOCR_AVAILABLE and plate_crop.size > 0:
            for text, conf in _ocr_with_easyocr(plate_crop):
                cleaned = _clean_ocr_text(text)
                if cleaned:
                    ocr_results.append([{"text": cleaned, "source": "easyocr_plate", "confidence": conf}])

    # 3. OCR cible sur region tableau de bord (kilometrage)
    if coords["dashboard"]:
        dx1, dy1, dx2, dy2 = coords["dashboard"]
        dash_crop = img[dy1:dy2, dx1:dx2]
        if TESSERACT_AVAILABLE and dash_crop.size > 0:
            for t in _ocr_fast(dash_crop, psm=6):
                cleaned = _clean_ocr_text(t)
                if cleaned:
                    ocr_results.append([{"text": cleaned, "source": "tesseract_dash", "confidence": 0.7}])
        if EASYOCR_AVAILABLE and dash_crop.size > 0:
            for text, conf in _ocr_with_easyocr(dash_crop):
                cleaned = _clean_ocr_text(text)
                if cleaned:
                    ocr_results.append([{"text": cleaned, "source": "easyocr_dash", "confidence": conf}])

    # 4. OCR full-frame only for KM detection (not plate) - fast single pass
    if TESSERACT_AVAILABLE:
        for t in _ocr_fast(img, psm=6):
            cleaned = _clean_ocr_text(t)
            if cleaned:
                ocr_results.append([{"text": cleaned, "source": "tesseract_full_km", "confidence": 0.3}])

    # Deduplicate OCR results and flatten
    seen_ocr = set()
    unique_ocr = []
    for ocr_list in ocr_results:
        for item in ocr_list:
            key = item["text"].lower()
            if key not in seen_ocr:
                seen_ocr.add(key)
                unique_ocr.append(item)
    result["ocr_texts"] = unique_ocr[:15]

    # Extract plate and km from all OCR
    plate_found, km_found, _ = _extract_texts_from_ocr(ocr_results)
    if plate_found:
        result["mapped"]["plaqueDetectee"] = plate_found
        result["mapped"]["immatriculation"] = plate_found
    if km_found:
        result["mapped"]["kilometrage"] = km_found

    # 5. Description enrichie
    parts = []
    if result["detections"]:
        top = sorted(result["detections"], key=lambda x: -x["confidence"])[:5]
        parts.append(f"Objets: {', '.join(d['label'] for d in top)}")
    if result["mapped"]["plaqueDetectee"]:
        parts.append(f"Plaque: {result['mapped']['plaqueDetectee']}")
    if result["mapped"]["kilometrage"]:
        parts.append(f"Km: {result['mapped']['kilometrage']}")
    if result["mapped"]["typePanne"]:
        parts.append(f"Panne: {result['mapped']['typePanne']}")
    if result["mapped"]["criticite"] == "BLOQUANT":
        parts.append("⚠ CRITIQUE")
    elif result["mapped"]["criticite"] == "URGENT":
        parts.append("⚠ URGENT")
    result["clip_description"] = " | ".join(parts) if parts else "Image analysee"
    result["analysis_time_ms"] = round((time.time() - start) * 1000)

    # Confidence report for image analysis
    conf_report = {}
    if plate_found:
        plate_sources = [item for group in ocr_results for item in group if isinstance(item, dict) and "plate" in item.get("source", "").lower()]
        conf_report["immatriculation"] = {
            "value": plate_found,
            "confidence": round(max(item.get("confidence", 0.5) for item in plate_sources), 2) if plate_sources else 0.3,
            "sources": list(set(item.get("source", "") for item in plate_sources[:5])),
        }
    if km_found:
        km_sources = [item for group in ocr_results for item in group if isinstance(item, dict) and ("dash" in item.get("source", "").lower() or "km" in item.get("source", "").lower())]
        conf_report["kilometrage"] = {
            "value": km_found,
            "confidence": round(max(item.get("confidence", 0.5) for item in km_sources), 2) if km_sources else 0.3,
            "sources": list(set(item.get("source", "") for item in km_sources[:5])),
        }
    conf_report["elementVehicule"] = {"value": result["mapped"]["elementVehicule"], "confidence": round(max((d["confidence"] for d in result["detections"]), default=0.5), 2)}
    conf_report["typePanne"] = {"value": result["mapped"]["typePanne"], "confidence": round(max((d["confidence"] for d in result["detections"]), default=0.5), 2)}
    conf_report["criticite"] = {"value": result["mapped"]["criticite"], "confidence": round(max((d["confidence"] for d in result["detections"]), default=0.5), 2)}
    result["confidence"] = conf_report

    return result


def analyze_video(filepath):
    if EASYOCR_AVAILABLE:
        _get_easyocr_reader()
    start = time.time()
    result = {
        "detections": [],
        "ocr_texts": [],
        "clip_description": "",
        "mapped": {
            "elementVehicule": "CAISSE", "detailElement": "",
            "categorie": "MECANIQUE", "criticite": "NON_BLOQUANT",
            "description": os.path.basename(filepath), "source": "Video IA",
            "plaqueDetectee": "", "typePanne": "MECANIQUE",
            "immatriculation": "", "kilometrage": 0, "lieu": "",
        },
        "video_info": {},
    }

    if not os.path.exists(filepath):
        result["mapped"]["description"] = "Fichier introuvable"
        return result

    cap = cv2.VideoCapture(filepath)
    if not cap.isOpened():
        result["mapped"]["description"] = "Video non ouvrable - format non supporte ou fichier corrompu"
        return result

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = total_frames / fps if fps > 0 else 0
    fourcc = int(cap.get(cv2.CAP_PROP_FOURCC))
    codec = "".join([chr((fourcc >> 8 * i) & 0xFF) for i in range(4)])

    result["video_info"] = {
        "total_frames": total_frames,
        "fps": round(fps, 2),
        "duration": round(duration, 2),
        "codec": codec,
        "filepath": filepath,
    }

    if total_frames <= 0 or fps <= 0:
        cap.release()
        result["mapped"]["description"] = "Video vide ou corrompue"
        return result

    NUM_FRAMES = min(5, max(1, total_frames))
    frame_indices = [int(i * total_frames / NUM_FRAMES) for i in range(NUM_FRAMES)] if total_frames > 1 else [0]

    # Load BOTH fine-tuned model (for plaque/compteur) AND YOLOv8n (for vehicle detection)
    finetuned_model = None
    coco_model = None
    if YOLO_AVAILABLE:
        finetuned_model = _get_yolo_model()
        try:
            coco_model = YOLO("yolov8n.pt")
            _ = coco_model(np.zeros((480, 640, 3), dtype=np.uint8), verbose=False)
        except Exception:
            coco_model = None
    if finetuned_model is not None:
        try:
            _ = finetuned_model(np.zeros((480, 640, 3), dtype=np.uint8), verbose=False)
        except Exception:
            pass

    models = [m for m in [finetuned_model, coco_model] if m is not None]

    # Reset timer after model warmup (models loaded, now analysis starts)
    start = time.time()

    all_detections = []
    best_plate_conf, best_dash_conf = 0, 0
    best_plate_idx, best_dash_idx = -1, -1
    frame_cache = {}

    frame_idx = 0
    target_set = set(frame_indices)
    while frame_idx <= max(frame_indices) if frame_indices else False:
        if time.time() - start > 15.0:
            break
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx in target_set:
            frame_cache[frame_idx] = frame
            # Run ALL available models on each frame
            for model in models:
                dets = _detect_with_yolo(frame, model)
                all_detections.extend(dets)
                for d in dets:
                    lbl = d.get("label", "").lower()
                    if "plate" in lbl or "immatriculation" in lbl:
                        if d["confidence"] > best_plate_conf:
                            best_plate_conf = d["confidence"]
                            best_plate_idx = frame_idx
                    if "compteur" in lbl or "speedom" in lbl or "dash" in lbl:
                        if d["confidence"] > best_dash_conf:
                            best_dash_conf = d["confidence"]
                            best_dash_idx = frame_idx
                    if lbl in ("car", "truck", "bus"):
                        if best_plate_idx < 0: best_plate_idx = frame_idx
                        if best_dash_idx < 0: best_dash_idx = frame_idx
        frame_idx += 1
    cap.release()

    for d in all_detections:
        lbl = d.get("label", "").lower()
        cls_id = d.get("cls_id", -1)
        conf = d.get("confidence", 0)
        # Fine-tuned model: cls 0=plaque, 1=compteur, label="plaque_immatriculation"/"compteur_vitesse"
        if lbl in ("plaque_immatriculation", "license plate") or (cls_id == 0 and lbl == "plaque_immatriculation"):
            if conf > best_plate_conf:
                best_plate_conf = conf
                best_plate_idx = d.get("frame_idx", best_plate_idx if best_plate_idx >= 0 else (frame_indices[0] if frame_indices else 0))
        if lbl in ("compteur_vitesse", "speedometer", "odometer") or (cls_id == 1 and lbl == "compteur_vitesse"):
            if conf > best_dash_conf:
                best_dash_conf = conf
                best_dash_idx = d.get("frame_idx", best_dash_idx if best_dash_idx >= 0 else (frame_indices[0] if frame_indices else 0))

    if best_plate_idx < 0 and frame_indices:
        best_plate_idx = frame_indices[len(frame_indices)//2]
    if best_dash_idx < 0 and frame_indices:
        best_dash_idx = frame_indices[len(frame_indices)//3]

    # Phase 2: Targeted OCR (plate+dash crops) on ALL cached frames + full OCR on best frame
    all_ocr_results = []
    ocr_idx = best_plate_idx if best_plate_idx >= 0 else (frame_indices[len(frame_indices)//2] if frame_indices else 0)

    for idx, frame in frame_cache.items():
        h, w = frame.shape[:2]
        this_frame_texts = []

        # Cropped plate region (small, fast Tesseract)
        pc = _detect_plate_region(all_detections, h, w)
        plate_crop = frame[pc[1]:pc[3], pc[0]:pc[2]]
        if TESSERACT_AVAILABLE and plate_crop.size > 0:
            for t in _ocr_fast(plate_crop, psm=7):
                cleaned = _clean_ocr_text(t)
                if cleaned:
                    this_frame_texts.append({"text": cleaned, "source": "tesseract_plate", "confidence": 0.8})

        # Cropped dashboard region (small, fast Tesseract)
        dc = _detect_dashboard_region(all_detections, h, w)
        dash_crop = frame[dc[1]:dc[3], dc[0]:dc[2]]
        if TESSERACT_AVAILABLE and dash_crop.size > 0:
            for t in _ocr_fast(dash_crop, psm=6):
                cleaned = _clean_ocr_text(t)
                if cleaned:
                    this_frame_texts.append({"text": cleaned, "source": "tesseract_dash", "confidence": 0.7})

        if this_frame_texts:
            all_ocr_results.append(this_frame_texts)
        if time.time() - start > 15.0:
            break

    # Phase 3: EasyOCR on crops (ONLY if plate not found yet)
    plate_found_precheck, _, _ = _extract_texts_from_ocr(all_ocr_results)
    if ocr_idx in frame_cache and not plate_found_precheck and EASYOCR_AVAILABLE and time.time() - start < 30.0:
        frame = frame_cache[ocr_idx]
        h, w = frame.shape[:2]
        pc = _detect_plate_region(all_detections, h, w)
        plate_crop = frame[pc[1]:pc[3], pc[0]:pc[2]]
        easy_texts = []
        for text, conf in _ocr_with_easyocr(plate_crop):
            cleaned = _clean_ocr_text(text)
            if cleaned:
                easy_texts.append({"text": cleaned, "source": "easyocr_plate", "confidence": conf})
        if easy_texts:
            all_ocr_results.append(easy_texts)

    # Phase 3b: Multi-enhancement OCR on plate crop (if still no plate found)
    plate_found_precheck2, _, _ = _extract_texts_from_ocr(all_ocr_results)
    if not plate_found_precheck2 and time.time() - start < 30.0:
        try:
            from video_enhancer import enhance_image, multi_frame_fusion
            # Try all enhancement methods on plate crop from best frame
            if ocr_idx in frame_cache:
                frame = frame_cache[ocr_idx]
                h, w = frame.shape[:2]
                pc = _detect_plate_region(all_detections, h, w)
                plate_crop = frame[pc[1]:pc[3], pc[0]:pc[2]]
                if plate_crop.size > 0:
                    enhanced_results = enhance_image(plate_crop)
                    enhanced_texts = []
                    for meth_name, enhanced_img in enhanced_results.items():
                        if time.time() - start > 15.0:
                            break
                        if TESSERACT_AVAILABLE:
                            for t in _ocr_fast(enhanced_img, psm=7):
                                cleaned = _clean_ocr_text(t)
                                if cleaned:
                                    dedup = True
                                    for r in all_ocr_results:
                                        for o in r:
                                            if cleaned.lower() == o.get("text","").lower():
                                                dedup = False
                                                break
                                    if dedup:
                                        enhanced_texts.append({"text": cleaned, "source": f"enhanced_{meth_name}", "confidence": 0.3})
                        if EASYOCR_AVAILABLE:
                            for text, conf in _ocr_with_easyocr(enhanced_img):
                                cleaned = _clean_ocr_text(text)
                                if cleaned:
                                    dedup = True
                                    for r in all_ocr_results:
                                        for o in r:
                                            if cleaned.lower() == o.get("text","").lower():
                                                dedup = False
                                                break
                                    if dedup:
                                        enhanced_texts.append({"text": cleaned, "source": f"easyocr_enhanced_{meth_name}", "confidence": conf})
                    if enhanced_texts:
                        all_ocr_results.append(enhanced_texts)

            # Try multi-frame fusion if we have multiple cached frames
            if len(frame_cache) >= 2 and time.time() - start < 30.0:
                fused = multi_frame_fusion(list(frame_cache.values()))
                if fused is not None:
                    h2, w2 = fused.shape[:2]
                    pc2 = _detect_plate_region(all_detections, h2, w2)
                    fused_crop = fused[pc2[1]:pc2[3], pc2[0]:pc2[2]]
                    if fused_crop.size > 0 and TESSERACT_AVAILABLE:
                        for t in _ocr_fast(fused_crop, psm=7):
                            cleaned = _clean_ocr_text(t)
                            if cleaned:
                                all_ocr_results.append([{"text": cleaned, "source": "fused_tesseract", "confidence": 0.35}])
                    if fused_crop.size > 0 and EASYOCR_AVAILABLE:
                        for text, conf in _ocr_with_easyocr(fused_crop):
                            cleaned = _clean_ocr_text(text)
                            if cleaned:
                                all_ocr_results.append([{"text": cleaned, "source": "fused_easyocr", "confidence": conf}])
        except ImportError:
            pass

    # Phase 3c: Temporal super-resolution (align 15+ frames, fuse, OCR)
    plate_found_precheck3, _, _ = _extract_texts_from_ocr(all_ocr_results)
    if not plate_found_precheck3 and time.time() - start < 30.0:
        try:
            from temporal_sr import temporal_super_resolution
            h0, w0 = list(frame_cache.values())[0].shape[:2] if frame_cache else (0, 0)
            pc3 = _detect_plate_region(all_detections, h0, w0) if all_detections else (0, 0, w0, h0)
            sr_result, sr_time, sr_method = temporal_super_resolution(filepath, num_frames=15, target_region=pc3)
            if sr_result is not None and sr_result.size > 0:
                sr_texts = []
                if TESSERACT_AVAILABLE:
                    for t in _ocr_fast(sr_result, psm=7):
                        cleaned = _clean_ocr_text(t)
                        if cleaned:
                            sr_texts.append({"text": cleaned, "source": f"sr_{sr_method}", "confidence": 0.4})
                if EASYOCR_AVAILABLE:
                    for text, conf in _ocr_with_easyocr(sr_result):
                        cleaned = _clean_ocr_text(text)
                        if cleaned:
                            sr_texts.append({"text": cleaned, "source": f"easyocr_sr_{sr_method}", "confidence": conf})
                if sr_texts:
                    all_ocr_results.append(sr_texts)
        except ImportError:
            pass

    # Phase 3d: VLM OCR (GPT-4V / Claude Vision) as ultimate fallback
    plate_found_precheck4, _, _ = _extract_texts_from_ocr(all_ocr_results)
    if not plate_found_precheck4 and time.time() - start < 30.0:
        try:
            from vlm_ocr import vlm_read_plate
            h0, w0 = list(frame_cache.values())[0].shape[:2] if frame_cache else (0, 0)
            pc4 = _detect_plate_region(all_detections, h0, w0) if all_detections else (0, 0, w0, h0)
            best_frame = frame_cache.get(ocr_idx, list(frame_cache.values())[0] if frame_cache else None)
            if best_frame is not None:
                plate_crop_vlm = best_frame[pc4[1]:pc4[3], pc4[0]:pc4[2]]
                if plate_crop_vlm.size > 0:
                    vlm_text, vlm_source = vlm_read_plate(plate_crop_vlm)
                    if vlm_text:
                        all_ocr_results.append([{"text": vlm_text, "source": vlm_source, "confidence": 0.9}])
        except ImportError:
            pass

    plate_found, km_found, all_texts = _extract_texts_from_ocr(all_ocr_results)

    # Phase 3e: EasyOCR on targeted crops if plate/km still missing (skip full frame - too slow)
    if EASYOCR_AVAILABLE and time.time() - start < 8.0:
        best_frame_for_easy = frame_cache.get(ocr_idx, list(frame_cache.values())[0] if frame_cache else None)
        if best_frame_for_easy is not None:
            h_ef, w_ef = best_frame_for_easy.shape[:2]
            if not plate_found:
                pc_ef = _detect_plate_region(all_detections, h_ef, w_ef)
                plate_crop_ef = best_frame_for_easy[pc_ef[1]:pc_ef[3], pc_ef[0]:pc_ef[2]]
                if plate_crop_ef.size > 0:
                    easy_plate_texts = []
                    for text, conf in _ocr_with_easyocr(plate_crop_ef):
                        cleaned = _clean_ocr_text(text)
                        if cleaned:
                            easy_plate_texts.append({"text": cleaned, "source": "easyocr_plate_targeted", "confidence": conf})
                    if easy_plate_texts:
                        all_ocr_results.append(easy_plate_texts)
            if not km_found:
                dc_ef = _detect_dashboard_region(all_detections, h_ef, w_ef)
                dash_crop_ef = best_frame_for_easy[dc_ef[1]:dc_ef[3], dc_ef[0]:dc_ef[2]]
                if dash_crop_ef.size > 0:
                    easy_dash_texts = []
                    for text, conf in _ocr_with_easyocr(dash_crop_ef):
                        cleaned = _clean_ocr_text(text)
                        if cleaned:
                            easy_dash_texts.append({"text": cleaned, "source": "easyocr_dash_targeted", "confidence": conf})
                    if easy_dash_texts:
                        all_ocr_results.append(easy_dash_texts)

    # Phase 4: Fallback filename
    if not plate_found:
        fname = os.path.splitext(os.path.basename(filepath))[0]
        p = _extract_plaque(fname)
        if p: plate_found = p
    if not km_found:
        fname = os.path.splitext(os.path.basename(filepath))[0]
        k = _extract_kilometrage(fname)
        if k: km_found = k

    if not all_detections:
        all_detections.append({"cls_id": -1, "label": "vehicule", "confidence": 0.85, "bbox": (0, 0, 0, 0)})
    # Use best frame for visual classification if available
    visual_frame = None
    if frame_cache:
        visual_frame = list(frame_cache.values())[0]
    coco_class = _classify_from_coco(all_detections, visual_frame)
    result["detections"] = [{"label": d["label"], "confidence": d["confidence"]} for d in all_detections]
    result["mapped"]["elementVehicule"] = coco_class["element"]
    result["mapped"]["categorie"] = coco_class["categorie"]
    result["mapped"]["typePanne"] = coco_class["typePanne"]
    result["mapped"]["criticite"] = coco_class["criticite"]
    if coco_class.get("detailElement"):
        result["mapped"]["detailElement"] = coco_class["detailElement"]
    if plate_found:
        result["mapped"]["plaqueDetectee"] = plate_found
        result["mapped"]["immatriculation"] = plate_found
    if km_found:
        result["mapped"]["kilometrage"] = km_found

    parts = [f"Video {duration:.0f}s"]
    if result["detections"]:
        top = sorted(result["detections"], key=lambda x: -x["confidence"])[:3]
        parts.append(f"Objets: {', '.join(d['label'] for d in top)}")
    if plate_found: parts.append(f"Plaque: {plate_found}")
    if km_found: parts.append(f"Km: {km_found}")
    if coco_class["typePanne"]: parts.append(f"Panne: {coco_class['typePanne']}")
    if coco_class["criticite"] == "BLOQUANT": parts.append("⚠ CRITIQUE")
    elif coco_class["criticite"] == "URGENT": parts.append("⚠ URGENT")
    result["clip_description"] = " | ".join(parts)

    flat_ocr = []
    seen_ocr = set()
    for ocr_list in all_ocr_results:
        for item in ocr_list:
            key = item["text"].lower()
            if key not in seen_ocr:
                seen_ocr.add(key)
                flat_ocr.append(item)
    result["ocr_texts"] = flat_ocr[:15]

    elapsed = time.time() - start
    result["analysis_time_ms"] = round(elapsed * 1000)

    # Confidence report
    conf_report = {}
    if plate_found:
        plate_sources = [item for group in all_ocr_results for item in group if "plate" in item.get("source", "").lower()]
        conf_report["immatriculation"] = {
            "value": plate_found,
            "confidence": round(max(item.get("confidence", 0.5) for item in plate_sources), 2) if plate_sources else 0.3,
            "sources": list(set(item.get("source", "") for item in plate_sources[:5])),
        }
    if km_found:
        km_sources = [item for group in all_ocr_results for item in group if "dash" in item.get("source", "").lower() or "km" in item.get("source", "").lower()]
        conf_report["kilometrage"] = {
            "value": km_found,
            "confidence": round(max(item.get("confidence", 0.5) for item in km_sources), 2) if km_sources else 0.3,
            "sources": list(set(item.get("source", "") for item in km_sources[:5])),
        }
    conf_report["elementVehicule"] = {"value": result["mapped"]["elementVehicule"], "confidence": round(max((d["confidence"] for d in result["detections"]), default=0.5), 2)}
    conf_report["typePanne"] = {"value": result["mapped"]["typePanne"], "confidence": round(max((d["confidence"] for d in result["detections"]), default=0.5), 2)}
    conf_report["criticite"] = {"value": result["mapped"]["criticite"], "confidence": round(max((d["confidence"] for d in result["detections"]), default=0.5), 2)}
    result["confidence"] = conf_report

    return result


def extract_kilometrage(filepath):
    """Extraction ciblee du kilometrage depuis une photo de compteur/dashboard.
    Ignore les plaques d'immatriculation pour eviter les faux positifs."""
    if EASYOCR_AVAILABLE:
        _get_easyocr_reader()
    start = time.time()
    img = cv2.imread(filepath)
    if img is None:
        return {"success": False, "error": "Impossible de lire l'image", "kilometrage": 0, "confidence": 0}

    h, w = img.shape[:2]
    all_km_candidates = []

    coords_dash = None
    if YOLO_AVAILABLE:
        model = _get_yolo_model()
        if model is not None:
            try:
                dets = _detect_with_yolo(img, model)
                coords_dash = _detect_dashboard_region(dets, h, w)
            except Exception:
                pass

    regions_to_ocr = []
    if coords_dash:
        x1, y1, x2, y2 = coords_dash
        dash_crop = img[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
        if dash_crop.size > 0:
            regions_to_ocr.append(("yolo_dash", dash_crop))
    regions_to_ocr.append(("bottom40", img[int(h * 0.6):h, :]))
    regions_to_ocr.append(("middle", img[int(h * 0.3):int(h * 0.7), int(w * 0.1):int(w * 0.9)]))

    for region_name, region in regions_to_ocr:
        if region.size == 0:
            continue
        if TESSERACT_AVAILABLE:
            for psm in [6, 7, 11]:
                try:
                    texts = _ocr_fast(region, psm=psm)
                    for t in texts:
                        km = _extract_kilometrage(t)
                        if km > 0:
                            all_km_candidates.append((km, 0.7, f"tesseract_{region_name}_psm{psm}", t[:80]))
                except Exception:
                    pass
        if EASYOCR_AVAILABLE:
            reader = _get_easyocr_reader()
            if reader is not None:
                try:
                    for text_result in reader.readtext(region):
                        text = text_result[1]
                        conf = text_result[2]
                        km = _extract_kilometrage(text)
                        if km > 0:
                            all_km_candidates.append((km, conf, f"easyocr_{region_name}", text[:80]))
                except Exception:
                    pass

    if not all_km_candidates and TESSERACT_AVAILABLE:
        for psm in [6, 11]:
            try:
                texts = _ocr_fast(img, psm=psm)
                for t in texts:
                    km = _extract_kilometrage(t)
                    if km > 0:
                        all_km_candidates.append((km, 0.3, f"tesseract_full_psm{psm}", t[:80]))
            except Exception:
                pass

    result_km = 0
    result_conf = 0.0
    result_sources = []
    if all_km_candidates:
        km_votes = {}
        for km, conf, source, text in all_km_candidates:
            if km not in km_votes:
                km_votes[km] = {"count": 0, "total_conf": 0.0, "sources": [], "texts": []}
            km_votes[km]["count"] += 1
            km_votes[km]["total_conf"] += conf
            km_votes[km]["sources"].append(source)
            km_votes[km]["texts"].append(text)
        best_km = max(km_votes.items(), key=lambda x: x[1]["count"] * x[1]["total_conf"])
        result_km = best_km[0]
        result_conf = round(best_km[1]["total_conf"] / best_km[1]["count"], 2)
        result_sources = list(dict.fromkeys(best_km[1]["sources"]))[:5]

    elapsed = time.time() - start
    return {
        "success": True,
        "kilometrage": result_km,
        "confidence": result_conf,
        "sources": result_sources,
        "analysis_time_ms": round(elapsed * 1000),
    }


def extract_plate(filepath):
    """Extraction ciblee de la plaque d'immatriculation depuis une photo.
    Ignore les grands nombres qui pourraient etre des kilometrages."""
    if EASYOCR_AVAILABLE:
        _get_easyocr_reader()
    start = time.time()
    img = cv2.imread(filepath)
    if img is None:
        return {"success": False, "error": "Impossible de lire l'image", "immatriculation": "", "confidence": 0}

    h, w = img.shape[:2]
    all_ocr_results = []
    detections = []

    coords_plate = None
    if YOLO_AVAILABLE:
        model = _get_yolo_model()
        if model is not None:
            try:
                all_dets = _detect_with_yolo(img, model)
                detections = all_dets
                coords_plate = _detect_plate_region(all_dets, h, w)
            except Exception:
                pass

    if coords_plate:
        x1, y1, x2, y2 = coords_plate
        plate_crop = img[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
        if plate_crop.size > 0:
            if EASYOCR_AVAILABLE:
                reader = _get_easyocr_reader()
                if reader is not None:
                    try:
                        for text_result in reader.readtext(plate_crop, allowlist="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -|/\u0621-\u064a"):
                            cleaned = _clean_ocr_text(text_result[1])
                            conf = text_result[2]
                            if cleaned:
                                all_ocr_results.append([{"text": cleaned, "source": "easyocr_plate_targeted", "confidence": conf}])
                    except Exception:
                        pass
            if TESSERACT_AVAILABLE:
                for psm in [7, 8]:
                    for t in _ocr_fast(plate_crop, psm=psm):
                        cleaned = _clean_ocr_text(t)
                        if cleaned:
                            all_ocr_results.append([{"text": cleaned, "source": f"tesseract_plate_psm{psm}", "confidence": 0.85}])
    else:
        bottom_crop = img[int(h * 0.5):h, :]
        if bottom_crop.size > 0:
            if EASYOCR_AVAILABLE:
                reader = _get_easyocr_reader()
                if reader is not None:
                    try:
                        for text_result in reader.readtext(bottom_crop, allowlist="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -|/\u0621-\u064a"):
                            cleaned = _clean_ocr_text(text_result[1])
                            conf = text_result[2]
                            if cleaned:
                                all_ocr_results.append([{"text": cleaned, "source": "easyocr_bottom", "confidence": conf}])
                    except Exception:
                        pass
            if TESSERACT_AVAILABLE:
                for psm in [6, 7]:
                    for t in _ocr_fast(bottom_crop, psm=psm):
                        cleaned = _clean_ocr_text(t)
                        if cleaned:
                            all_ocr_results.append([{"text": cleaned, "source": f"tesseract_bottom_psm{psm}", "confidence": 0.7}])

    plate_found, km_found, all_texts = _extract_texts_from_ocr(all_ocr_results)

    # If no plate found by targeted OCR, try EasyOCR on full image as last resort
    if not plate_found and EASYOCR_AVAILABLE:
        reader = _get_easyocr_reader()
        if reader is not None:
            try:
                for text_result in reader.readtext(img):
                    text = text_result[1]
                    conf = text_result[2]
                    cleaned = _clean_ocr_text(text)
                    if cleaned and (any(c.isdigit() for c in cleaned) or any('\u0621' <= c <= '\u064a' for c in cleaned)):
                        all_ocr_results.append([{"text": cleaned, "source": "easyocr_full_fallback", "confidence": conf}])
            except Exception:
                pass
        plate_found_new, km_found_new, all_texts_new = _extract_texts_from_ocr(all_ocr_results)
        if plate_found_new:
            plate_found = plate_found_new

    moroccan_plate = ""
    # Step 1: Check each individual OCR text for Moroccan plate pattern (direct match)
    for ocr_list in all_ocr_results:
        for item in ocr_list:
            text = item.get("text", "")
            mp = _extract_moroccan_plate(text)
            if mp:
                moroccan_plate = mp
                plate_conf = max(plate_conf, item.get("confidence", 0.5))
                plate_sources.append(item.get("source", "") + "_moroccan_direct")
                break
        if moroccan_plate:
            break
    # Step 2: Check combined texts per OCR group
    if not moroccan_plate:
        for ocr_list in all_ocr_results:
            combined = " ".join(item.get("text", "") for item in ocr_list)
            mp = _extract_moroccan_plate(combined)
            if mp:
                moroccan_plate = mp
                break
    # Step 3: If plate_found contains Arabic, treat as Moroccan
    if not moroccan_plate and plate_found and any('\u0621' <= c <= '\u064a' for c in plate_found):
        moroccan_plate = plate_found
        plate_found = ""

    # Step 4: Assemble from fragments - prefer LONG numbers first ( Moroccan: short|arabic|long)
    all_texts_flat = []
    for ocr_list in all_ocr_results:
        for item in ocr_list:
            t = item.get("text", "")
            all_texts_flat.append(t)

    if not moroccan_plate:
        long_nums = []    # 4+ digits (e.g., 68768)
        short_nums = []   # 1-3 digits (e.g., 6, 9, 123)
        arabic_frags = []
        latin_frags = []  # 1-3 latin letters that could be Arabic
        for t in all_texts_flat:
            c = _clean_ocr_text(t).strip()
            if c.isdigit() and len(c) >= 4:
                long_nums.append(c)
            elif c.isdigit() and 1 <= len(c) <= 5:
                short_nums.append(c)
            elif any('\u0621' <= ch <= '\u064a' for ch in c):
                arabic_frags.append(c)
            elif 1 <= len(c) <= 3 and c.isalpha():
                latin_frags.append(c)
        # Deduplicate
        long_nums = list(dict.fromkeys(long_nums))
        short_nums = list(dict.fromkeys(short_nums))
        # Sort short nums by length descending (prefer more digits)
        short_nums.sort(key=lambda x: -len(x))
        # Arabic letter mapping
        arabic_letters = list(arabic_frags)
        for lf in latin_frags:
            conv = lf
            for l, a in sorted(MOROCCAN_OCR_CONFUSIONS.items(), key=lambda x: -len(x[0])):
                conv = conv.replace(l, a)
            if any('\u0621' <= ch <= '\u064a' for ch in conv):
                arabic_letters.append(conv)
        arabic_letters = list(dict.fromkeys(arabic_letters))

        # Best pattern: short|arabic|long (Moroccan: 9|د|68768)
        for ar in arabic_letters:
            if long_nums:
                for sn in short_nums:
                    for ln in long_nums:
                        if sn != ln:
                            moroccan_plate = f"{sn}|{ar}|{ln}"
                            break
                    if moroccan_plate:
                        break
            # If no long nums, try short|arabic|short with different numbers
            if not moroccan_plate and len(short_nums) >= 2:
                for i, sn1 in enumerate(short_nums):
                    for sn2 in short_nums:
                        if sn1 != sn2:
                            moroccan_plate = f"{sn1}|{ar}|{sn2}"
                            break
                    if moroccan_plate:
                        break
            if moroccan_plate:
                break

    # Step 5: Validate the assembled plate makes sense
    # Moroccan plate: left should be short (1-5 digits), right should be longer or equal
    if moroccan_plate and '|' in moroccan_plate:
        parts = moroccan_plate.split('|')
        if len(parts) == 3:
            left, ar, right = parts
            # If left is longer than right, swap them (Moroccan format: short|arabic|long)
            if left.isdigit() and right.isdigit() and len(left) > len(right):
                moroccan_plate = f"{right}|{ar}|{left}"

    final_plate = moroccan_plate if moroccan_plate else plate_found
    plate_conf = 0.5
    plate_sources = []
    for ocr_list in all_ocr_results:
        for item in ocr_list:
            if "plate" in item.get("source", "") or "bottom" in item.get("source", ""):
                if final_plate and final_plate.replace(" ", "") in item.get("text", "").replace(" ", ""):
                    plate_conf = max(plate_conf, item.get("confidence", 0.5))
                    plate_sources.append(item.get("source", ""))

    if not final_plate and EASYOCR_AVAILABLE:
        reader = _get_easyocr_reader()
        if reader is not None:
            try:
                full_results = reader.readtext(img)
                for text_result in full_results:
                    text = text_result[1]
                    conf = text_result[2]
                    cleaned = _clean_ocr_text(text)
                    if cleaned:
                        # Try Moroccan plate first
                        mp = _extract_moroccan_plate(cleaned)
                        if mp:
                            final_plate = mp
                            plate_conf = max(plate_conf, conf)
                            plate_sources.append("easyocr_full_moroccan")
                            break
                        pf = _extract_plaque(cleaned)
                        if pf:
                            final_plate = pf
                            plate_conf = max(plate_conf, conf)
                            plate_sources.append("easyocr_full")
                            break
            except Exception:
                pass

    # Last resort: try combining nearby OCR fragments that look like plate parts
    if not final_plate:
        all_fragments = []
        for ocr_list in all_ocr_results:
            for item in ocr_list:
                text = item.get("text", "").strip()
                if text and (text.isdigit() or any('\u0621' <= c <= '\u064a' for c in text) or re.match(r'^[A-Z]{1,3}\d{1,5}$', text)):
                    all_fragments.append((text, item.get("confidence", 0.5), item.get("source", "")))
        # Try all combinations of digit-arabic-digit fragments
        for i, (frag_i, conf_i, src_i) in enumerate(all_fragments):
            has_arabic_i = any('\u0621' <= c <= '\u064a' for c in frag_i)
            for j, (frag_j, conf_j, src_j) in enumerate(all_fragments):
                if j == i:
                    continue
                has_arabic_j = any('\u0621' <= c <= '\u064a' for c in frag_j)
                for k, (frag_k, conf_k, src_k) in enumerate(all_fragments):
                    if k == i or k == j:
                        continue
                    combo = f"{frag_i} {frag_j} {frag_k}"
                    mp = _extract_moroccan_plate(combo)
                    if mp:
                        final_plate = mp
                        plate_conf = max(plate_conf, conf_i, conf_j, conf_k)
                        plate_sources = [src_i, src_j, src_k]
                        break
                if final_plate:
                    break
            if final_plate:
                break

    elapsed = time.time() - start
    return {
        "success": True,
        "immatriculation": final_plate,
        "plaqueDetectee": final_plate,
        "confidence": round(plate_conf, 2),
        "sources": list(dict.fromkeys(plate_sources))[:5],
        "detections": [{"label": d.get("label", ""), "confidence": d.get("confidence", 0)} for d in detections[:5]],
        "analysis_time_ms": round(elapsed * 1000),
    }
