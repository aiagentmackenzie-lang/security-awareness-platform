import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Training } from './pages/Training';
import { Dashboard } from './pages/Dashboard';
import { Leaderboard } from './pages/Leaderboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import './App.css';

/**
 * Check if user is authenticated (for demo mode, always return false to show auth UI)
 */
function isAuthenticated() {
  // For portfolio demo: disabled auth checks
  // return !!localStorage.getItem('accessToken');
  return true; // Always show as authenticated for demo
}

/**
 * Protected Route Component - Disabled for portfolio demo
 */
function ProtectedRoute({ children }) {
  // Allow access without auth for portfolio demo
  return children;
}

/**
 * Auth Route Component - Disabled for portfolio demo
 */
function AuthRoute({ children }) {
  // Hide auth pages for portfolio demo (redirect to home)
  return <Navigate to="/" replace />;
}

/**
 * Navigation Component
 */
function Navigation() {
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <nav className="main-nav">
      <div className="nav-brand">
        <Link to="/">🛡️ SecurityAware</Link>
      </div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/training" className="nav-link">Training</Link>
        <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
        {isAuthenticated() ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <div className="nav-user">
              <span className="user-name">{user.displayName || 'User'}</span>
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
            
            {/* Auth Routes */}
            <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
            <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
            
            {/* Protected Routes */}
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