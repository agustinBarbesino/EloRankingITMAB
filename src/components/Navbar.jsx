import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/useAuthContext';
import './Navbar.css';

export default function Navbar() {
  const { currentUser, logout } = useAuthContext();
  const location = useLocation();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isTeacher = currentUser.role === 'teacher';
  const isStudent = currentUser.role === 'student';

  const links = [
    { path: '/', label: 'Ranking', icon: '♟' },
    { path: '/history', label: 'Historial', icon: '⏱' },
    { path: '/match', label: 'Registrar Duelo', icon: '⚔', show: isAdmin || isTeacher },
    { path: '/admin', label: 'Admin', icon: '⚙', show: isAdmin },
  ].filter((l) => l.show !== false);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">
          ♚ EloRanking ITMAB
        </Link>
      </div>

      <div className="navbar-center">
        {links.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="navbar-right">
        <span className="user-badge">
          {currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : currentUser.name}
          {isAdmin && <span className="role-tag admin">Admin</span>}
          {isTeacher && <span className="role-tag teacher">Docente</span>}
          {isStudent && <span className="role-tag student">Estudiante</span>}
        </span>
        <button className="btn-logout" onClick={logout}>
          Salir
        </button>
      </div>
    </nav>
  );
}
