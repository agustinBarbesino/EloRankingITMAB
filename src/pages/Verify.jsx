import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Login.css';

function doVerify(token) {
  return new Promise((resolve) => {
    if (!token) {
      resolve({ status: 'error', message: 'Token de verificación no proporcionado.' });
      return;
    }
    api.verify(token).then((data) => {
      resolve({ status: 'success', message: data.message });
    }).catch((err) => {
      resolve({ status: 'error', message: err.message });
    });
  });
}

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    doVerify(token).then((result) => {
      setStatus(result.status);
      setMessage(result.message);
      if (result.status === 'success') {
        setTimeout(() => navigate('/login'), 3000);
      }
    });
  }, [token, navigate]);

  function handleResend(e) {
    e.preventDefault();
    setResendStatus('sending');
    api.resendVerification(resendEmail).then(() => {
      setResendStatus('sent');
      setTimeout(() => setResendStatus(''), 3000);
    }).catch(() => {
      setResendStatus('error');
    });
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <span className="login-icon">♚</span>
          <h1>Verificar Cuenta</h1>
          <p>Elo Ranking ITMAB</p>
        </div>

        {status === 'idle' && (
          <div className="verify-status">
            <div className="spinner"></div>
            <p>Verificando tu cuenta...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verify-status">
            <div className="verify-icon success">✓</div>
            <p className="verify-message">{message}</p>
            <p className="verify-hint">Redirigiendo al login...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="verify-status">
            <div className="verify-icon error">✗</div>
            <p className="verify-message">{message}</p>
            <div className="resend-section">
              <p>¿Necesitás reenviar el email de verificación?</p>
              <form onSubmit={handleResend} className="resend-form">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Tu email"
                  required
                />
                <button type="submit" className="btn-primary" disabled={resendStatus === 'sending'}>
                  {resendStatus === 'sending' ? 'Enviando...' : 'Reenviar email'}
                </button>
              </form>
              {resendStatus === 'sent' && <p className="resend-success">¡Email reenviado! Revisá tu bandeja de entrada.</p>}
              {resendStatus === 'error' && <p className="resend-error">No se pudo enviar. Intentá más tarde.</p>}
            </div>
            <button className="btn-link" onClick={() => navigate('/login')}>
              Volver al login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
