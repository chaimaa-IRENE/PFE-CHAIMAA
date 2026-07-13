import React, { useState } from 'react';
import { userService } from '../services/userService';
import './Login.css';

interface ResetPasswordProps {
  onBack: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onBack }) => {
  const [token, setToken] = useState(new URLSearchParams(window.location.search).get('token') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError('Token manquant'); return; }
    if (!password || password.length < 4) { setError('Le mot de passe doit contenir au moins 4 caractères'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setLoading(true); setError('');
    try {
      const result = await userService.resetPassword(token, password);
      if (result.success) { setDone(true); }
      else { setError(result.error || 'Erreur lors de la réinitialisation'); }
    } catch { setError('Erreur lors de la réinitialisation'); }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="login-container">
        <div className="login-card welcome-card">
          <div className="welcome-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
          <h2>Mot de passe réinitialisé</h2>
          <p className="welcome-message">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
          <button className="btn-primary" style={{marginTop:24}} onClick={onBack}>Se connecter</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand">
          <div className="brand-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
          <h1>Nouveau <span>mot de passe</span></h1>
          <p>Choisissez un nouveau mot de passe pour votre compte</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input type="password" id="newpass" value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder=" " disabled={loading} />
            <label htmlFor="newpass">Nouveau mot de passe</label>
          </div>
          <div className="input-group">
            <input type="password" id="confirm" value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(''); }}
              placeholder=" " disabled={loading} />
            <label htmlFor="confirm">Confirmer le mot de passe</label>
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="btn-loading"><span className="btn-spinner" /> Réinitialisation...</span> : 'Réinitialiser'}
          </button>
        </form>
        <div className="separator"><span>ou</span></div>
        <button className="btn-faceid" onClick={onBack} disabled={loading}>Retour à la connexion</button>
      </div>
    </div>
  );
};

export default ResetPassword;
