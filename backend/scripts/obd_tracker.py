#!/usr/bin/env python3
"""
Lecture OBD-II via ELM327 Bluetooth + envoi vers backend.
Usage:
  pip install obd requests
  python obd_tracker.py --immat AA-123-BC
  python obd_tracker.py --immat AA-123-BC --simulate   # sans adaptateur
"""

import argparse
import json
import time
import random
from datetime import datetime

try:
    import requests
except ImportError:
    print("pip install requests"); raise

try:
    import obd
except ImportError:
    obd = None
    print("pip install obd (optionnel, --simulate marche sans)")

BACKEND = "http://localhost:8080/api/tracking/update"


def send(immat: str, data: dict):
    data["immatriculation"] = immat
    try:
        r = requests.post(BACKEND, json=data, timeout=5)
        r.raise_for_status()
        j = r.json()
        print(f"  OK {j.get('timestamp','')}")
    except Exception as e:
        print(f"  ERREUR envoi: {e}")


def read_real(immat: str, interval: int):
    conn = obd.OBD()
    if not conn.is_connected():
        print("ELM327 non connecte. Verifiez Bluetooth.")
        return

    print(f"Connecte ELM327. Envoi toutes les {interval}s...")
    while True:
        speed = conn.query(obd.commands.SPEED)
        rpm = conn.query(obd.commands.RPM)
        fuel = conn.query(obd.commands.FUEL_LEVEL)
        temp = conn.query(obd.commands.COOLANT_TEMP)
        dtc = conn.query(obd.commands.GET_DTC)

        data = {
            "vitesse": speed.value.to("km/h").magnitude if speed.value else 0,
            "regimeMoteur": round(rpm.value.magnitude) if rpm.value else 0,
            "niveauCarburant": round(fuel.value.magnitude, 1) if fuel.value else 0,
            "moteurAllume": (rpm.value.magnitude > 0) if rpm.value else False,
        }

        print(f"  Vitesse: {data['vitesse']} km/h | Regime: {data['regimeMoteur']} tr/min | Carburant: {data['niveauCarburant']}%")
        send(immat, data)
        time.sleep(interval)


def read_simulate(immat: str, interval: int):
    print(f"Mode SIMULATION. Envoi toutes les {interval}s...")

    # Positions au Maroc
    cities = [
        (33.5731, -7.5898), (34.0209, -6.8416),
        (31.6295, -7.9811), (35.7595, -5.8338),
    ]
    lat, lng = cities[0]
    fuel = 85.0
    km = 45000

    while True:
        lat += (random.random() - 0.5) * 0.005
        lng += (random.random() - 0.5) * 0.005
        speed = random.randint(0, 90)
        rpm = 800 + speed * 30
        fuel -= random.uniform(0, 0.5)
        if fuel < 5: fuel = 85.0
        km += random.randint(1, 3)

        data = {
            "latitude": round(lat, 6),
            "longitude": round(lng, 6),
            "vitesse": speed,
            "regimeMoteur": rpm,
            "niveauCarburant": round(max(fuel, 0), 1),
            "kilometrage": km,
            "moteurAllume": speed > 0 or random.random() > 0.3,
        }

        now = datetime.now().strftime("%H:%M:%S")
        print(f"[{now}] {speed:3d} km/h | {rpm:4d} tr/min | {data['niveauCarburant']:5.1f}% | {km} km")
        send(immat, data)
        time.sleep(interval)


def main():
    parser = argparse.ArgumentParser(description="Lecteur OBD-II -> Backend")
    parser.add_argument("--immat", default="AA-123-BC", help="Immatriculation du vehicule")
    parser.add_argument("--interval", type=int, default=10, help="Secondes entre chaque envoi")
    parser.add_argument("--simulate", action="store_true", help="Mode simulation (pas d'ELM327)")
    args = parser.parse_args()

    print(f"OBD Tracker - Vehicule: {args.immat}")
    print(f"Backend: {BACKEND}")
    print(f"Intervalle: {args.interval}s")

    if args.simulate:
        read_simulate(args.immat, args.interval)
    else:
        read_real(args.immat, args.interval)


if __name__ == "__main__":
    main()
