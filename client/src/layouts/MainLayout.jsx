import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import TaskSphereLogo from '../components/TaskSphereLogo';
import { useAuth } from '../context/AuthContext';

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || 'User';
  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="layout-wrapper">
      {/* Header */}
      <header className="layout-header">
        <div className="header-content">
          <span className="header-brand-wordmark">TaskSphere</span>
          <div className="header-actions">
            <div className="header-user-badge">
              <span className="header-user-avatar" title={displayName}>
                {userInitials}
              </span>
              <span className="header-user-name">{displayName}</span>
              <button 
                onClick={handleLogout} 
                className="btn btn-ghost header-logout-btn" 
                title="Logout"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="layout-container">
        {/* Sidebar */}
        <aside className="layout-sidebar">
          <div className="sidebar-top">
            <div className="sidebar-brand">
              <TaskSphereLogo size={22} />
            </div>
            <nav className="sidebar-nav">
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'nav-link--active' : ''}`
                }
              >
                Dashboard
              </NavLink>
              <NavLink 
                to="/teams" 
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'nav-link--active' : ''}`
                }
              >
                Teams
              </NavLink>
              <NavLink 
                to="/tasks" 
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'nav-link--active' : ''}`
                }
              >
                Tasks
              </NavLink>
              {user?.role === 'manager' && (
                <NavLink 
                  to="/reports" 
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'nav-link--active' : ''}`
                  }
                >
                  Reports
                </NavLink>
              )}
            </nav>
          </div>
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <span className="sidebar-user-avatar">{userInitials}</span>
              <span className="sidebar-user-name" title={displayName}>
                {displayName}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost sidebar-logout-btn" title="Logout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
