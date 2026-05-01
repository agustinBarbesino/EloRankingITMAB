import { useState } from 'react';
import { useAuthContext } from '../context/useAuthContext';
import { useAppContext } from '../context/useAppContext';
import { api } from '../services/api';
import './Admin.css';

const courseOptions = [
  { year: '1', divisions: ['A', 'B'] },
  { year: '2', divisions: ['A', 'B'] },
  { year: '3', divisions: ['A', 'B'] },
  { year: '4', divisions: ['MMO', 'IP'] },
  { year: '5', divisions: ['MMO', 'IP'] },
  { year: '6', divisions: ['MMO', 'IP'] },
  { year: '7', divisions: ['MMO', 'IP'] },
];

export default function Admin() {
  const { createUser, deleteUser } = useAuthContext();
  const { initPlayer } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teacher');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [courseYear, setCourseYear] = useState('');
  const [courseDivision, setCourseDivision] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [users, setUsers] = useState(null);

  async function loadUsers() {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch {
      setUsers([]);
    }
  }

  if (users === null) {
    loadUsers();
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !password.trim()) {
      setError('Completá nombre y contraseña.');
      return;
    }

    const data = { name: name.trim(), password, role };
    if (email.trim()) data.email = email.trim();
    if (role === 'student') {
      if (firstName.trim()) data.firstName = firstName.trim();
      if (lastName.trim()) data.lastName = lastName.trim();
      if (courseYear) data.courseYear = courseYear;
      if (courseDivision) data.courseDivision = courseDivision;
    }

    const result = await createUser(data);
    if (result.success) {
      await initPlayer();
      setName('');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setCourseYear('');
      setCourseDivision('');
      setSuccess(`¡${role === 'teacher' ? 'Docente' : 'Estudiante'} "${name}" creado correctamente.`);
      await loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error);
    }
  }

  async function handleDelete(userId, userName) {
    if (!confirm(`¿Eliminar a "${userName}"? Se borrarán también sus partidas.`)) return;
    const result = await deleteUser(userId);
    if (result.success) {
      await initPlayer();
      await loadUsers();
    }
  }

  const selectedDivisions = courseOptions.find((c) => c.year === courseYear)?.divisions || [];

  return (
    <div className="admin-page">
      <h1>⚙ Panel de Administración</h1>

      <div className="admin-section">
        <h2>Crear Usuario</h2>
        <form className="admin-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Rol</label>
            <div className="role-options">
              <label className={`role-option ${role === 'teacher' ? 'selected' : ''}`}>
                <input type="radio" name="role" value="teacher" checked={role === 'teacher'} onChange={() => setRole('teacher')} />
                <span>👨‍🏫 Docente</span>
              </label>
              <label className={`role-option ${role === 'student' ? 'selected' : ''}`}>
                <input type="radio" name="role" value="student" checked={role === 'student'} onChange={() => setRole('student')} />
                <span>🎓 Estudiante</span>
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="admin-name">Nombre / Usuario</label>
              <input id="admin-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre o usuario" />
            </div>
            <div className="form-group">
              <label htmlFor="admin-email">Email</label>
              <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (opcional)" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Contraseña</label>
            <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" />
          </div>

          {role === 'student' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="admin-fname">Nombre</label>
                  <input id="admin-fname" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-lname">Apellido</label>
                  <input id="admin-lname" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellido" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="admin-course">Curso</label>
                  <select id="admin-course" value={courseYear} onChange={(e) => { setCourseYear(e.target.value); setCourseDivision(''); }}>
                    <option value="">Año...</option>
                    {courseOptions.map((c) => (
                      <option key={c.year} value={c.year}>{c.year}°</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="admin-division">División</label>
                  <select id="admin-division" value={courseDivision} onChange={(e) => setCourseDivision(e.target.value)}>
                    <option value="">...</option>
                    {selectedDivisions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {error && <div className="alert-error">{error}</div>}
          {success && <div className="alert-success">{success}</div>}

          <button type="submit" className="btn-primary">Crear Usuario</button>
        </form>
      </div>

      <div className="admin-section">
        <h2>Usuarios Existentes</h2>
        {users && users.length === 0 ? (
          <p className="empty-text">No hay usuarios creados.</p>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Rol</th>
                  <th>Curso</th>
                  <th>Elo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users && users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.name || user.email}
                    </td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'teacher' ? 'Docente' : 'Estudiante'}
                      </span>
                    </td>
                    <td>
                      {user.course_year
                        ? `${user.course_year}°${user.course_division ? ` ${user.course_division}` : ''}`
                        : '-'}
                    </td>
                    <td>{user.rating || 700}</td>
                    <td>
                      <button className="btn-delete" onClick={() => handleDelete(user.id, user.name || user.email)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
