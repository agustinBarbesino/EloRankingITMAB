import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { AppProvider } from './context/AppProvider';
import { useAuthContext } from './context/useAuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Verify from './pages/Verify';
import Ranking from './pages/Ranking';
import History from './pages/History';
import Match from './pages/Match';
import Admin from './pages/Admin';
import './App.css';

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useAuthContext();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const { currentUser } = useAuthContext();

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Ranking />} />
          <Route path="/history" element={<History />} />
          <Route
            path="/match"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <Match />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
