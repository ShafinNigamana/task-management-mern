import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TaskSphereLogo from '../components/TaskSphereLogo';
import SpotlightCursor from '../components/SpotlightCursor';
import GridBackground from '../components/GridBackground';
import { useState } from 'react';

export default function PublicLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="public-layout-wrapper">
      {/* Background Effects */}
      <GridBackground />
      <SpotlightCursor />

      {/* Public Navigation Header */}
      <header className="public-header">
        <div className="public-header-content">
          <div className="public-header-logo-section" onClick={handleLogoClick}>
            <TaskSphereLogo size={24} />
          </div>

          <button 
            className="public-mobile-menu-btn" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></div>
          </button>

          <nav className={`public-nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <NavLink 
              to="/" 
              end
              className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Product
            </NavLink>
            <NavLink 
              to="/about" 
              className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </NavLink>
            <NavLink 
              to="/contact" 
              className={({ isActive }) => `public-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </NavLink>

            <div className="public-header-ctas-mobile">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost" onClick={() => setMobileMenuOpen(false)}>
                    Log In
                  </Link>
                  <Link to="/signup" className="btn btn-outline" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>

          <div className="public-header-ctas">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Log In
                </Link>
                <Link to="/signup" className="btn btn-outline">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="public-main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="public-footer">
        <div className="public-footer-content">
          <div className="public-footer-brand-section">
            <div className="footer-logo">
              <TaskSphereLogo size={20} />
            </div>
            <p className="footer-tagline">Sleek, secure task management for high-velocity teams.</p>
            <p className="footer-copyright">&copy; {new Date().getFullYear()} TaskSphere Inc. All rights reserved.</p>
          </div>

          <div className="public-footer-links-grid">
            <div className="footer-links-col">
              <h4>Product</h4>
              <Link to="/dashboard">Workspaces</Link>
            </div>
            <div className="footer-links-col">
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
              <a href="https://github.com/ShafinNigamana/TaskSphere" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
            <div className="footer-links-col">
              <h4>Resources</h4>
              <Link to="/health">System Status</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
