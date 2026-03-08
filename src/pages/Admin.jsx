import { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import { Settings, ShieldAlert, Cpu, Users, BarChart2, Activity, MapPin } from 'lucide-react';
import './Admin.css';

const Admin = () => {
  const { maxCrowdLimit, updateSettings, alerts, sensorData } = useDashboard();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('monitoring');
  const [tempLimit, setTempLimit] = useState(maxCrowdLimit);
  const [sysLogs, setSysLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ username: '', password: '', role: 'user', email: '', firstName: '', lastName: '' });
  const [userError, setUserError] = useState('');

  useEffect(() => {
     setTempLimit(maxCrowdLimit);
  }, [maxCrowdLimit]);

  const handleSaveSettings = () => {
    updateSettings(Number(tempLimit));
  };

  const fetchUsers = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch('/api/auth/users', { headers: { Authorization: `Bearer ${user.token}` } });
      if (res.ok) setUsersList(await res.json());
    } catch(e) { console.error(e) }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      });
      const data = await res.json();
      if (res.ok) {
        setIsAddUserModalOpen(false);
        setNewUserData({ username: '', password: '', role: 'user', email: '', firstName: '', lastName: '' });
        fetchUsers();
      } else {
        setUserError(data.message || 'Failed to create user');
      }
    } catch(err) {
      setUserError('System Error');
    }
  };

  const fetchLogs = async () => {
    if (!user?.token) return;
    try {
      const res = await fetch('/api/logs?limit=100', { headers: { Authorization: `Bearer ${user.token}` } });
      if (res.ok) setSysLogs(await res.json());
    } catch(e) { console.error(e) }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab]);

  return (
    <div className="admin-page animate-fade-in">
      <header className="page-header pb-4 border-bottom mb-6">
        <div>
          <h1 className="page-title">Admin Command Center</h1>
          <p className="page-subtitle">Comprehensive IoT System Management</p>
        </div>
      </header>

      <div className="admin-layout" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Sidebar Tabs */}
        <div className="admin-tabs card" style={{ minWidth: '240px', padding: '1rem 0' }}>
           <button className={`tab-btn ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('monitoring')}>
             <Activity size={18} /> System Monitoring
           </button>
           <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
             <Settings size={18} /> Crowd Settings
           </button>
           <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
             <ShieldAlert size={18} /> Alerts & Logs
           </button>
           <button className={`tab-btn ${activeTab === 'devices' ? 'active' : ''}`} onClick={() => setActiveTab('devices')}>
             <Cpu size={18} /> Device Management
           </button>
           <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
             <BarChart2 size={18} /> Data Analytics
           </button>
           <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
             <Users size={18} /> User Management
           </button>
        </div>

        {/* Content Area */}
        <div className="admin-content" style={{ flex: 1 }}>
          
          {activeTab === 'monitoring' && (
            <div className="card">
              <h3 className="mb-4">Live System Overlook</h3>
              <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                 <div className="p-4 bg-base rounded border">
                   <h4 className="text-muted">Crowd Count (VL53L0X)</h4>
                   <h2 className={`mt-2 ${sensorData.peopleCount >= maxCrowdLimit ? 'text-danger' : 'text-success'}`}>{sensorData.peopleCount}</h2>
                 </div>
                 <div className="p-4 bg-base rounded border">
                   <h4 className="text-muted">Environment (DHT22)</h4>
                   <h2 className="mt-2">{sensorData.temperature}°C / {sensorData.humidity}%</h2>
                 </div>
                 <div className="p-4 bg-base rounded border">
                   <h4 className="text-muted">Body Temp (MLX90614)</h4>
                   <h2 className="mt-2 text-warning">{sensorData.bodyTemperatureAvg}°C</h2>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="card">
              <h3 className="mb-4 flex-center-left"><Settings size={20} className="mr-2 text-primary" /> Configuration</h3>
              <div className="setting-group mb-6">
                <label>Maximum Safe Crowd Limit</label>
                <div className="input-group mt-2">
                  <input 
                    type="number" 
                    className="input-field" 
                    value={tempLimit} 
                    onChange={(e) => setTempLimit(e.target.value)}
                    min="1"
                    style={{ maxWidth: '200px'}}
                  />
                  <button className="btn-primary" onClick={handleSaveSettings}>Apply Settings</button>
                </div>
                <p className="setting-helper mt-2">Set the threshold for the system to trigger overcrowding alerts.</p>
              </div>
              <div className="setting-group border-top pt-4">
                 <h4>Notifications Configuration</h4>
                 <div className="mt-4 flex-center-left" style={{ gap: '1rem'}}>
                    <label className="flex-center-left gap-2 cursor-pointer"><input type="checkbox" defaultChecked /> Enable UI Alerts</label>
                    <label className="flex-center-left gap-2 cursor-pointer"><input type="checkbox" /> Email Notifications</label>
                    <label className="flex-center-left gap-2 cursor-pointer"><input type="checkbox" /> SMS Warnings</label>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="card">
              <h3 className="mb-4">System Event Logs</h3>
              <div className="table-responsive">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-bottom">
                      <th className="p-2">Time</th>
                      <th className="p-2">Event</th>
                      <th className="p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sysLogs.length === 0 ? (
                      <tr><td colSpan="3" className="p-4 text-center text-muted">No logs recorded yet.</td></tr>
                    ) : (
                      sysLogs.map(log => (
                        <tr key={log._id} className="border-bottom">
                          <td className="p-2 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className={`p-2 font-bold text-${log.level}`}>{log.action}</td>
                          <td className="p-2">{log.message}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
             <div className="card">
               <h3 className="mb-4">Connected IoT Hardware</h3>
               <div className="grid gap-4">
                 <div className="border p-4 rounded flex-between">
                   <div>
                     <h4 className="font-bold flex-center-left"><Cpu size={16} className="mr-2"/> Main ESP32 Node</h4>
                     <p className="text-sm text-muted mt-1">IP: 192.168.1.104 • Uptime: 4d 12h</p>
                   </div>
                   <div className="flex-center gap-4">
                      <span className="text-success flex-center-left"><span className="dot online mr-2"></span> Online</span>
                      <button className="btn-primary" onClick={() => alert("Reboot signal sent to device.")}>Restart</button>
                   </div>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'analytics' && (
             <div className="card">
               <h3 className="mb-4">Data Analytics</h3>
               <p className="text-muted mb-6">Export historical sensor data for compliance and reporting.</p>
               <div className="flex gap-4">
                 <button className="btn-primary" onClick={() => alert("Generating CSV Export...")}>Export Last 7 Days (CSV)</button>
                 <button className="btn-primary" style={{ backgroundColor: 'var(--success)'}} onClick={() => alert("Generating PDF Report...")}>Generate PDF Report</button>
               </div>
             </div>
          )}

          {activeTab === 'users' && (
            <div className="card">
              <div className="flex-between mb-4">
                <h3>Personnel Accounts</h3>
                <button className="btn-primary text-sm" onClick={() => setIsAddUserModalOpen(true)}>+ Add User</button>
              </div>
              <div className="table-responsive">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-bottom">
                      <th className="p-2">Username</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length === 0 ? (
                      <tr><td colSpan="3" className="p-4 text-center text-muted">Loading users...</td></tr>
                    ) : (
                      usersList.map(u => (
                        <tr key={u._id} className="border-bottom">
                          <td className="p-2">{u.username}</td>
                          <td className="p-2 uppercase text-sm">{u.role}</td>
                          <td className="p-2">
                             <button className="text-warning mr-4 text-sm hover:underline" onClick={() => alert(`Reset password for ${u.username}?`)}>Reset Pwd</button>
                             {u.username !== 'admin' && (
                               <button className="text-danger text-sm hover:underline" onClick={async () => {
                                 if (window.confirm(`Delete user ${u.username}?`)) {
                                     await fetch(`/api/auth/users/${u._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${user.token}` }});
                                     fetchUsers();
                                 }
                               }}>Delete</button>
                             )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {isAddUserModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'}}>
           <div className="card" style={{ width: '100%', maxWidth: '450px', backgroundColor: 'var(--bg-card)', padding: '2rem' }}>
              <h3 className="mb-4">Create New Account</h3>
              <form onSubmit={handleCreateUser}>
                 <div className="input-group-col mb-4">
                   <label>Username</label>
                   <input type="text" required className="input-field" value={newUserData.username} onChange={e => setNewUserData({...newUserData, username: e.target.value})} />
                 </div>
                 <div className="input-group-col mb-4">
                   <label>Password</label>
                   <input type="password" required className="input-field" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} />
                 </div>
                 <div className="input-group-col mb-4">
                   <label>Role</label>
                   <select className="input-field" value={newUserData.role} onChange={e => setNewUserData({...newUserData, role: e.target.value})}>
                     <option value="user">Personnel</option>
                     <option value="admin">Administrator</option>
                   </select>
                 </div>
                 {userError && <p className="text-danger text-sm mb-4">{userError}</p>}
                 <div className="flex justify-end mt-4" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
                   <button type="button" className="text-secondary" onClick={() => setIsAddUserModalOpen(false)}>Cancel</button>
                   <button type="submit" className="btn-primary">Create User</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
