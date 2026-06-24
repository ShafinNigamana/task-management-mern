import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import TaskSphereLogo from '../../components/TaskSphereLogo';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import GridBackground from '../../components/GridBackground';
import SpotlightCursor from '../../components/SpotlightCursor';

/* ── helpers ── */
const sanitize = (str) => str.replace(/[<>]/g, '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const errs = {};
    if (!email)                         errs.email    = 'Email is required';
    else if (!EMAIL_RE.test(email))     errs.email    = 'Enter a valid email address';

    if (!password)                      errs.password = 'Password is required';
    else if (password.length < 8)       errs.password = 'Password must be at least 8 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    try {
      setIsLoading(true);
      const data = await authService.login(
        email.trim().toLowerCase(),
        password
      );
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', width: '100%' }}>
      <GridBackground />
      <SpotlightCursor />

      <motion.div 
        className="auth-card auth-card--login"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="auth-brand">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <TaskSphereLogo size={32} />
          </Link>
        </h1>
        <p className="auth-subtitle">Sign in to your account</p>
        
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form-stack" noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input 
              type="email" 
              id="email"
              className={`form-input${fieldErrors.email ? ' form-input--error' : ''}`}
              value={email}
              onChange={(e) => { setEmail(sanitize(e.target.value)); setFieldErrors((p) => ({ ...p, email: null })); }}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input 
              type="password" 
              id="password"
              className={`form-input${fieldErrors.password ? ' form-input--error' : ''}`}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: null })); }}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="btn btn-primary"
            style={{ marginTop: 'var(--space-2)' }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">Don't have an account?</p>
          <Link to="/signup" className="auth-footer-link">Create one here</Link>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;

