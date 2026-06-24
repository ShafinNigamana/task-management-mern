import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../../services/authService';
import TaskSphereLogo from '../../components/TaskSphereLogo';
import GridBackground from '../../components/GridBackground';
import SpotlightCursor from '../../components/SpotlightCursor';

/* ── helpers ── */
const sanitize = (str) => str.replace(/[<>]/g, '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PW_RULES = [
  { key: 'length',  label: 'At least 8 characters',        test: (p) => p.length >= 8 },
  { key: 'upper',   label: 'One uppercase letter',          test: (p) => /[A-Z]/.test(p) },
  { key: 'number',  label: 'One number',                    test: (p) => /\d/.test(p) },
  { key: 'special', label: 'One special character (!@#…)',   test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member'
  });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  
  const navigate = useNavigate();

  /* real-time password rule results */
  const pwChecks = useMemo(
    () => PW_RULES.map((r) => ({ ...r, passed: r.test(formData.password) })),
    [formData.password]
  );
  const allPwPassed = pwChecks.every((c) => c.passed);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: sanitize(value) }));
    /* clear per-field error on edit */
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: null }));
    if (name === 'password') setPasswordTouched(true);
  };

  const validate = () => {
    const errs = {};
    const trimmedName = formData.name.trim();

    if (!trimmedName)                     errs.name     = 'Name is required';
    else if (trimmedName.length < 2)      errs.name     = 'Name must be at least 2 characters';
    else if (trimmedName.length > 50)     errs.name     = 'Name must be under 50 characters';

    if (!formData.email)                  errs.email    = 'Email is required';
    else if (!EMAIL_RE.test(formData.email)) errs.email = 'Enter a valid email address';

    if (!formData.password)               errs.password = 'Password is required';
    else if (!allPwPassed)                errs.password = 'Password doesn\'t meet all requirements';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setPasswordTouched(true);
      return;
    }

    try {
      setIsLoading(true);
      await authService.signup({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh', width: '100%' }}>
      <GridBackground />
      <SpotlightCursor />

      <motion.div 
        className="auth-card auth-card--signup"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className="auth-brand">
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <TaskSphereLogo size={32} />
          </Link>
        </h1>
        <p className="auth-subtitle">Create your account</p>
        
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="form-stack" noValidate>
          {/* ── Name ── */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">Full Name</label>
            <input 
              type="text" 
              id="name"
              name="name"
              className={`form-input${fieldErrors.name ? ' form-input--error' : ''}`}
              value={formData.name}
              onChange={handleChange}
              placeholder="Ashok Sharma"
              autoComplete="name"
              maxLength={50}
            />
            {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
          </div>
          
          {/* ── Email ── */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input 
              type="email" 
              id="email"
              name="email"
              className={`form-input${fieldErrors.email ? ' form-input--error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>

          {/* ── Password ── */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input 
              type="password" 
              id="password"
              name="password"
              className={`form-input${fieldErrors.password ? ' form-input--error' : ''}`}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}

            {/* Password requirements checklist */}
            <AnimatePresence>
              {passwordTouched && (
                <motion.ul
                  className="pw-rules"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {pwChecks.map((rule) => (
                    <motion.li
                      key={rule.key}
                      className={`pw-rule ${rule.passed ? 'pw-rule--pass' : 'pw-rule--fail'}`}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="pw-rule-icon">{rule.passed ? '✓' : '✗'}</span>
                      {rule.label}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* ── Role ── */}
          <div className="form-group">
            <label htmlFor="role" className="form-label">Account Role</label>
            <select 
              id="role"
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="member">Team Member</option>
              <option value="manager">Team Manager</option>
            </select>
            <p className="form-helper-text" style={{ fontSize: 'var(--text-caption)', color: 'var(--color-text-muted)', marginTop: '2px', lineHeight: '1.4' }}>
              Managers can create teams and manage members.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="btn btn-primary"
            style={{ marginTop: 'var(--space-2)' }}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="auth-footer-text">Already have an account?</p>
          <Link to="/login" className="auth-footer-link">Sign in here</Link>
        </div>
      </motion.div>
    </div>
  );
}

export default SignupPage;