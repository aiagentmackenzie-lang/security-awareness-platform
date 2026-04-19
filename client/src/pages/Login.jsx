import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, setTokens } from '../services/api.js';
import './Auth.css';

/**
 * Login Page Component
 */
export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.post('/auth/login', formData);

      // Store tokens
      setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
      localStorage.setItem('user_data', JSON.stringify(data.data.user));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🔐 Welcome Back</h1>
          <p>Sign in to continue your security training</p>
        </div>

        {error && (
          <div className="auth-error">
            ⚠️ {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Sign up</Link></p>
          <p className="auth-demo">
            <strong>Demo:</strong> demo@example.com / demo12345
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
