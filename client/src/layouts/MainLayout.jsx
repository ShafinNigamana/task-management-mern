import { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import TaskSphereLogo from '../components/TaskSphereLogo';
import { useAuth } from '../context/AuthContext';
import SpotlightCursor from '../components/SpotlightCursor';

/* ── SVG icon components ── */
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const TeamsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TasksIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const ReportsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* ── Toggle icon ── */
const CollapseIcon = ({ collapsed }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.3s ease', transform: collapsed ? 'rotate(180deg)' : 'none' }}>
    <polyline points="11 17 6 12 11 7" />
    <polyline points="18 17 13 12 18 7" />
  </svg>
);

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

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

  const sidebarClass = `layout-sidebar${collapsed ? ' layout-sidebar--collapsed' : ''}`;

  return (
    <div className="layout-wrapper">
      <SpotlightCursor />
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
                <LogoutIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="layout-container">
        {/* Sidebar */}
        <aside className={sidebarClass}>
          <div className="sidebar-top">
            <div className="sidebar-brand">
              <TaskSphereLogo size={22} iconOnly={collapsed} />
            </div>
            <nav className="sidebar-nav">
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'nav-link--active' : ''}`
                }
                title="Dashboard"
              >
                <span className="nav-link-icon"><DashboardIcon /></span>
                <span className="nav-link-label">Dashboard</span>
              </NavLink>
              <NavLink 
                to="/teams" 
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'nav-link--active' : ''}`
                }
                title="Teams"
              >
                <span className="nav-link-icon"><TeamsIcon /></span>
                <span className="nav-link-label">Teams</span>
              </NavLink>
              <NavLink 
                to="/tasks" 
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'nav-link--active' : ''}`
                }
                title="Tasks"
              >
                <span className="nav-link-icon"><TasksIcon /></span>
                <span className="nav-link-label">Tasks</span>
              </NavLink>
              {user?.role === 'manager' && (
                <NavLink 
                  to="/reports" 
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'nav-link--active' : ''}`
                  }
                  title="Reports"
                >
                  <span className="nav-link-icon"><ReportsIcon /></span>
                  <span className="nav-link-label">Reports</span>
                </NavLink>
              )}
            </nav>
          </div>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <span className="sidebar-user-avatar">{userInitials}</span>
              <span className="sidebar-user-name" title={displayName}>
                {displayName}
              </span>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost sidebar-logout-btn" title="Logout">
              <span style={{ display: 'flex', alignItems: 'center', marginRight: '6px' }}><LogoutIcon /></span>
              <span className="nav-link-label">Logout</span>
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

