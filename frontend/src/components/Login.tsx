import React, { useState, useRef, useCallback, useEffect, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { User } from "../types/incident";
import { userService } from "../services/userService";
import { soundManager } from "../lib/premium/SoundManager";
import confetti from "canvas-confetti";
import "./Login.css";

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onForgotPassword: () => void;
}

type LoginPhase = "intro" | "form" | "driving" | "transition" | "error";
type LockState = "locked" | "recognizing" | "unlocked" | "failed";

const Truck3DModel: React.FC<{ autoRotate?: boolean; driving?: boolean }> = ({ autoRotate = true, driving = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const wheelFL = useRef<THREE.Mesh>(null);
  const wheelFR = useRef<THREE.Mesh>(null);
  const wheelRL = useRef<THREE.Mesh>(null);
  const wheelRR = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) groupRef.current.rotation.y += delta * 0.3;
    const ws = driving ? delta * 12 : delta * 1.5;
    [wheelFL, wheelFR, wheelRL, wheelRR].forEach((w) => { if (w.current) w.current.rotation.x += ws; });
  });

  return (
    <group ref={groupRef} rotation={[0, -0.3, 0]} position={[0, 0.2, 0]}>
      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25}>
        <mesh position={[-0.5, 0, 0]} castShadow>
          <boxGeometry args={[2.4, 0.9, 0.9]} />
          <meshStandardMaterial color="#2563eb" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[-0.5, 0.5, 0]} castShadow>
          <boxGeometry args={[2.4, 0.06, 0.92]} />
          <meshStandardMaterial color="#1d4ed8" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[1.1, 0.05, 0]} castShadow>
          <boxGeometry args={[1.0, 0.8, 0.85]} />
          <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[1.35, 0.2, 0.25]} castShadow>
          <boxGeometry args={[0.5, 0.4, 0.7]} />
          <meshStandardMaterial color="#05070D" metalness={0.3} roughness={0.1} />
        </mesh>
        <mesh position={[1.35, 0.2, -0.25]} castShadow>
          <boxGeometry args={[0.5, 0.4, 0.7]} />
          <meshStandardMaterial color="#05070D" metalness={0.3} roughness={0.1} />
        </mesh>
        <mesh position={[1.45, 0.05, 0]}>
          <boxGeometry args={[0.08, 0.14, 0.5]} />
          <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[-0.2, 0.3, 0.46]}>
          <planeGeometry args={[0.8, 0.3]} />
          <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.15} transparent opacity={0.8} />
        </mesh>
        {[
          { ref: wheelFL, pos: [-1.3, -0.55, 0.6] as [number, number, number] },
          { ref: wheelFR, pos: [-1.3, -0.55, -0.6] as [number, number, number] },
          { ref: wheelRL, pos: [0.8, -0.55, 0.6] as [number, number, number] },
          { ref: wheelRR, pos: [0.8, -0.55, -0.6] as [number, number, number] },
        ].map((w, i) => (
          <mesh key={i} ref={w.ref} position={w.pos} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 24]} />
            <meshStandardMaterial color="#05070D" metalness={0.4} roughness={0.6} />
          </mesh>
        ))}
      </Float>
    </group>
  );
};

const Truck3DCanvas: React.FC<{ driving?: boolean; autoRotate?: boolean }> = ({ driving, autoRotate }) => (
  <Canvas camera={{ position: [4, 2.5, 4], fov: 40 }} shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }} frameloop="demand">
    <Suspense fallback={null}>
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.2} color="#3b82f6" />
      <pointLight position={[0, 3, 0]} intensity={0.4} color="#60a5fa" />
      <Truck3DModel autoRotate={autoRotate} driving={driving} />
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.95, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#0a0e1a" />
      </mesh>
    </Suspense>
  </Canvas>
);

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onForgotPassword }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<LoginPhase>("intro");
  const [lockState, setLockState] = useState<LockState>("locked");
  const [faceResult, setFaceResult] = useState<"idle" | "scanning" | "success" | "fail">("idle");
  const [hasFace, setHasFace] = useState(false);
  const [faceIdReady, setFaceIdReady] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [showFaceId, setShowFaceId] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const t = setTimeout(() => { setPhase("form"); soundManager.swoosh(); }, 400);
    return () => clearTimeout(t);
  }, []);

  const isCheckingFace = useRef(false);
  useEffect(() => {
    if (username.trim() && !isCheckingFace.current) {
      isCheckingFace.current = true;
      userService.checkFaceRegistered(username.trim()).then((r: boolean) => { setHasFace(r); isCheckingFace.current = false; });
    } else if (!username.trim()) { setHasFace(false); setFaceIdReady(false); }
  }, [username]);

  useEffect(() => {
    if (hasFace && phase === "form" && username.trim() && !faceIdReady) setFaceIdReady(true);
    if (!hasFace) setFaceIdReady(false);
  }, [hasFace, phase, username, faceIdReady]);

  const stopCamera = useCallback(() => { if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; } }, []);
  const startCamera = useCallback(async (): Promise<boolean> => {
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } }); streamRef.current = stream; return true; } catch { return false; }
  }, []);
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const v = videoRef.current, c = canvasRef.current;
    if (v.videoWidth === 0) return null;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    return c.toDataURL("image/jpeg", 0.8);
  }, []);

  const fireConfetti = useCallback(() => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#2563eb", "#3b82f6", "#60a5fa", "#10b981", "#fbbf24"], disableForReducedMotion: true, scalar: 0.8, gravity: 0.8, ticks: 200 });
  }, []);

  const goToDashboard = useCallback((user: User) => {
    setPhase("driving"); soundManager.swoosh();
    setTimeout(() => { setPhase("transition"); fireConfetti(); soundManager.success(); }, 2000);
    setTimeout(() => { onLoginSuccess(user); }, 3500);
  }, [onLoginSuccess, fireConfetti]);

  const handlePasswordLogin = async (u: string, p: string) => {
    setLoading(true); setError("");
    try {
      const user = await userService.authenticate(u, p);
      setPendingUser(user);
      if (!user.faceRegistered) { setShowRegisterPrompt(true); setLoading(false); }
      else { setLoading(false); goToDashboard(user); }
    } catch (err: any) {
      soundManager.error();
      if (err?.response?.status === 401) setError("Identifiants incorrects");
      else if (err?.response?.status === 400) setError("Requête invalide");
      else if (err?.response?.status === 500) setError("Erreur serveur");
      else if (err?.request && !err?.response) setError("Serveur backend injoignable");
      else setError("Erreur: " + (err?.message || "inconnue"));
      setPhase("error"); setLoading(false);
      setTimeout(() => setPhase("form"), 2500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError("Tous les champs sont requis"); return; }
    soundManager.click(); handlePasswordLogin(username.trim(), password);
  };

  const doFaceScan = useCallback((forRegister: boolean) => {
    setLockState("recognizing"); setFaceResult("scanning");
    const frame = captureFrame();
    if (!frame) { setShowFaceId(false); return; }
    stopCamera();
    if (forRegister && pendingUser) {
      userService.registerFace(pendingUser.id, frame).then((success: boolean) => {
        if (success) { setLockState("unlocked"); setFaceResult("success"); soundManager.success(); setTimeout(() => goToDashboard(pendingUser), 800); }
        else { setLockState("failed"); setFaceResult("fail"); soundManager.error(); setError("Échec enregistrement visage"); setTimeout(() => { setShowRegisterPrompt(true); setFaceResult("idle"); }, 1500); }
      });
    } else {
      userService.faceLogin(username.trim(), frame).then((result: { user: User | null }) => {
        if (result.user) { setLockState("unlocked"); setFaceResult("success"); soundManager.success(); setTimeout(() => goToDashboard(result.user!), 800); }
        else { setLockState("failed"); setFaceResult("fail"); soundManager.error(); setError("Face ID non reconnu"); setTimeout(() => { setShowFaceId(false); setFaceResult("idle"); }, 1500); }
      });
    }
  }, [username, captureFrame, stopCamera, goToDashboard, pendingUser]);

  const doFaceScanRef = useRef(doFaceScan);
  doFaceScanRef.current = doFaceScan;

  const handleFaceIdClick = async () => {
    if (!username.trim()) { setError("Saisissez d'abord votre identifiant"); return; }
    setError(""); setLockState("locked"); setFaceResult("idle"); soundManager.click();
    const ok = await startCamera(); if (!ok) return; setShowFaceId(true);
  };

  const handleRegisterFace = async () => {
    setError(""); setLockState("locked"); setFaceResult("idle"); soundManager.click();
    const ok = await startCamera(); if (!ok) return; setShowRegisterPrompt(false); setShowFaceId(true);
  };

  const forRegisterRef = useRef(false);
  useEffect(() => { if (showFaceId) forRegisterRef.current = !showRegisterPrompt; }, [showFaceId, showRegisterPrompt]);

  useEffect(() => {
    if (!showFaceId) return;
    const video = videoRef.current; if (!video) return;
    const onPlaying = () => { if (captureTimer.current) clearTimeout(captureTimer.current); captureTimer.current = setTimeout(() => doFaceScanRef.current(forRegisterRef.current), 800); };
    video.addEventListener("playing", onPlaying);
    if (video.readyState >= 3) onPlaying();
    return () => { video.removeEventListener("playing", onPlaying); if (captureTimer.current) clearTimeout(captureTimer.current); };
  }, [showFaceId]);

  useEffect(() => { if (showFaceId && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current; }, [showFaceId]);

  const handleSkipFace = () => { if (pendingUser) goToDashboard(pendingUser); };

  useEffect(() => { return () => { stopCamera(); if (captureTimer.current) clearTimeout(captureTimer.current); }; }, [stopCamera]);

  const dustParticles = useMemo(() => [...Array(18)].map(() => ({ size: 2 + Math.random() * 4, x: Math.random() * 100, delay: Math.random() * 5, dur: 4 + Math.random() * 6 })), []);
  const roadLines = useMemo(() => [...Array(10)].map((_, i) => i), []);

  if (phase === "intro") return <CinematicIntro onDone={() => setPhase("form")} dustParticles={dustParticles} roadLines={roadLines} />;
  if (phase === "driving" || phase === "transition") return <CinematicDriving phase={phase} />;

  if (showFaceId) {
    return (
      <FaceIdOverlay videoRef={videoRef} canvasRef={canvasRef} lockState={lockState} faceResult={faceResult}
        onCancel={() => { stopCamera(); setShowFaceId(false); setFaceResult("idle"); }}
        title={forRegisterRef.current ? "Enregistrement visage" : "Face ID"} />
    );
  }

  if (showRegisterPrompt && pendingUser) {
    return <RegisterPrompt username={pendingUser.username} onRegister={handleRegisterFace} onSkip={handleSkipFace} />;
  }

  return (
    <div className="login-page">
      <LoginVisual dustParticles={dustParticles} roadLines={roadLines} />
      <div className="login-form-side">
        <motion.div className="login-card" initial={{ opacity: 0, y: 30, scale: 0.96, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} transition={{ type: "spring", stiffness: 200, damping: 22 }}>
          <div className="login-card-inner">
            <motion.div className="brand" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <motion.div className="brand-logo" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.25 }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </motion.div>
              <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>Smart <strong>Fleet</strong></motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>Gestion intelligente des pannes camions</motion.p>
            </motion.div>

            <form onSubmit={handleSubmit} className="login-form">
              <motion.div className="input-group" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <input type="text" id="username" value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} placeholder=" " disabled={loading} autoComplete="username" />
                <label htmlFor="username">Nom d'utilisateur</label>
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                {faceIdReady && (
                  <motion.div className="face-badge-inline" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} title="Face ID disponible">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12a4 4 0 100-8 4 4 0 000 8z" /><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /></svg>
                  </motion.div>
                )}
              </motion.div>

              <motion.div className="input-group" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
                <input type={showPassword ? "text" : "password"} id="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder=" " disabled={loading} autoComplete="current-password" />
                <label htmlFor="password">Mot de passe</label>
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a4 4 0 018 0v4" /></svg>
                <button type="button" className="password-toggle" onClick={() => { setShowPassword(!showPassword); soundManager.tap(); }} tabIndex={-1}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div className="error-message" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div className="form-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <button type="button" className="forgot-link" onClick={onForgotPassword}>Mot de passe oublié ?</button>
              </motion.div>

              <motion.button type="submit" className="btn-primary" disabled={loading} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} whileHover={!loading ? { scale: 1.01 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}>
                {loading ? (<span className="btn-loading"><span className="btn-spinner" />Connexion...</span>) : (<>Se connecter<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg></>)}
              </motion.button>
            </form>

            <motion.div className="separator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}><span>ou</span></motion.div>

            <motion.button className={`btn-faceid ${faceIdReady ? "face-available" : ""}`} onClick={handleFaceIdClick} disabled={loading || !username.trim()} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} whileHover={!loading && username.trim() ? { scale: 1.01 } : {}} whileTap={!loading && username.trim() ? { scale: 0.98 } : {}}>
              {faceIdReady && <span className="pulse-ring" />}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12a4 4 0 100-8 4 4 0 000 8z" /><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /></svg>
              <span>{faceIdReady ? "Face ID détecté" : "Se connecter avec Face ID"}</span>
            </motion.button>

            <motion.div className="login-footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              En vous connectant, vous acceptez nos <a href="#">conditions</a> et notre <a href="#">politique</a>.
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const LoginVisual: React.FC<{ dustParticles: any[]; roadLines: number[] }> = ({ dustParticles, roadLines }) => (
  <div className="login-visual">
    <div className="visual-orb visual-orb-1" />
    <div className="visual-orb visual-orb-2" />

    <div className="visual-3d-canvas">
      <Truck3DCanvas autoRotate driving={false} />
    </div>

    <div className="visual-content">
      <div className="visual-badge" style={{ animation: "fadeInUp 0.6s 0.3s both" }}>
        <span className="visual-badge-dot" />Plateforme de gestion intelligente
      </div>
      <h2 className="visual-title" style={{ animation: "fadeInUp 0.6s 0.4s both" }}>
        Gérez votre flotte<br />avec <strong>précision</strong>
      </h2>
      <p className="visual-subtitle" style={{ animation: "fadeInUp 0.6s 0.5s both" }}>
        Surveillez les pannes en temps réel, planifiez les maintenances et optimisez vos trajets avec une vision claire de votre activité.
      </p>
      <div className="visual-features" style={{ animation: "fadeInUp 0.6s 0.6s both" }}>
        {[
          { icon: <><path d="M9 12l2 2 4-4" /></>, text: "Détection des pannes en temps réel" },
          { icon: <><path d="M3 12h18" /><path d="M3 6h18" /><path d="M3 18h18" /></>, text: "Tableaux de bord interactifs" },
          { icon: <><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></>, text: "Suivi GPS et check-up véhicule" },
        ].map((f, i) => (
          <div key={i} className="visual-feature" style={{ animation: `fadeInRight 0.5s ${0.65 + i * 0.08}s both` }}>
            <div className="visual-feature-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg></div>
            {f.text}
          </div>
        ))}
      </div>
    </div>

    <div className="cinematic-road">
      {roadLines.map((i) => (
        <div key={i} className="cinematic-road-line" style={{ left: `${i * 10}%`, width: "8%", animation: `roadLine 1.8s ${i * 0.18}s linear infinite` }} />
      ))}
    </div>

    {dustParticles.map((p, i) => (
      <div key={`vdust-${i}`} className="cinematic-dust" style={{ width: p.size, height: p.size, bottom: "18%", left: `${p.x}%`, animation: `dustFloat ${p.dur}s ${p.delay}s ease-in-out infinite` }} />
    ))}
  </div>
);

const CinematicIntro: React.FC<{ onDone: () => void; dustParticles: any[]; roadLines: number[] }> = ({ dustParticles, roadLines }) => (
  <motion.div className="cinematic-overlay" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
    <motion.div className="cinematic-3d" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}>
      <Truck3DCanvas autoRotate driving={false} />
    </motion.div>

    <div className="cinematic-road">
      {roadLines.map((i) => (
        <div key={i} className="cinematic-road-line" style={{ left: `${i * 10}%`, width: "6%", animation: `roadLineFast 0.8s ${i * 0.08}s linear infinite` }} />
      ))}
    </div>

    {dustParticles.map((p, i) => (
      <div key={`cdust-${i}`} className="cinematic-dust" style={{ width: p.size, height: p.size, bottom: "20%", left: `${p.x}%`, animation: `dustFloat ${p.dur}s ${p.delay}s ease-in-out infinite` }} />
    ))}

    <motion.div className="cinematic-content" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}>
      <motion.div className="cinematic-logo" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
      </motion.div>
      <motion.h1 className="cinematic-title" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>Smart <strong>Fleet</strong></motion.h1>
      <motion.p className="cinematic-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>Gestion intelligente des pannes camions</motion.p>
    </motion.div>

    <motion.div className="cinematic-dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
      {[0, 1, 2].map((i) => (<motion.div key={i} className="cinematic-dot" animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />))}
    </motion.div>
  </motion.div>
);

const CinematicDriving: React.FC<{ phase: string }> = ({ phase }) => (
  <motion.div className="cinematic-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <motion.div className="cinematic-3d" animate={{ scale: phase === "transition" ? [1, 1.5, 3] : 1, opacity: phase === "transition" ? [1, 0.5, 0] : 1 }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}>
      <Truck3DCanvas autoRotate={false} driving />
    </motion.div>

    <div className="cinematic-road">
      {[...Array(15)].map((_, i) => (
        <div key={i} className="cinematic-road-line" style={{ left: `${i * 7}%`, width: "4%", animation: `roadLineFast 0.4s ${i * 0.05}s linear infinite` }} />
      ))}
    </div>

    {[...Array(10)].map((_, i) => (
      <div key={`ddust-${i}`} className="cinematic-dust" style={{ width: 3 + (i % 5) * 1.5, height: 3 + (i % 5) * 1.5, bottom: "20%", left: `${i * 10 + (i % 3) * 3}%`, animation: `dustFloat ${3 + (i % 3) * 1.5}s ${(i % 4) * 0.5}s ease-in-out infinite` }} />
    ))}

    {phase === "driving" && (
      <motion.div className="cinematic-status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <div className="cinematic-status-dots">
          {[0, 1, 2].map((i) => (<motion.div key={i} className="cinematic-status-dot" animate={{ y: [0, -8, 0], opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />))}
        </div>
        <p className="cinematic-status-text">Connexion en cours</p>
      </motion.div>
    )}

    {phase === "transition" && (
      <motion.div className="cinematic-content" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
        <motion.div className="cinematic-check" initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ delay: 0.8, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </motion.div>
      </motion.div>
    )}

    <motion.div className="cinematic-vignette" animate={{ opacity: phase === "transition" ? [0, 1] : 0 }} transition={{ duration: 1.5, delay: 0.5 }} />
  </motion.div>
);

const FaceIdOverlay: React.FC<{
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  lockState: LockState;
  faceResult: "idle" | "scanning" | "success" | "fail";
  onCancel: () => void;
  title: string;
}> = ({ videoRef, canvasRef, lockState, faceResult, onCancel, title }) => (
  <motion.div className="login-page faceid-fullscreen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="login-form-side" style={{ gridArea: "1 / 1 / -1 / -1" }}>
      <div className="faceid-content">
        <motion.div className="faceid-status" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <motion.svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lock-icon ${lockState}`} animate={lockState === "recognizing" ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 1, repeat: Infinity }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d={lockState === "unlocked" ? "M7 11V7a4 4 0 018 0v4" : "M7 11V7a4 4 0 018 0v4"} />
          </motion.svg>
          <span className="faceid-title">{title}</span>
        </motion.div>

        <motion.div className="camera-frame" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 22 }}>
          <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div className="camera-overlay">
            {faceResult === "idle" && (<div className="face-guide"><div className="scan-line" /><div className="guide-text">Placez votre visage</div></div>)}
            {faceResult === "scanning" && (<motion.div className="scanning-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="scan-ring" /><div className="scan-text">Analyse...</div></motion.div>)}
            {faceResult === "success" && (<motion.div className="result-overlay" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}><div className="check-ring"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></div></motion.div>)}
            {faceResult === "fail" && (<motion.div className="result-overlay" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}><div className="fail-ring"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></div></motion.div>)}
          </div>
        </motion.div>

        <motion.div className="faceid-footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          {faceResult === "idle" && (<motion.button className="btn-cancel" onClick={onCancel} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>Annuler</motion.button>)}
        </motion.div>
      </div>
    </div>
  </motion.div>
);

const RegisterPrompt: React.FC<{ username: string; onRegister: () => void; onSkip: () => void }> = ({ username, onRegister, onSkip }) => (
  <div className="login-page">
    <div className="login-form-side" style={{ gridArea: "1 / 1 / -1 / -1" }}>
      <motion.div className="login-card" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 22 }}>
        <div className="login-card-inner">
          <div className="brand">
            <div className="brand-logo"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12a4 4 0 100-8 4 4 0 000 8z" /><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /></svg></div>
            <h1>Activer <strong>Face ID</strong></h1>
            <p>Souhaitez-vous activer la reconnaissance faciale pour</p>
            <p className="username-highlight">{username} ?</p>
          </div>
          <div className="register-actions">
            <motion.button className="btn-primary" onClick={onRegister} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12a4 4 0 100-8 4 4 0 000 8z" /><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /></svg>Activer Face ID
            </motion.button>
            <motion.button className="btn-faceid skip-btn" onClick={onSkip} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>Passer pour l'instant</motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  </div>
);

export default Login;
