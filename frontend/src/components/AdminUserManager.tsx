import React, { useState, useEffect, useRef } from 'react';
import { User, Role } from '../types/incident';
import { userService } from '../services/userService';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', CHAUFFEUR: 'Chauffeur', PRESTATAIRE: 'Prestataire',
  RS: 'Responsable Support', RPF: 'RPF', ASM: 'ASM', CPL: 'CPL', DRL: 'DRL', RFL: 'RFL',
  SL: 'Superviseur Livraison', MAINTENANCE: 'Maintenance',
};

const AdminUserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [cameraUser, setCameraUser] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try { setUsers(await userService.getAllUsers()); } catch { setMessage('Erreur chargement utilisateurs'); }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraUser(null);
  };

  const openCamera = async (userId: number) => {
    setCameraUser(userId);
  };

  useEffect(() => {
    if (cameraUser === null) return;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch { setMessage('Impossible d\'accéder à la caméra'); stopCamera(); }
    };
    const t = setTimeout(start, 200);
    return () => clearTimeout(t);
  }, [cameraUser]);

  const captureFromCamera = async () => {
    if (!canvasRef.current || !videoRef.current || cameraUser === null) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    stopCamera();
    setUploading(cameraUser);
    setMessage('');
    try {
      const ok = await userService.registerFace(cameraUser, base64);
      setMessage(ok ? 'Visage enregistré avec succès !' : 'Échec - visage non détecté');
      if (ok) loadUsers();
    } catch { setMessage('Erreur upload photo'); }
    setUploading(null);
  };

  if (loading) return <div className="p-8 text-center text-gray-600 dark:text-gray-400">Chargement...</div>;

  return (
    <div className="bg-[#1e293b] rounded-2xl p-6 border border-[#334155] max-w-5xl mx-auto my-8">
      <h2 className="text-xl font-bold text-white mb-6">Gestion des utilisateurs — Photos Face ID</h2>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          {message}
        </div>
      )}

      {cameraUser !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-[#1e293b] p-6 rounded-2xl border border-[#334155]">
            <h3 className="text-white font-semibold mb-4 text-center">Capturez votre visage</h3>
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline className="w-80 h-60 rounded-lg bg-black object-cover" />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="flex gap-3 mt-4 justify-center">
              <button onClick={captureFromCamera} className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium">
                📸 Capturer
              </button>
              <button onClick={stopCamera} className="px-6 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white font-medium">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-600 dark:text-gray-400 border-b border-[#334155]">
              <th className="text-left py-3 px-2">Identifiant</th>
              <th className="text-left py-3 px-2">Nom</th>
              <th className="text-left py-3 px-2">Rôle</th>
              <th className="text-left py-3 px-2">Photo</th>
              <th className="text-left py-3 px-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                <td className="py-3 px-2 text-white">{u.username}</td>
                <td className="py-3 px-2 text-gray-300">{u.firstname} {u.name}</td>
                <td className="py-3 px-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </td>
                <td className="py-3 px-2">
                  {u.faceImage ? (
                    <img src={u.faceImage} alt="face" className="w-10 h-10 rounded-full object-cover border-2 border-green-500/50" />
                  ) : (
                    <span className="text-gray-500 text-xs">Aucune</span>
                  )}
                </td>
                <td className="py-3 px-2 flex gap-2">
                  <label className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    uploading === u.id ? 'bg-gray-600 text-gray-300' : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}>
                    {uploading === u.id ? 'Upload...' : '📁 Fichier'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading === u.id}
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setUploading(u.id);
                        setMessage('');
                        try {
                          const reader = new FileReader();
                          const base64 = await new Promise<string>(resolve => {
                            reader.onload = () => resolve(reader.result as string);
                            reader.readAsDataURL(f);
                          });
                          const ok = await userService.registerFace(u.id, base64);
                          setMessage(ok ? 'Visage enregistré avec succès !' : 'Échec - visage non détecté');
                          if (ok) loadUsers();
                        } catch { setMessage('Erreur upload photo'); }
                        setUploading(null);
                      }} />
                  </label>
                  <button onClick={() => openCamera(u.id)} disabled={uploading === u.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      uploading === u.id
                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                    }`}>
                    📷 Webcam
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserManager;