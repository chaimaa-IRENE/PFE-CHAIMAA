/**
 * Génère des données tracking réalistes pour les 3 véhicules suivis.
 * Poste vers /api/tracking/update puis /api/vehicules pour mettre à jour
 * les positions et kilométrages.
 */
const http = require("http");

const BASE = "http://localhost:8080";
const VEHICULES = [
  { immat: "AA-123-BC", chauffeur: "Youssef Amrani", kmBase: 45000, consoL100: 9.5 },
  { immat: "FF-678-LM", chauffeur: "Karim Bennani",   kmBase: 42000, consoL100: 8.0 },
  { immat: "GG-901-NO", chauffeur: "Omar Tazi",        kmBase: 67000, consoL100: 10.5 },
];

// Positions marocaines réalistes (Casablanca, Rabat, Marrakech, Tanger)
const ROUTES = [
  { lat: 33.5731, lng: -7.5898, ville: "Casablanca" },
  { lat: 34.0209, lng: -6.8416, ville: "Rabat" },
  { lat: 31.6295, lng: -7.9811, ville: "Marrakech" },
  { lat: 35.7595, lng: -5.8338, ville: "Tanger" },
  { lat: 33.8869, lng: -5.5484, ville: "Meknès" },
  { lat: 34.2550, lng: -6.5825, ville: "Kénitra" },
  { lat: 33.0085, lng: -6.0789, ville: "Khouribga" },
  { lat: 30.4278, lng: -9.5831, ville: "Agadir" },
];

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const url = new URL(BASE + path);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        let r = "";
        res.on("data", (c) => (r += c));
        res.on("end", () => resolve(r));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function put(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const url = new URL(BASE + path);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "PUT",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        let r = "";
        res.on("data", (c) => (r += c));
        res.on("end", () => resolve(r));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

async function generateForVehicle(v) {
  console.log(`\n=== Génération données pour ${v.immat} (${v.chauffeur}) ===`);

  let currentKm = v.kmBase;
  let currentCity = Math.floor(Math.random() * ROUTES.length);

  // Générer 30 jours de données (1 trajet par jour avec 3-5 points)
  for (let day = 0; day < 30; day++) {
    const date = new Date();
    date.setDate(date.getDate() - (29 - day));
    date.setHours(8 + Math.floor(Math.random() * 10)); // entre 8h et 18h
    date.setMinutes(Math.floor(Math.random() * 60));

    // Distance du jour: 30-120 km
    const dayKm = randomBetween(30, 120);
    const pointsPerDay = 3 + Math.floor(Math.random() * 3); // 3-5 points

    for (let p = 0; p < pointsPerDay; p++) {
      const pointDate = new Date(date);
      pointDate.setMinutes(pointDate.getMinutes() + p * 15);

      // Position se déplace progressivement
      const targetCity = (currentCity + 1 + Math.floor(Math.random() * 2)) % ROUTES.length;
      const progress = (p + 1) / pointsPerDay;
      const lat = ROUTES[currentCity].lat + (ROUTES[targetCity].lat - ROUTES[currentCity].lat) * progress + randomBetween(-0.02, 0.02);
      const lng = ROUTES[currentCity].lng + (ROUTES[targetCity].lng - ROUTES[currentCity].lng) * progress + randomBetween(-0.02, 0.02);

      // Vitesse réaliste: 20-90 km/h (mix ville + route)
      const speed = Math.round(randomBetween(20, 90));

      // Carburant: baisse progressive
      const fuel = Math.max(5, 85 - (day * 2.5 + p * 0.8));

      // Kilométrage
      currentKm += Math.round(dayKm / pointsPerDay);

      const trackingData = {
        immatriculation: v.immat,
        latitude: Math.round(lat * 1000000) / 1000000,
        longitude: Math.round(lng * 1000000) / 1000000,
        vitesse: speed,
        niveauCarburant: Math.round(fuel * 10) / 10,
        kilometrage: currentKm,
        moteurAllume: speed > 0 || Math.random() > 0.3,
        timestamp: pointDate.toISOString(),
      };

      try {
        await post("/api/tracking/update", trackingData);
        process.stdout.write(".");
      } catch (e) {
        process.stdout.write("x");
      }

      await sleep(5);
    }

    currentCity = (currentCity + 1 + Math.floor(Math.random() * 2)) % ROUTES.length;
  }

  // Mettre à jour la position actuelle sur le véhicule
  const lastPos = ROUTES[currentCity];
  try {
    await post("/api/tracking/update", {
      immatriculation: v.immat,
      latitude: lastPos.lat + randomBetween(-0.01, 0.01),
      longitude: lastPos.lng + randomBetween(-0.01, 0.01),
      vitesse: Math.round(randomBetween(0, 60)),
      niveauCarburant: Math.round(randomBetween(15, 45) * 10) / 10,
      kilometrage: currentKm,
      moteurAllume: true,
    });
    console.log(`\n✅ ${v.immat}: ${currentKm} km, position mise à jour`);
  } catch (e) {
    console.log(`\n❌ ${v.immat}: erreur position - ${e.message}`);
  }
}

async function main() {
  console.log("=== GÉNÉRATEUR DONNÉES TRACKING RÉALISTES ===");
  console.log(`Vehicles: ${VEHICULES.map((v) => v.immat).join(", ")}`);
  console.log(`Route: ${ROUTES.map((r) => r.ville).join(" → ")}`);
  console.log("Début génération...\n");

  for (const v of VEHICULES) {
    await generateForVehicle(v);
    await sleep(100);
  }

  console.log("\n=== GÉNÉRATION TERMINÉE ===");
  console.log("Redémarrez le backend pour que les analytics soient recalculés.");
}

main().catch(console.error);
