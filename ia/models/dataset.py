"""
Preparation de dataset pour fine-tuning YOLOv8.
Format attendu: images + fichiers YOLO .txt (classe x_center y_center width height)

Utilisation:
  1. Placer les images dans models/data/train/images/ et models/data/val/images/
  2. Annoter avec LabelImg ou CVAT -> exporter en YOLO format
  3. Lancer: python models/train.py

Sinon, generate_synthetic_dataset() cree un dataset synthetique
pour tester le pipeline (plaques et kilometres generes).
"""

import os
import cv2
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFont


CLASS_NAMES = {
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

CLASS_COLORS = {
    0: (255, 255, 0),   # plaque - jaune
    1: (0, 255, 255),   # compteur - cyan
    2: (128, 128, 255),  # roue - bleu clair
    3: (255, 0, 0),     # pneu creve - rouge
    4: (255, 128, 0),   # frein - orange
    5: (255, 255, 128), # phare - jaune clair
    6: (128, 0, 255),   # feu arriere - violet
    7: (0, 0, 255),     # carrosserie impact - rouge fonce
    8: (0, 0, 200),     # carrosserie fissure - rouge fonce
    9: (0, 200, 200),   # pare-brise - vert
    10: (200, 100, 100),# retroviseur
    11: (100, 200, 100),# hayon
    12: (100, 100, 200),# pot echappement
    13: (200, 200, 0),  # klaxon
}


def generate_synthetic_dataset(num_samples=50, output_dir="models/data"):
    """
    Genere un dataset synthetique avec des formes geometriques simulant
    des vehicules, plaques et kilometres pour tester le pipeline.
    """
    train_img = os.path.join(output_dir, "train", "images")
    train_lbl = os.path.join(output_dir, "train", "labels")
    val_img = os.path.join(output_dir, "val", "images")
    val_lbl = os.path.join(output_dir, "val", "labels")
    for d in [train_img, train_lbl, val_img, val_lbl]:
        os.makedirs(d, exist_ok=True)

    # Formats de plaque
    plaque_formats = [
        "AB123CD", "1234AZ56", "1AB234", "AA123BB",
        "CV16D", "UPE CV16D", "12ABC34", "FR567GH",
    ]
    km_values = [12345, 45678, 89012, 23456, 67890, 111111, 54321, 98765]

    for i in range(num_samples):
        is_val = i >= int(num_samples * 0.8)
        folder = "val" if is_val else "train"

        w, h = 640, 480
        img = np.ones((h, w, 3), dtype=np.uint8) * random.randint(200, 240)

        labels = []

        # 1. Corps du vehicule (rectangle)
        cx, cy = w // 2, h // 2
        bw, bh = random.randint(250, 400), random.randint(150, 250)
        color = tuple(random.randint(50, 180) for _ in range(3))
        cv2.rectangle(img, (cx - bw // 2, cy - bh // 2),
                      (cx + bw // 2, cy + bh // 2), color, -1)

        # 2. Plaque d'immatriculation
        plaque_text = random.choice(plaque_formats)
        px, py = cx - 60 + random.randint(-10, 10), cy + bh // 2 - 40
        pw, ph = 120, 30
        cv2.rectangle(img, (px, py), (px + pw, py + ph), (255, 255, 255), -1)
        cv2.rectangle(img, (px, py), (px + pw, py + ph), (0, 0, 0), 2)
        try:
            font = ImageFont.truetype("arial.ttf", 16)
        except Exception:
            font = ImageFont.load_default()
        pil_img = Image.fromarray(img)
        draw = ImageDraw.Draw(pil_img)
        draw.text((px + 5, py + 5), plaque_text, fill=(0, 0, 0), font=font)
        img = np.array(pil_img)

        # Label plaque
        xc = (px + pw / 2) / w
        yc = (py + ph / 2) / h
        nw = pw / w
        nh = ph / h
        labels.append(f"0 {xc:.6f} {yc:.6f} {nw:.6f} {nh:.6f}")

        # 3. Compteur de vitesse (kilometrage)
        km_val = random.choice(km_values)
        kx, ky = cx + bw // 2 - 80 + random.randint(-20, 20), cy - bh // 2 + 20
        kw, kh = 70, 30
        cv2.rectangle(img, (kx, ky), (kx + kw, ky + kh), (200, 200, 255), -1)
        cv2.rectangle(img, (kx, ky), (kx + kw, ky + kh), (100, 100, 200), 1)
        pil_img = Image.fromarray(img)
        draw = ImageDraw.Draw(pil_img)
        try:
            font = ImageFont.truetype("arial.ttf", 14)
        except Exception:
            font = ImageFont.load_default()
        draw.text((kx + 3, ky + 3), f"{km_val} km", fill=(0, 0, 0), font=font)
        img = np.array(pil_img)

        # Label compteur
        xc = (kx + kw / 2) / w
        yc = (ky + kh / 2) / h
        nw = kw / w
        nh = kh / h
        labels.append(f"1 {xc:.6f} {yc:.6f} {nw:.6f} {nh:.6f}")

        # 4. Roues (simulation de pneus)
        for r_cx, r_cy in [(cx - bw // 2 + 30, cy + bh // 2 - 20),
                            (cx + bw // 2 - 30, cy + bh // 2 - 20)]:
            rr = 25
            cv2.circle(img, (r_cx, r_cy), rr, (30, 30, 30), -1)
            cv2.circle(img, (r_cx, r_cy), rr - 5, (60, 60, 60), -1)
            xc = r_cx / w
            yc = r_cy / h
            nw = rr * 2 / w
            nh = rr * 2 / h
            cls = 3 if random.random() < 0.2 else 2
            labels.append(f"{cls} {xc:.6f} {yc:.6f} {nw:.6f} {nh:.6f}")

        # 5. Phare avant
        if random.random() < 0.7:
            lx, ly = cx + bw // 2 - 10, cy - 20
            lw, lh = 20, 30
            cv2.rectangle(img, (lx, ly), (lx + lw, ly + lh), (255, 255, 200), -1)
            xc = (lx + lw / 2) / w
            yc = (ly + lh / 2) / h
            nw = lw / w
            nh = lh / h
            labels.append(f"5 {xc:.6f} {yc:.6f} {nw:.6f} {nh:.6f}")

        # Sauvegarder
        img_path = os.path.join(output_dir, folder, "images", f"synthetic_{i:04d}.png")
        lbl_path = os.path.join(output_dir, folder, "labels", f"synthetic_{i:04d}.txt")
        cv2.imwrite(img_path, img)
        with open(lbl_path, "w") as f:
            f.write("\n".join(labels))

    print(f"Dataset synthetique genere: {num_samples} echantillons")
    print(f"  Train: {train_img}")
    print(f"  Val: {val_img}")
    print(f"Classes: {len(CLASS_NAMES)}")


if __name__ == "__main__":
    generate_synthetic_dataset(50)
