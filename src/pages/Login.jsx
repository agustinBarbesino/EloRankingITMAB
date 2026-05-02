import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/useAuthContext';
import { api } from '../services/api';
import './Login.css';

const courseOptions = [
  { year: '1', divisions: ['A', 'B'] },
  { year: '2', divisions: ['A', 'B'] },
  { year: '3', divisions: ['A', 'B'] },
  { year: '4', divisions: ['MMO', 'IP'] },
  { year: '5', divisions: ['MMO', 'IP'] },
  { year: '6', divisions: ['MMO', 'IP'] },
  { year: '7', divisions: ['MMO', 'IP'] },
];

export default function Login() {
  const { login, registerStudent } = useAuthContext();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [courseYear, setCourseYear] = useState('');
  const [courseDivision, setCourseDivision] = useState('');
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setRegistrationEmail('');

    if (!email.trim() || !password.trim()) {
      setError('Completá todos los campos.');
      return;
    }

    if (isRegister) {
      if (!firstName.trim() || !lastName.trim() || !courseYear) {
        setError('Completá todos los campos.');
        return;
      }
      registerStudent(email.trim(), password, firstName.trim(), lastName.trim(), courseYear, courseDivision || null)
        .then((result) => {
          if (result.success) {
            setRegistrationEmail(email.trim());
            setVerifyUrl(result.verifyUrl || '');
            setEmailSent(result.emailSent || false);
            setIsRegister(false);
            setNeedsVerification(true);
          } else {
            setError(result.error);
          }
        });
    } else {
      login(email.trim(), password).then((result) => {
        if (result.success) {
          navigate('/');
        } else if (result.needsVerification) {
          setNeedsVerification(true);
          setRegistrationEmail(result.email);
          setError('Tu cuenta no está verificada.');
        } else {
          setError(result.error);
        }
      });
    }
  }

  function handleResendVerification() {
    if (!registrationEmail) return;
    api.resendVerification(registrationEmail).then((data) => {
      if (data.verifyUrl) {
        setVerifyUrl(data.verifyUrl);
        setEmailSent(data.emailSent || false);
        setError(data.message || 'Enlace de verificación actualizado.');
      } else {
        setError(data.message || 'Email de verificación reenviado.');
      }
    }).catch((err) => {
      setError(err.message);
    });
  }

  const selectedDivisions = courseOptions.find((c) => c.year === courseYear)?.divisions || [];

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <span className="login-icon">♚</span>
          <h1>Elo Ranking ITMAB</h1>
          <p>Club de Ajedrez</p>
        </div>

        <h2>{isRegister ? 'Registro de Estudiante' : 'Iniciar Sesión'}</h2>

        {needsVerification ? (
          <div className="verify-prompt">
            <div className="verify-icon info">✉</div>
            <h3>Revisá tu email</h3>
            <p>
              Te enviamos un email de confirmación a <strong>{registrationEmail}</strong>.
              Hacé click en el enlace para activar tu cuenta.
            </p>
            {emailSent ? (
              <p className="verify-note">Si no encontrás el email, revisá spam o usá el enlace directo de abajo.</p>
            ) : (
              <p className="verify-note">El email no pudo enviarse. Usá el enlace directo de abajo para verificar tu cuenta.</p>
            )}
            {verifyUrl && (
              <div className="verify-link-box">
                <p className="verify-link-label">Enlace de verificación:</p>
                <a href={verifyUrl} className="verify-link" target="_blank" rel="noopener noreferrer">
                  {verifyUrl}
                </a>
                <button type="button" className="btn-copy" onClick={() => navigator.clipboard.writeText(verifyUrl)}>
                  Copiar enlace
                </button>
              </div>
            )}
            <button type="button" className="btn-primary" onClick={handleResendVerification}>
              Reenviar email de verificación
            </button>
            <button type="button" className="btn-link" onClick={() => { setNeedsVerification(false); setRegistrationEmail(''); setVerifyUrl(''); setEmailSent(false); }}>
              Volver al login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">Nombre</label>
                    <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Tu nombre" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Apellido</label>
                    <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Tu apellido" />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="courseYear">Curso</label>
                  <select id="courseYear" value={courseYear} onChange={(e) => { setCourseYear(e.target.value); setCourseDivision(''); }}>
                    <option value="">Seleccionar año...</option>
                    {courseOptions.map((c) => (
                      <option key={c.year} value={c.year}>{c.year}°</option>
                    ))}
                  </select>
                </div>

                {courseYear && (
                  <div className="form-group">
                    <label htmlFor="courseDivision">División / Especialidad</label>
                    <select id="courseDivision" value={courseDivision} onChange={(e) => setCourseDivision(e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {selectedDivisions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña" />
            </div>

            {error && <div className="alert-error">{error}</div>}

            <button type="submit" className="btn-primary">
              {isRegister ? 'Registrarse' : 'Ingresar'}
            </button>
          </form>
        )}

        <div className="login-footer">
          {isRegister ? (
            <p>¿Ya tenés cuenta? <button type="button" onClick={() => setIsRegister(false)}>Iniciar sesión</button></p>
          ) : (
            <p>¿Sos estudiante nuevo? <button type="button" onClick={() => setIsRegister(true)}>Registrate acá</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
