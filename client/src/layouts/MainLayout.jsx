import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || 'User';

  return (
    <div className="layout-wrapper">
      {/* Header */}
      <header className="layout-header">
        <div className="header-content">
          <h1 className="header-title">Task Management Platform</h1>
          <div className="header-actions">
            <span className="header-user">Welcome, {displayName}</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="layout-container">
        {/* Sidebar */}
        <aside className="layout-sidebar">
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
          </nav>
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
