import { queryOne } from '../database.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];
  queryOne('SELECT * FROM users WHERE email = $1', [token]).then((user) => {
    if (!user) {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    req.user = user;
    next();
  }).catch(() => {
    res.status(500).json({ error: 'Error interno del servidor.' });
  });
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tenés permiso para esta acción.' });
    }
    next();
  };
}
