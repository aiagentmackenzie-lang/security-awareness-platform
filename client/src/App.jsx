import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Home } from './pages/Home';
import { Training } from './pages/Training';
import { Dashboard } from './pages/Dashboard';
import { Leaderboard } from './pages/Leaderboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { isAuthenticated, getAccessToken, clearTokens } from './services/api.js';
import './App.css';

/**
 * Protected Route Component
 * Redirects to login if not authenticated
 */
function ProtectedRoute({ children }) {
  const [auth, setAuth] = useState(null);
  
  useEffect(() => {
    setAuth(isAuthenticated());
  }, []);
  
  if (auth === null) {
    return <div className="loading">Loading...</div>;
  }
  
  return auth ? children : <Navigate to="/login" replace />;
}

/**
 * Auth Route Component
 * Redirects to dashboard if already authenticated
 */
function AuthRoute({ children }) {
  const [auth, setAuth] = useState(null);
  
  useEffect(() => {
    setAuth(isAuthenticated());
  }, []);
  
  if (auth === null) {
    return <div className="loading">Loading...</div>;
  }
  
  return auth ? <Navigate to="/dashboard" replace /> : children;
}

/**
 * Navigation Component
 */
function Navigation() {
  const [user, setUser] = useState(null);
  const [auth, setAuth] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setAuth(authenticated);
      if (authenticated) {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    };
    
    checkAuth();
    // Listen for storage changes
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = () => {
    clearTokens();
    localStorage.removeItem('user_data');
    setUser(null);
    setAuth(false);
    window.location.href = '/';
  };

  return (
    <nav className="main-nav">
      <div className="nav-brand">
        <Link to="/">🛡️ SecurityAware</Link>
      </div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/training" className="nav-link">Training</Link>
        <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
        {auth ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <div className="nav-user">
              <span className="user-name">{user?.displayName || 'User'}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/register" className="nav-link nav-link-primary">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}

/**
 * Main App Component with Routing
 */
function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/training" element={<Training />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            
            {/* Auth Routes - redirect to dashboard if logged in */}
            <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
            <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
            
            {/* Protected Routes - require authentication */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="main-footer">
          <p>🛡️ Security Awareness Platform — Learn. Practice. Stay Safe.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
