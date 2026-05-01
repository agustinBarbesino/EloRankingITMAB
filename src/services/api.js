const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

let token = null;

function getToken() {
  if (!token) {
    try {
      const stored = localStorage.getItem('elo_token');
      if (stored) token = stored;
    } catch {
      return null;
    }
  }
  return token;
}

function setToken(t) {
  token = t;
  localStorage.setItem('elo_token', t);
}

function clearToken() {
  token = null;
  localStorage.removeItem('elo_token');
}

async function request(method, endpoint, body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const t = getToken();
  if (t) {
    headers['Authorization'] = `Bearer ${t}`;
  }

  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Error desconocido.');
  }

  return data;
}

export const api = {
  login(email, password) {
    return request('POST', '/auth/login', { email, password }).then((data) => {
      setToken(data.user.email);
      return data;
    });
  },

  register(email, password, firstName, lastName, courseYear, courseDivision) {
    return request('POST', '/auth/register', { email, password, firstName, lastName, courseYear, courseDivision }).then((data) => {
      setToken(data.user.email);
      return data;
    });
  },

  logout() {
    clearToken();
  },

  getRanking() {
    return request('GET', '/players/ranking');
  },

  getMyPlayer() {
    return request('GET', '/players/me');
  },

  getMatches() {
    return request('GET', '/matches');
  },

  submitMatch(whiteUserId, blackUserId, result) {
    return request('POST', '/matches', { whiteUserId, blackUserId, result });
  },

  getUsers() {
    return request('GET', '/auth/users');
  },

  deleteUser(id) {
    return request('DELETE', `/auth/users/${id}`);
  },

  createUser(data) {
    return request('POST', '/admin/users', data);
  },
};
