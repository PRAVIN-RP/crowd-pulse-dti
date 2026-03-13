import { useState, useRef, useEffect } from 'react';
import { Bell, X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import './NotificationBell.css';

const severityIcon = (type) => {
  if (type === 'danger') return <AlertTriangle size={14} className="text-danger" />;
  if (type === 'warning') return <AlertCircle size={14} className="text-warning" />;
  return <Info size={14} className="text-primary" />;
};

const NotificationBell = () => {
  const { alerts, dismissAlert } = useDashboard();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = alerts.length;

  return (
    <div className="notif-bell-wrapper" ref={panelRef}>
      <button className="notif-bell-btn" onClick={() => setOpen(o => !o)} title="Alerts">
        <Bell size={20} />
        {unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>

      {open && (
        <div className="notif-panel animate-fade-in">
          <div className="notif-header">
            <span className="font-bold">Live Alerts</span>
            <span className="text-muted text-sm">{unread} active</span>
          </div>

          {alerts.length === 0 ? (
            <div className="notif-empty">
              <Bell size={28} className="text-muted mb-2" />
              <p className="text-muted text-sm">No active alerts</p>
            </div>
          ) : (
            <ul className="notif-list">
              {alerts.map(alert => (
                <li key={alert.id} className={`notif-item notif-${alert.type}`}>
                  <div className="notif-item-icon">{severityIcon(alert.type)}</div>
                  <div className="notif-item-body">
                    <p className="notif-msg">{alert.message}</p>
                    <span className="notif-time">
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <button className="notif-dismiss" onClick={() => dismissAlert(alert.id)}>
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
