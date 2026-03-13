import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, Activity, LogOut, User, Moon, Sun, Shield, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDashboard } from '../../context/DashboardContext';
import NotificationBell from './NotificationBell';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { darkMode, setDarkMode, onDuty, setOnDuty } = useDashboard();

  const handleDutyToggle = async () => {
    const newStatus = !onDuty;
    setOnDuty(newStatus);
    try {
      await fetch('/api/duty', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ onDuty: newStatus })
      });
    } catch (e) { console.error('Duty toggle failed', e); }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Activity className="brand-icon" size={32} />
        <h2 className="brand-title">Crowd<span className="text-gradient">Pulse</span></h2>
      </div>

      <div className="user-profile mb-6">
        <div className={`avatar ${isAdmin ? 'bg-warning-subtle text-warning' : 'bg-primary-subtle text-primary'}`}>
          {isAdmin ? <Shield size={20} /> : <User size={20} />}
        </div>
        <div className="user-info">
          <p className="user-name">{user?.username}</p>
          <p className="user-role" style={{ color: isAdmin ? 'var(--warning)' : 'var(--primary)' }}>
            {isAdmin ? '⬡ Administrator' : '● Personnel'}
          </p>
        </div>
      </div>

      {/* Duty Status Toggle — Personnel only */}
      {!isAdmin && (
        <button
          onClick={handleDutyToggle}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '0.65rem 1rem', marginBottom: '1.5rem',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${onDuty ? 'var(--success)' : 'var(--border-color)'}`,
            backgroundColor: onDuty ? 'rgba(16,185,129,0.08)' : 'transparent',
            cursor: 'pointer', transition: 'all 0.2s',
            color: onDuty ? 'var(--success)' : 'var(--text-muted)',
            fontWeight: 600, fontSize: '0.85rem'
          }}
        >
          {onDuty
            ? <><CheckCircle2 size={16} /> On Duty</>
            : <><Clock size={16} /> Off Duty</>
          }
        </button>
      )}

      <nav className="sidebar-nav">
        <p className="nav-section-label">Navigation</p>

        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        {!isAdmin && (
          <NavLink to="/report" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <AlertTriangle size={20} />
            <span>Report Incident</span>
          </NavLink>
        )}

        {isAdmin && (
          <>
            <p className="nav-section-label" style={{ marginTop: '1rem', color: 'var(--warning)' }}>Admin Controls</p>
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => isActive ? { borderLeftColor: 'var(--warning)', color: 'var(--warning)', backgroundColor: 'rgba(245,158,11,0.08)' } : {}}
            >
              <Settings size={20} />
              <span>Admin Settings</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: '0.75rem' }}>
          <NotificationBell />
        </div>

        <button className="nav-item w-full mb-4" onClick={() => setDarkMode(!darkMode)} style={{ justifyContent: 'center' }}>
          {darkMode ? <Sun size={20} className="mr-2" /> : <Moon size={20} className="mr-2" />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

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
