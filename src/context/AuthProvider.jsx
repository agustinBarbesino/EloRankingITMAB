import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { api } from '../services/api';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('elo_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('elo_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  async function login(email, password) {
    try {
      const data = await api.login(email, password);
      setCurrentUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function registerStudent(email, password, firstName, lastName, courseYear, courseDivision) {
    try {
      const data = await api.register(email, password, firstName, lastName, courseYear, courseDivision);
      return { success: true, email: data.email, message: data.message, verifyUrl: data.verifyUrl, emailSent: data.emailSent };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  function logout() {
    api.logout();
    setCurrentUser(null);
  }

  async function createUser(data) {
    try {
      const result = await api.createUser(data);
      return { success: true, user: result.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function deleteUser(id) {
    try {
      await api.deleteUser(id);
      if (currentUser && currentUser.id === id) {
        setCurrentUser(null);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function updateUser(id, data) {
    try {
      const result = await api.updateUser(id, data);
      return { success: true, user: result.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async function listUsers() {
    try {
      return await api.getUsers();
    } catch {
      return [];
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, registerStudent, logout, createUser, updateUser, deleteUser, listUsers }}>
      {children}
    </AuthContext.Provider>
  );
}
