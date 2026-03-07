import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { Settings, ShieldAlert, Cpu } from 'lucide-react';
import './Admin.css';

const Admin = () => {
  const { maxCrowdLimit, setMaxCrowdLimit, alerts, sensorData } = useDashboard();
  const [tempLimit, setTempLimit] = useState(maxCrowdLimit);

  const handleSave = () => {
    setMaxCrowdLimit(Number(tempLimit));
  };

  return (
    <div className="admin-page animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Admin Settings</h1>
          <p className="page-subtitle">Configure System Parameters & View Logs</p>
        </div>
      </header>

      <div className="admin-grid">
        <div className="settings-panel flex-col">
          <div className="card h-full">
            <div className="card-header border-bottom">
              <h3 className="flex-center-left"><Settings size={20} className="mr-2 text-primary" /> Configuration</h3>
            </div>
            
            <div className="settings-content">
              <div className="setting-group">
                <label>Maximum Safe Crowd Limit</label>
                <div className="input-group">
                  <input 
                    type="number" 
                    className="input-field" 
                    value={tempLimit} 
                    onChange={(e) => setTempLimit(e.target.value)}
                    min="1"
                  />
                  <button className="btn-primary" onClick={handleSave}>Apply Settings</button>
                </div>
                <p className="setting-helper">Set the threshold for the system to trigger overcrowding alerts.</p>
              </div>

              <div className="system-health mt-4">
                <h4><Cpu size={16} className="mr-2" /> Connected Sensors</h4>
                <ul className="sensor-list">
                  <li><span className="dot online"></span> DHT22 (Env) - OK</li>
                  <li><span className="dot online"></span> MLX90614 (Body) - OK</li>
                  <li><span className="dot online"></span> VL53L0X Counters - OK</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="alerts-panel flex-col">
          <div className="card h-full">
            <div className="card-header border-bottom">
              <h3 className="flex-center-left"><ShieldAlert size={20} className="mr-2 text-danger" /> System Alerts Log</h3>
            </div>
            
            <div className="alerts-content">
              {alerts.length === 0 ? (
                <div className="no-alerts text-muted">No recent alerts. System is operating safely.</div>
              ) : (
                <ul className="alerts-list">
                  {alerts.map((alert, idx) => (
                    <li key={idx} className={`alert-item ${alert.type}`}>
                      <span className="alert-time">{alert.timestamp.toLocaleTimeString()}</span>
                      <span className="alert-message">{alert.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
