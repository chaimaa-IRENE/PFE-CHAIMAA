#!/usr/bin/env python3
"""
ETL MyGeotab -> Power BI
Usage:
  python geotab_powerbi.py --simulate --output ./powerbi_data
  python geotab_powerbi.py --username user --password pass --database mydb --output ./powerbi_data
"""

import argparse
import csv
import json
import os
import random
import sys
from datetime import datetime, timedelta
from typing import Any, Optional

try:
    import requests
except ImportError:
    print("pip install requests"); sys.exit(1)

GEOTAB_API = "https://my.geotab.com/api/v1"
SESSION: dict[str, Any] = {}


# ── 1. AUTH ──────────────────────────────────────────────────────────────
def authenticate(username: str, password: str, database: str) -> bool:
    body = {
        "method": "Authenticate",
        "params": {"database": database, "userName": username, "password": password},
        "id": 1, "jsonrpc": "2.0"
    }
    r = requests.post(GEOTAB_API, json=body, timeout=30)
    res = r.json()
    if "error" in res:
        print(f"Auth error: {res['error']}"); return False
    creds = res["result"]["credentials"]
    SESSION["sessionId"] = creds["sessionId"]
    SESSION["server"] = res["result"].get("path", GEOTAB_API)
    SESSION["username"] = username
    SESSION["database"] = database
    return True


def call(method: str, params: dict) -> Optional[dict]:
    sid = SESSION.get("sessionId")
    if not sid:
        return None
    params["credentials"] = {
        "sessionId": sid,
        "userName": SESSION["username"],
        "database": SESSION["database"]
    }
    body = {"method": method, "params": params, "id": int(datetime.now().timestamp() * 1000), "jsonrpc": "2.0"}
    r = requests.post(SESSION.get("server", GEOTAB_API), json=body, timeout=60)
    return r.json()


# ── 2. EXTRACT ───────────────────────────────────────────────────────────
def get_devices() -> list[dict]:
    res = call("Get", {"typeName": "Device"})
    return res.get("result", []) if res else []


def get_status_data(device_id: str, type_name: str, from_ts: int, to_ts: int) -> list[dict]:
    res = call("Get", {
        "typeName": "StatusData",
        "search": {
            "deviceSearch": {"id": device_id},
            "fromDate": from_ts,
            "toDate": to_ts,
            "typeSearch": { "id": type_name }
        }
    })
    return res.get("result", []) if res else []


def get_fault_data(device_id: str, from_ts: int, to_ts: int) -> list[dict]:
    res = call("Get", {
        "typeName": "FaultData",
        "search": {
            "deviceSearch": {"id": device_id},
            "fromDate": from_ts,
            "toDate": to_ts
        }
    })
    return res.get("result", []) if res else []


def get_trips(device_id: str, from_ts: int, to_ts: int) -> list[dict]:
    res = call("Get", {
        "typeName": "Trip",
        "search": {
            "deviceSearch": {"id": device_id},
            "fromDate": from_ts,
            "toDate": to_ts
        }
    })
    return res.get("result", []) if res else []


def extract_all(username: str, password: str, database: str,
                from_date: str, to_date: str) -> dict[str, list]:
    if not authenticate(username, password, database):
        return {}
    from_ts = int(datetime.fromisoformat(from_date).timestamp())
    to_ts = int(datetime.fromisoformat(to_date).timestamp())
    devices = get_devices()
    print(f"Devices found: {len(devices)}")
    out: dict[str, list] = {"devices": devices, "odometer": [], "fuel": [], "idling": [], "faults": [], "trips": []}
    for d in devices:
        did = d["id"]
        print(f"  Fetching {d.get('name', did)}...")
        out["odometer"].extend(get_status_data(did, "Odometer", from_ts, to_ts))
        out["fuel"].extend(get_status_data(did, "FuelUsed", from_ts, to_ts))
        out["idling"].extend(get_status_data(did, "EngineIdling", from_ts, to_ts))
        out["faults"].extend(get_fault_data(did, from_ts, to_ts))
        out["trips"].extend(get_trips(did, from_ts, to_ts))
    print(f"  Odometer: {len(out['odometer'])} | Fuel: {len(out['fuel'])} | Idling: {len(out['idling'])}")
    print(f"  Faults: {len(out['faults'])} | Trips: {len(out['trips'])}")
    return out


# ── 3. SIMULATE (for testing without real API) ──────────────────────────
MOROCCO_CITIES = [
    ("Casablanca", 33.5731, -7.5898), ("Rabat", 34.0209, -6.8416),
    ("Marrakech", 31.6295, -7.9811), ("Tanger", 35.7595, -5.8338),
    ("Fes", 34.0333, -5.0000), ("Agadir", 30.4167, -9.6000),
]

def simulate(from_date: str, to_date: str) -> dict[str, list]:
    from_dt = datetime.fromisoformat(from_date)
    to_dt = datetime.fromisoformat(to_date)
    vehicles_data = [
        {"id": "sim_001", "name": "AA-123-BC", "serial": "SN1001", "vin": "WDB123...",
         "marque": "Mercedes", "modele": "Actros", "annee": 2021, "carburant": "Diesel", "chauffeur": "Hassan Alaoui"},
        {"id": "sim_002", "name": "BB-456-CD", "serial": "SN1002", "vin": "VF611...",
         "marque": "Renault", "modele": "Truck", "annee": 2022, "carburant": "Diesel", "chauffeur": "Mohammed El Fassi"},
        {"id": "sim_003", "name": "CC-789-EF", "serial": "SN1003", "vin": "YV2J...",
         "marque": "Volvo", "modele": "FH", "annee": 2020, "carburant": "Diesel", "chauffeur": "Karim Benani"},
        {"id": "sim_004", "name": "DD-012-GH", "serial": "SN1004", "vin": "XLA...",
         "marque": "DAF", "modele": "XF", "annee": 2023, "carburant": "Diesel", "chauffeur": "Youssef El Amrani"},
        {"id": "sim_005", "name": "EE-345-IJ", "serial": "SN1005", "vin": "YS2K...",
         "marque": "Scania", "modele": "R500", "annee": 2019, "carburant": "Diesel", "chauffeur": "Rachid Lahlou"},
    ]
    devices = []
    odometer_data = []
    fuel_data = []
    idling_data = []
    faults_data = []
    trips_data = []

    for v in vehicles_data:
        km_base = random.randint(50000, 300000)
        devices.append({"id": v["id"], "name": v["name"], "serialNumber": v["serial"],
                        "vehicleIdentificationNumber": v["vin"],
                        "marque": v["marque"], "modele": v["modele"],
                        "annee": v["annee"], "carburant": v["carburant"],
                        "chauffeur": v["chauffeur"]})
        dt = from_dt
        while dt <= to_dt:
            ts = int(dt.timestamp())
            odometer_data.append({
                "dateTime": ts, "data": str(km_base + (dt - from_dt).days * random.randint(50, 300)),
                "device": {"id": v["id"]}
            })
            fuel_data.append({
                "dateTime": ts, "data": str(round(random.uniform(10, 60), 2)),
                "device": {"id": v["id"]}
            })
            idling_data.append({
                "dateTime": ts, "data": str(random.randint(0, 3600)),
                "device": {"id": v["id"]}
            })
            dt += timedelta(days=random.choice([1, 3, 7]))
        # faults
        for _ in range(random.randint(0, 5)):
            fdt = from_dt + timedelta(days=(to_dt - from_dt).days * random.random())
            faults_data.append({
                "dateTime": int(fdt.timestamp()),
                "device": {"id": v["id"]},
                "diagnostic": {"id": f"diag_{random.randint(1,10)}", "name": random.choice([
                    "P001 - Pression huile basse", "P002 - Surchauffe moteur",
                    "P003 - Capteur ABS", "P004 - Filtre a gazole colmate",
                    "P010 - Vanne EGR", "P020 - Injecteur defaillant"
                ])},
                "failureMode": {"name": random.choice(["CRITIQUE", "HAUTE", "MOYENNE", "BASSE"])},
                "count": random.randint(1, 50)
            })
        for _ in range(random.randint(2, 10)):
            tdt = from_dt + timedelta(days=(to_dt - from_dt).days * random.random())
            start_ci = random.choice(MOROCCO_CITIES)
            end_ci = random.choice([c for c in MOROCCO_CITIES if c != start_ci])
            trips_data.append({
                "dateTime": int(tdt.timestamp()),
                "device": {"id": v["id"]},
                "averageSpeed": random.uniform(40, 90),
                "maximumSpeed": random.uniform(80, 120),
                "distance": random.uniform(50, 800),
                "idlingDuration": random.randint(0, 1800),
                "fuelUsed": random.uniform(10, 150),
                "start": {"latitude": start_ci[1], "longitude": start_ci[2]},
                "stop": {"latitude": end_ci[1], "longitude": end_ci[2]},
                "fromAddress": start_ci[0], "toAddress": end_ci[0]
            })

    return {
        "devices": devices,
        "odometer": odometer_data,
        "fuel": fuel_data,
        "idling": idling_data,
        "faults": faults_data,
        "trips": trips_data
    }


# ── 4. TRANSFORM ─────────────────────────────────────────────────────────
def safe_float(v) -> float:
    try: return float(v)
    except: return 0.0


def ts_to_iso(ts) -> str:
    if isinstance(ts, (int, float)):
        return datetime.utcfromtimestamp(ts).isoformat() if ts > 1e9 else datetime.utcfromtimestamp(ts * 86400).isoformat()
    return str(ts)


def transform(extracted: dict[str, list]) -> dict[str, list]:
    device_map = {}
    for d in extracted.get("devices", []):
        did = d["id"] if isinstance(d, dict) else None
        device_map[did] = d.get("name", did)

    vehicles_csv = []
    for d in extracted.get("devices", []):
        vehicles_csv.append({
            "geotab_id": d.get("id", ""),
            "immatriculation": d.get("name", ""),
            "serial": d.get("serialNumber", ""),
            "vin": d.get("vehicleIdentificationNumber", ""),
            "marque": d.get("marque", ""),
            "modele": d.get("modele", ""),
            "annee": d.get("annee", ""),
            "carburant": d.get("carburant", ""),
            "chauffeur": d.get("chauffeur", ""),
        })

    # Weekly aggregated odometer / fuel / idling
    ivms_csv = []
    for key in ("odometer", "fuel", "idling"):
        for row in extracted.get(key, []):
            did = row.get("device", {}).get("id", "")
            dt_iso = ts_to_iso(row.get("dateTime"))
            name = "Kilometrage" if key == "odometer" else ("Consommation" if key == "fuel" else "Ralenti")
            ivms_csv.append({
                "DateHeure": dt_iso,
                "Vehicule": device_map.get(did, did),
                "Type": name,
                "Valeur": safe_float(row.get("data", 0)),
                "Unite": "km" if key == "odometer" else "L" if key == "fuel" else "secondes"
            })

    # Alerts from fault data
    alerts_csv = []
    for row in extracted.get("faults", []):
        did = row.get("device", {}).get("id", "")
        severity = row.get("failureMode", {}).get("name", "MOYENNE")
        alerts_csv.append({
            "DateHeure": ts_to_iso(row.get("dateTime")),
            "Vehicule": device_map.get(did, did),
            "CodeDefaut": row.get("diagnostic", {}).get("id", ""),
            "Description": row.get("diagnostic", {}).get("name", ""),
            "Criticite": "Critique" if severity in ("CRITIQUE", "HAUTE") else ("Majeure" if severity == "MOYENNE" else "Mineure"),
            "Severite": severity,
            "Compteur": row.get("count", 1)
        })

    trips_csv = []
    for row in extracted.get("trips", []):
        did = row.get("device", {}).get("id", "")
        dist = safe_float(row.get("distance", 0))
        fuel = safe_float(row.get("fuelUsed", 0))
        conso = (fuel / dist * 100) if dist > 0 else 0
        trips_csv.append({
            "DateHeure": ts_to_iso(row.get("dateTime")),
            "Vehicule": device_map.get(did, did),
            "Distance_km": round(dist, 1),
            "Carburant_L": round(fuel, 1),
            "Conso_L100km": round(conso, 1),
            "VitesseMoyenne": round(safe_float(row.get("averageSpeed", 0)), 1),
            "VitesseMax": round(safe_float(row.get("maximumSpeed", 0)), 1),
            "Ralenti_s": row.get("idlingDuration", 0),
            "Depart": row.get("fromAddress", ""),
            "Arrivee": row.get("toAddress", "")
        })

    # Drivers summary
    drivers_csv = []
    chauffeurs_seen = set()
    for d in extracted.get("devices", []):
        chauffeur = d.get("chauffeur", "")
        if chauffeur and chauffeur not in chauffeurs_seen:
            chauffeurs_seen.add(chauffeur)
            trips_v = [t for t in trips_csv if t["Vehicule"] == d.get("name", "")]
            alerts_v = [a for a in alerts_csv if a["Vehicule"] == d.get("name", "")]
            total_conso = sum(t["Carburant_L"] for t in trips_v)
            total_km = sum(t["Distance_km"] for t in trips_v)
            nb_alerts = len(alerts_v)
            drivers_csv.append({
                "Nom": chauffeur,
                "Vehicule": d.get("name", ""),
                "TotalKm": round(total_km, 1),
                "TotalConso": round(total_conso, 1),
                "NbAlertes": nb_alerts,
                "ScoreConduite": round((total_km / (total_conso + 1)) - nb_alerts, 1),
            })

    # Maintenance events (mock)
    maint_csv = []
    for d in extracted.get("devices", []):
        for _ in range(random.randint(0, 3)):
            dt = datetime.now() - timedelta(days=random.randint(0, 180))
            maint_csv.append({
                "Date": dt.isoformat(),
                "Vehicule": d.get("name", ""),
                "Type": random.choice(["Vidange", "Freins", "Pneumatiques", "Revision", "Embrayage", "Moteur"]),
                "Cout": round(random.uniform(200, 5000), 2),
                "KmVehicule": random.randint(50000, 300000)
            })

    return {
        "vehicles": vehicles_csv,
        "drivers": drivers_csv,
        "ivms_status": ivms_csv,
        "ivms_alerts": alerts_csv,
        "trips": trips_csv,
        "maintenance_events": maint_csv
    }


# ── 5. LOAD (CSV) ────────────────────────────────────────────────────────
TABLE_HEADERS = {
    "vehicles": ["geotab_id", "immatriculation", "serial", "vin", "marque", "modele", "annee", "carburant", "chauffeur"],
    "drivers": ["Nom", "Vehicule", "TotalKm", "TotalConso", "NbAlertes", "ScoreConduite"],
    "trips": ["DateHeure", "Vehicule", "Distance_km", "Carburant_L", "Conso_L100km",
              "VitesseMoyenne", "VitesseMax", "Ralenti_s", "Depart", "Arrivee"],
    "ivms_status": ["DateHeure", "Vehicule", "Type", "Valeur", "Unite"],
    "ivms_alerts": ["DateHeure", "Vehicule", "CodeDefaut", "Description", "Criticite", "Severite", "Compteur"],
    "maintenance_events": ["Date", "Vehicule", "Type", "Cout", "KmVehicule"],
}


def load_csv(data: dict[str, list], output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    for table, rows in data.items():
        headers = TABLE_HEADERS.get(table, [])
        path = os.path.join(output_dir, f"{table}.csv")
        with open(path, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=headers)
            w.writeheader()
            w.writerows(rows)
        print(f"  {path} — {len(rows)} rows")


# ── 6. POWER QUERY (M) ──────────────────────────────────────────────────
POWER_QUERY_TEMPLATE = '''// Power Query M - Power BI DirectQuery / Import
// Use: Home > Get Data > Blank Query > Advanced Editor
let
    CsvFile = (name) => Csv.Document(
        File.Contents("C:\\\\YourPath\\\\powerbi_data\\\\" & name & ".csv"),
        [Delimiter=",", Encoding=65001, QuoteStyle=QuoteStyle.Csv]
    ),
    Vehicles = Table.PromoteHeaders(CsvFile("vehicles"), [PromoteAllScalars=true]),
    Drivers  = Table.PromoteHeaders(CsvFile("drivers"),  [PromoteAllScalars=true]),
    Trips    = Table.PromoteHeaders(CsvFile("trips"),    [PromoteAllScalars=true]),
    Status   = Table.PromoteHeaders(CsvFile("ivms_status"), [PromoteAllScalars=true]),
    Alerts   = Table.PromoteHeaders(CsvFile("ivms_alerts"), [PromoteAllScalars=true]),
    Maint    = Table.PromoteHeaders(CsvFile("maintenance_events"), [PromoteAllScalars=true]),
    KPI      = Table.PromoteHeaders(CsvFile("kpi_vehicules"), [PromoteAllScalars=true])
in
    KPI
'''

# ── 7. KPI CALCULATIONS ─────────────────────────────────────────────────
def compute_kpis(trips_csv: list[dict], alerts_csv: list[dict]) -> dict:
    # Aggregate per vehicle
    vehicles_kpi = {}
    for t in trips_csv:
        v = t["Vehicule"]
        if v not in vehicles_kpi:
            vehicles_kpi[v] = {"km": 0, "conso": 0, "ralenti": 0, "trips": 0}
        vehicles_kpi[v]["km"] += t["Distance_km"]
        vehicles_kpi[v]["conso"] += t["Carburant_L"]
        vehicles_kpi[v]["ralenti"] += t["Ralenti_s"]
        vehicles_kpi[v]["trips"] += 1
    for a in alerts_csv:
        v = a["Vehicule"]
        if v not in vehicles_kpi:
            continue
        if "critique_count" not in vehicles_kpi[v]:
            vehicles_kpi[v]["critique_count"] = 0
        if a["Criticite"] == "Critique":
            vehicles_kpi[v]["critique_count"] += 1

    kpi_rows = []
    for v, d in vehicles_kpi.items():
        km = d["km"]
        conso = d["conso"] or 1
        score = round((km / conso) - d.get("critique_count", 0), 1)
        conso_100 = round(conso / (km / 100), 1) if km > 0 else 0
        ralenti_pct = round(d["ralenti"] / (km * 3600 / 80) * 100, 1) if km > 0 else 0
        # Criticality
        if d.get("critique_count", 0) >= 3 or conso_100 > 50 or ralenti_pct > 30:
            criticite = "Critique"
            causes = []
            if conso_100 > 50: causes.append("Surconsommation")
            if ralenti_pct > 30: causes.append(f"Ralenti eleve ({ralenti_pct}%)")
            if d.get("critique_count", 0) >= 3: causes.append(f"{d['critique_count']} alertes critiques")
        elif conso_100 > 35 or ralenti_pct > 15 or d.get("critique_count", 0) >= 1:
            criticite = "Majeure"
            causes = []
            if conso_100 > 35: causes.append(f"Consommation elevee ({conso_100} L/100km)")
            if ralenti_pct > 15: causes.append(f"Ralenti excessif ({ralenti_pct}%)")
            if d.get("critique_count", 0) >= 1: causes.append(f"{d['critique_count']} alertes critiques")
        else:
            criticite = "Mineure"
            causes = ["Aucune anomalie significative"]

        kpi_rows.append({
            "Vehicule": v,
            "KmTotal": round(km, 1),
            "Consommation_L100km": conso_100,
            "Ralenti_Pct": ralenti_pct,
            "Ralenti_Total_h": round(d["ralenti"] / 3600, 1),
            "NbTrips": d["trips"],
            "AlertesCritiques": d.get("critique_count", 0),
            "ScoreConduite": score,
            "Criticite": criticite,
            "CausesEvaluation": "; ".join(causes)
        })
    return kpi_rows


# ── 8. MAIN ──────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="ETL MyGeotab -> Power BI")
    parser.add_argument("--username", help="MyGeotab username")
    parser.add_argument("--password", help="MyGeotab password")
    parser.add_argument("--database", help="MyGeotab database name")
    parser.add_argument("--from-date", default="2026-01-01", help="Start date (ISO)")
    parser.add_argument("--to-date", default="2026-06-30", help="End date (ISO)")
    parser.add_argument("--output", default="./powerbi_data", help="Output CSV directory")
    parser.add_argument("--simulate", action="store_true", help="Use simulated data (no API)")
    parser.add_argument("--kpi", action="store_true", help="Also compute KPI summary")
    args = parser.parse_args()

    print("=" * 50)
    print("MyGeotab -> Power BI ETL")
    print("=" * 50)

    # 1. Extract
    if args.simulate:
        print("\n[Extract] Using SIMULATED data")
        raw = simulate(args.from_date, args.to_date)
    else:
        if not all([args.username, args.password, args.database]):
            print("Error: --username, --password, --database required (or use --simulate)")
            sys.exit(1)
        print(f"\n[Extract] MyGeotab API: {args.username}@{args.database}")
        raw = extract_all(args.username, args.password, args.database, args.from_date, args.to_date)

    if not raw:
        print("No data extracted. Abort."); sys.exit(1)

    # 2. Transform
    print("\n[Transform]...")
    tables = transform(raw)

    # 3. Load CSV
    print(f"\n[Load] CSV -> {args.output}")
    load_csv(tables, args.output)

    # 4. KPI summary
    if args.kpi:
        print("\n[KPI] Computing...")
        kpi_rows = compute_kpis(tables["trips"], tables["ivms_alerts"])
        kpi_path = os.path.join(args.output, "kpi_vehicules.csv")
        with open(kpi_path, "w", newline="", encoding="utf-8-sig") as f:
            headers = ["Vehicule", "KmTotal", "Consommation_L100km", "Ralenti_Pct",
                       "Ralenti_Total_h", "NbTrips", "AlertesCritiques", "ScoreConduite",
                       "Criticite", "CausesEvaluation"]
            w = csv.DictWriter(f, fieldnames=headers)
            w.writeheader()
            w.writerows(kpi_rows)
        print(f"  {kpi_path} — {len(kpi_rows)} rows")
        print("\nEvaluation par vehicule:")
        for k in kpi_rows:
            print(f"  {k['Vehicule']:15s} | Score: {k['ScoreConduite']:6.1f} | {k['Criticite']:8s} | Causes: {k['CausesEvaluation']}")

    # 5. Power Query M
    pq_path = os.path.join(args.output, "power_query_m.txt")
    with open(pq_path, "w", encoding="utf-8") as f:
        f.write(POWER_QUERY_TEMPLATE)
    print(f"\n[Power Query] Template -> {pq_path}")
    print("\nDone! Import the CSVs into Power BI (Get Data > Text/CSV)")
    print(f"   Or use the Power Query M code in: {pq_path}")


if __name__ == "__main__":
    main()
