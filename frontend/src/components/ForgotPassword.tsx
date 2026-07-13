import React, { useState } from 'react';
import { userService } from '../services/userService';
import './Login.css';

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Veuillez saisir votre email'); return; }
    setLoading(true); setError('');
    try {
      await userService.forgotPassword(email.trim());
      setDone(true);
    } catch { setError('Erreur lors de l\'envoi. Vérifiez votre email.'); }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="login-container">
        <div className="login-card welcome-card">
          <div className="welcome-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
          <h2>Email envoyé</h2>
          <p className="welcome-message">Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.</p>
          <button className="btn-primary" style={{marginTop:24}} onClick={onBack}>Retour à la connexion</button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand">
          <div className="brand-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg></div>
          <h1>Mot de passe <span>oublié</span></h1>
          <p>Saisissez votre email pour recevoir un lien de réinitialisation</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <input type="email" id="email" value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder=" " disabled={loading} />
            <label htmlFor="email">Votre email</label>
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="btn-loading"><span className="btn-spinner" /> Envoi...</span> : 'Envoyer le lien'}
          </button>
        </form>
        <div className="separator"><span>ou</span></div>
        <button className="btn-faceid" onClick={onBack} disabled={loading}>Retour à la connexion</button>
      </div>
    </div>
  );
};

export default ForgotPassword;
