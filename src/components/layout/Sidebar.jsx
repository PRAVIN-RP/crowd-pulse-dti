import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, Activity, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Activity className="brand-icon" size={32} />
        <h2 className="brand-title">Smart<span className="text-gradient">Monitor</span></h2>
      </div>

      <div className="user-profile mb-6">
        <div className="avatar bg-primary-subtle text-primary">
          <User size={20} />
        </div>
        <div className="user-info">
          <p className="user-name">{user?.username}</p>
          <p className="user-role">{isAdmin ? 'Administrator' : 'Personnel'}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        {isAdmin && (
          <NavLink 
            to="/admin" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Settings size={20} />
            <span>Admin Settings</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item text-danger w-full logout-btn" onClick={logout}>
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
        <div className="system-status mt-4">
          <div className="status-indicator online"></div>
          <span>System Online</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
