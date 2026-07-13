import React, { useState, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Float } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { Truck, Cog, Circle, Battery, Fuel, Wrench, Settings, Disc } from "lucide-react";
import { soundManager } from "./SoundManager";
import { GlassCard } from "./GlassCard";

type PartKey = "engine" | "cabin" | "brakes" | "tires" | "battery" | "fuelTank";

interface PartInfo {
  key: PartKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  position: [number, number, number];
  status: "good" | "warning" | "critical";
  description: string;
  history: { date: string; action: string; status: string }[];
  documents: { name: string; date: string }[];
}

const PARTS_INFO: Record<PartKey, PartInfo> = {
  engine: {
    key: "engine",
    label: "Moteur",
    icon: <Cog className="w-5 h-5" />,
    color: "#ef4444",
    position: [0.8, 0.3, 0.5],
    status: "good",
    description: "Moteur diesel 6 cylindres - 420ch. Derniere revision: il y a 15 jours.",
    history: [
      { date: "2024-01-15", action: "Vidange huile", status: "Termine" },
      { date: "2024-01-10", action: "Filtre a air remplace", status: "Termine" },
      { date: "2023-12-20", action: "Diagnostic complet", status: "Termine" },
    ],
    documents: [
      { name: "Carnet_entretien.pdf", date: "2024-01-15" },
      { name: "Rapport_diagnostic.pdf", date: "2023-12-20" },
    ],
  },
  cabin: {
    key: "cabin",
    label: "Cabine",
    icon: <Truck className="w-5 h-5" />,
    color: "#3b82f6",
    position: [-1.2, 0.6, 0],
    status: "good",
    description: "Cabine confort. Climatisation et GPS operationnels.",
    history: [
      { date: "2024-01-05", action: "Climatisation rechargee", status: "Termine" },
    ],
    documents: [{ name: "Manuel_cabine.pdf", date: "2023-06-01" }],
  },
  brakes: {
    key: "brakes",
    label: "Freins",
    icon: <Disc className="w-5 h-5" />,
    color: "#f59e0b",
    position: [-1.5, -0.3, 1.2],
    status: "warning",
    description: "Plaquettes de frein usure 65%. Remplacement recommande sous 5000 km.",
    history: [
      { date: "2024-01-08", action: "Inspection freins", status: "Attention" },
      { date: "2023-09-15", action: "Plaquetts remplacees", status: "Termine" },
    ],
    documents: [{ name: "Rapport_freins.pdf", date: "2024-01-08" }],
  },
  tires: {
    key: "tires",
    label: "Pneus",
    icon: <Circle className="w-5 h-5" />,
    color: "#10b981",
    position: [-1.5, -0.4, -1.2],
    status: "good",
    description: "Pneus 315/80 R22.5. Usure moyenne 40%. Bon etat general.",
    history: [
      { date: "2024-01-12", action: "Controle pression", status: "OK" },
      { date: "2023-11-01", action: "Permutation pneus", status: "Termine" },
    ],
    documents: [{ name: "Fiche_pneus.pdf", date: "2024-01-12" }],
  },
  battery: {
    key: "battery",
    label: "Batterie",
    icon: <Battery className="w-5 h-5" />,
    color: "#8b5cf6",
    position: [0.5, -0.2, 1.5],
    status: "critical",
    description: "Batterie 12V - 180Ah. Tension basse detectee. Remplacement urgent.",
    history: [
      { date: "2024-01-14", action: "Test de charge", status: "Critique" },
      { date: "2023-08-01", action: "Batterie installlee", status: "Termine" },
    ],
    documents: [{ name: "Test_batterie.pdf", date: "2024-01-14" }],
  },
  fuelTank: {
    key: "fuelTank",
    label: "Reservoir",
    icon: <Fuel className="w-5 h-5" />,
    color: "#06b6d4",
    position: [-0.5, -0.3, -1.5],
    status: "good",
    description: "Reservoir 400L. Capacite 95% actuelle. Pas de fuite detectee.",
    history: [
      { date: "2024-01-10", action: "Inspection visuelle", status: "OK" },
    ],
    documents: [{ name: "Fiche_reservoir.pdf", date: "2024-01-10" }],
  },
};

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  good: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  critical: { bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-400" },
};

interface TruckPartProps {
  part: PartInfo;
  selected: PartKey | null;
  onSelect: (key: PartKey) => void;
}

const TruckPart: React.FC<TruckPartProps> = ({ part, selected, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<THREE.Mesh>(null);

  const isSel = selected === part.key;

  useFrame((state) => {
    if (ref.current) {
      const scale = isSel ? 1.15 : hovered ? 1.08 : 1;
      ref.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
      ref.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={part.position}>
      <mesh
        ref={ref}
        onClick={(e) => { e.stopPropagation(); onSelect(part.key); soundManager.click(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color={part.color}
          emissive={part.color}
          emissiveIntensity={isSel ? 0.8 : hovered ? 0.5 : 0.3}
          transparent
          opacity={0.9}
        />
      </mesh>
      {(hovered || isSel) && (
        <Html distanceFactor={4} position={[0, 0.3, 0]} center>
          <div className="px-2 py-1 glass-strong rounded-lg text-[10px] text-white whitespace-nowrap pointer-events-none">
            {part.label}
          </div>
        </Html>
      )}
      {isSel && (
        <mesh>
          <ringGeometry args={[0.2, 0.25, 32]} />
          <meshBasicMaterial color={part.color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

interface TruckModelProps {
  selected: PartKey | null;
  onSelect: (key: PartKey) => void;
  autoRotate: boolean;
}

const TruckModel: React.FC<TruckModelProps> = ({ selected, onSelect, autoRotate }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <mesh position={[-0.5, 0, 0]} castShadow>
          <boxGeometry args={[2.4, 0.9, 0.9]} />
          <meshStandardMaterial color="#2563eb" metalness={0.6} roughness={0.3} />
        </mesh>

        <mesh position={[-0.5, 0.5, 0]} castShadow>
          <boxGeometry args={[2.4, 0.08, 0.92]} />
          <meshStandardMaterial color="#1e40af" metalness={0.5} roughness={0.4} />
        </mesh>

        <mesh position={[1.1, 0.05, 0]} castShadow>
          <boxGeometry args={[1.0, 0.8, 0.85]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.25} />
        </mesh>

        <mesh position={[1.35, 0.2, 0.25]} castShadow>
          <boxGeometry args={[0.5, 0.4, 0.7]} />
          <meshStandardMaterial color="#0a0e1a" metalness={0.3} roughness={0.1} />
        </mesh>

        <mesh position={[1.35, 0.2, -0.25]} castShadow>
          <boxGeometry args={[0.5, 0.4, 0.7]} />
          <meshStandardMaterial color="#0a0e1a" metalness={0.3} roughness={0.1} />
        </mesh>

        <mesh position={[-1.3, -0.55, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 24]} />
          <meshStandardMaterial color="#0a0f18" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[-1.3, -0.55, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.22, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
        </mesh>

        <mesh position={[-1.3, -0.55, -0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 24]} />
          <meshStandardMaterial color="#0a0f18" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[-1.3, -0.55, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.22, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
        </mesh>

        <mesh position={[0.8, -0.55, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 24]} />
          <meshStandardMaterial color="#0a0f18" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0.8, -0.55, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.22, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
        </mesh>

        <mesh position={[0.8, -0.55, -0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 24]} />
          <meshStandardMaterial color="#0a0f18" metalness={0.4} roughness={0.6} />
        </mesh>
        <mesh position={[0.8, -0.55, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.22, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.5} />
        </mesh>

        {(Object.keys(PARTS_INFO) as PartKey[]).map((key) => (
          <TruckPart key={key} part={PARTS_INFO[key]} selected={selected} onSelect={onSelect} />
        ))}
      </Float>
    </group>
  );
};

interface Vehicle3DDetailProps {
  vehicle?: { immatriculation: string; marque: string; modele: string; statut: string };
  className?: string;
}

export const Vehicle3DDetail: React.FC<Vehicle3DDetailProps> = ({
  vehicle = { immatriculation: "AW-456-78", marque: "Mercedes", modele: "Actros", statut: "ACTIF" },
  className = "",
}) => {
  const [selected, setSelected] = useState<PartKey | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showDetail, setShowDetail] = useState(false);

  const part = selected ? PARTS_INFO[selected] : null;
  const statusCfg = part ? statusColors[part.status] : null;

  const handleSelect = (key: PartKey) => {
    setSelected(key);
    setShowDetail(true);
    setAutoRotate(false);
    soundManager.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GlassCard className="!p-0 overflow-hidden h-[420px] relative" hover={false}>
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
              <div className="glass-strong rounded-xl px-3 py-1.5">
                <span className="text-sm font-bold text-white">{vehicle.immatriculation}</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 ml-2">{vehicle.marque} {vehicle.modele}</span>
              </div>
              <div className="glass-strong rounded-xl px-3 py-1.5">
                <span className="text-xs text-slate-600 dark:text-slate-400">Statut: </span>
                <span className="text-xs font-semibold text-emerald-400">{vehicle.statut}</span>
              </div>
            </div>

            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setAutoRotate(!autoRotate); soundManager.tap(); }}
                className="glass-strong rounded-xl p-2 text-slate-300 hover:text-blue-400 transition-colors"
              >
                <Settings className={`w-4 h-4 ${autoRotate ? "animate-spin-slow" : ""}`} />
              </motion.button>
            </div>

            <Canvas
              camera={{ position: [4, 2, 4], fov: 45 }}
              shadows
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true }}
            >
              <Suspense fallback={null}>
                <ambientLight intensity={0.3} />
                <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
                <directionalLight position={[-5, 5, -5]} intensity={0.3} color="#3b82f6" />
                <pointLight position={[0, 3, 0]} intensity={0.5} color="#60a5fa" />

                <TruckModel selected={selected} onSelect={handleSelect} autoRotate={autoRotate} />

                <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -1.05, 0]}>
                  <planeGeometry args={[12, 12]} />
                  <meshStandardMaterial color="#0a0e1a" />
                </mesh>
              </Suspense>

              <OrbitControls
                enablePan={false}
                minDistance={3}
                maxDistance={8}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.8}
              />
            </Canvas>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 glass-strong rounded-xl px-4 py-2">
              <p className="text-[10px] text-slate-600 dark:text-slate-400 text-center">
                Cliquez sur une piece pour voir les details · Glissez pour pivoter
              </p>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white px-1">Pieces du vehicule</h3>
          {(Object.keys(PARTS_INFO) as PartKey[]).map((key, i) => {
            const p = PARTS_INFO[key];
            const sc = statusColors[p.status];
            const isSel = selected === key;
            return (
              <motion.button
                key={key}
                onClick={() => handleSelect(key)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.02, x: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${isSel ? "glass-strong border-blue-500/30" : "glass border-white/[0.04] hover:border-white/[0.08]"}`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${p.color}15`, color: p.color }}>
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.label}</p>
                  <p className={`text-[10px] ${sc.text}`}>{p.status === "good" ? "Bon etat" : p.status === "warning" ? "Attention" : "Critique"}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showDetail && part && statusCfg && (
          <motion.div
            key={part.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${part.color}15`, color: part.color }}>
                  {part.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">{part.label}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                      {part.status === "good" ? "Bon etat" : part.status === "warning" ? "Attention" : "Critique"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{part.description}</p>
                </div>
                <motion.button
                  onClick={() => { setShowDetail(false); setSelected(null); setAutoRotate(true); soundManager.tap(); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 glass rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <span className="text-lg">x</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Historique</h4>
                  <div className="space-y-2">
                    {part.history.map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-2.5 glass rounded-xl"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-200">{h.action}</p>
                          <p className="text-[10px] text-slate-500">{h.date}</p>
                        </div>
                        <span className={`text-[10px] ${h.status === "Termine" ? "text-emerald-400" : h.status === "Critique" ? "text-rose-400" : "text-amber-400"}`}>
                          {h.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Documents</h4>
                  <div className="space-y-2">
                    {part.documents.map((d, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-2.5 glass rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <span className="text-[10px] font-bold">PDF</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-200">{d.name}</p>
                          <p className="text-[10px] text-slate-500">{d.date}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
