"""
Fine-tuning YOLOv8 pour detection de pannes vehicules.
Ce script entraine un modele YOLOv8n sur un dataset annote.

Utilisation:
  python models/train.py                    # Entrainement normal
  python models/train.py --epochs 100       # Plus d'epochs
  python models/train.py --model yolov8m.pt # Modele plus grand
  python models/train.py --synthetic        # Test avec dataset synthetique

Le modele fine-tune sera sauve dans models/runs/train/weights/best.pt
"""

import os
import sys
import argparse

# Ajouter le parent au path pour import
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from ultralytics import YOLO

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
CONFIG_PATH = os.path.join(BASE_DIR, "config.yaml")
DEFAULT_MODEL = "yolov8n.pt"
EPOCHS = 50
BATCH = 8
IMG_SIZE = 640


def train(model_name=DEFAULT_MODEL, epochs=EPOCHS, batch=BATCH, synthetic=False):
    """Lance le fine-tuning YOLOv8."""

    if synthetic:
        print("Generation du dataset synthetique...")
        from dataset import generate_synthetic_dataset
        generate_synthetic_dataset(100, DATA_DIR)

    # Verifier le dataset
    train_img = os.path.join(DATA_DIR, "train", "images")
    val_img = os.path.join(DATA_DIR, "val", "images")
    train_count = len([f for f in os.listdir(train_img) if f.endswith((".png", ".jpg", ".jpeg"))]) if os.path.isdir(train_img) else 0
    val_count = len([f for f in os.listdir(val_img) if f.endswith((".png", ".jpg", ".jpeg"))]) if os.path.isdir(val_img) else 0

    print(f"\n{'='*50}")
    print(f"Configuration d'entrainement:")
    print(f"  Modele de base: {model_name}")
    print(f"  Dataset: {DATA_DIR}")
    print(f"  Images train: {train_count}")
    print(f"  Images val: {val_count}")
    print(f"  Epochs: {epochs}")
    print(f"  Batch: {batch}")
    print(f"  Image size: {IMG_SIZE}")
    print(f"  Classes (config.yaml): {CONFIG_PATH}")
    print(f"{'='*50}\n")

    if train_count == 0:
        print("ATTENTION: Aucune image trouvee dans le dossier train!")
        print(f"  Place tes images dans: {train_img}")
        print(f"  Place les labels YOLO dans: {os.path.join(DATA_DIR, 'train', 'labels')}")
        print("\n  Format label YOLO (fichier .txt):")
        print("    <class_id> <x_center> <y_center> <width> <height>")
        print("    Ex: 0 0.5 0.5 0.2 0.05  (plaque au centre)")
        print("\n  Utilise --synthetic pour creer un dataset de test")
        return

    # Charger le modele pre-entraine
    model = YOLO(model_name)

    print(f"Chargement du modele: {model_name}")
    print(f"Entrainement sur {train_count} images...\n")

    # Lancer l'entrainement
    results = model.train(
        data=CONFIG_PATH,
        epochs=epochs,
        batch=batch,
        imgsz=IMG_SIZE,
        project=os.path.join(BASE_DIR, "runs"),
        name="train",
        exist_ok=True,
        patience=15,
        lr0=0.01,
        augment=True,
        freeze=0,
        device="cpu",
    )

    print(f"\n{'='*50}")
    print(f"Entrainement termine!")
    best_weights = os.path.join(BASE_DIR, "runs", "train", "weights", "best.pt")
    if os.path.exists(best_weights):
        print(f"Modele final: {best_weights}")
    print(f"{'='*50}")

    return results


def export_onnx():
    """Exporte le modele entraine en ONNX pour inference plus rapide."""
    best = os.path.join(BASE_DIR, "runs", "train", "weights", "best.pt")
    if not os.path.exists(best):
        print(f"Modele non trouve: {best}")
        print("Entraine d'abord avec: python models/train.py")
        return

    model = YOLO(best)
    model.export(format="onnx", imgsz=IMG_SIZE)
    print(f"Modele exporte: {best.replace('.pt', '.onnx')}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tuning YOLOv8 pour pannes vehicules")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Modele de base")
    parser.add_argument("--epochs", type=int, default=EPOCHS, help="Nombre d'epochs")
    parser.add_argument("--batch", type=int, default=BATCH, help="Taille du batch")
    parser.add_argument("--synthetic", action="store_true", help="Utiliser dataset synthetique")
    parser.add_argument("--export-onnx", action="store_true", help="Exporter en ONNX apres entrainement")
    args = parser.parse_args()

    train(args.model, args.epochs, args.batch, args.synthetic)

    if args.export_onnx:
        export_onnx()
