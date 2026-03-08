import { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import { Settings, ShieldAlert, Cpu, Users, BarChart2, Activity, MapPin, Send } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './Admin.css';

const Admin = () => {
  const { maxCrowdLimit, updateSettings, alerts, sensorData } = useDashboard();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('monitoring');
  const [tempLimit, setTempLimit] = useState(maxCrowdLimit);
  const [tempWarningLimit, setTempWarningLimit] = useState(75);
  const [sysLogs, setSysLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const { isEmergencyMode } = useDashboard();
  
  // Broadcast State
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('info');

  // Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({ username: '', password: '', role: 'user', email: '', firstName: '', lastName: '' });
  const [userError, setUserError] = useState('');

  useEffect(() => {
     setTempLimit(maxCrowdLimit);
     // Warning limit is retrieved from context if available, fallback 75
     setTempWarningLimit(75); 
  }, [maxCrowdLimit]);

  const handleSaveSettings = () => {
    updateSettings({ maxCrowdLimit: Number(tempLimit), warningLimit: Number(tempWarningLimit) });
    alert("Settings updated successfully!");
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim() || !user?.token) return;

    try {
      const res = await fetch('/api/settings/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ message: broadcastMsg, severity: broadcastSeverity })
      });
      if (res.ok) {
        setBroadcastMsg('');
        alert("Broadcast sent to all active personnel terminals!");
      }
    } catch (e) { console.error("Broadcast failed:", e) }
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
              <div className="grid gap-6">
                 <div className="setting-group">
                   <label className="font-bold text-danger">Maximum Crowd Limit (Overcrowded)</label>
                   <div className="input-group mt-2">
                     <input 
                       type="number" 
                       className="input-field border-danger" 
                       value={tempLimit} 
                       onChange={(e) => setTempLimit(e.target.value)}
                       min="1"
                       style={{ maxWidth: '200px'}}
                     />
                   </div>
                   <p className="setting-helper mt-2">Threshold for critical Red alerts. Current: {maxCrowdLimit}</p>
                 </div>
                 <div className="setting-group">
                   <label className="font-bold text-warning">Warning Crowd Limit (Caution)</label>
                   <div className="input-group mt-2">
                     <input 
                       type="number" 
                       className="input-field border-warning" 
                       value={tempWarningLimit} 
                       onChange={(e) => setTempWarningLimit(e.target.value)}
                       min="1"
                       style={{ maxWidth: '200px'}}
                     />
                   </div>
                   <p className="setting-helper mt-2">Threshold for Yellow warning alerts. Current: {tempWarningLimit}</p>
                 </div>
              </div>
              <div className="mt-6">
                 <button className="btn-primary" onClick={handleSaveSettings}>Apply All Settings</button>
              </div>

              <div className="setting-group border-top pt-6 mt-6">
                 <h4 className="mb-4 text-danger flex-center-left"><ShieldAlert size={20} className="mr-2"/> Danger Zone</h4>
                 <div className="p-4 rounded border-danger" style={{ backgroundColor: 'var(--danger-glow)'}}>
                    <div className="flex-between">
                       <div>
                          <h4 className="text-danger font-bold">SMART CITY EMERGENCY OVERRIDE</h4>
                          <p className="text-sm mt-1 text-danger">Activating this will force all Personnel Dashboards into full-screen Emergency Evacuation Mode.</p>
                       </div>
                       <button 
                         className="btn-primary" 
                         style={{ backgroundColor: isEmergencyMode ? 'var(--bg-card)' : 'var(--danger)', color: isEmergencyMode ? 'var(--text-primary)' : 'white', border: isEmergencyMode ? '1px solid var(--border-color)' : 'none' }}
                         onClick={() => updateSettings({ isEmergencyMode: !isEmergencyMode })}
                       >
                         {isEmergencyMode ? 'DEACTIVATE EMERGENCY' : 'TRIGGER EVACUATION PROTOCOL'}
                       </button>
                    </div>
                 </div>
              </div>

              <div className="setting-group border-top pt-4 mt-6">
                 <h4 className="mb-4">Notifications & Alerts Configuration</h4>
                 <div className="flex-center-left gap-4 flex-wrap">
                    <label className="flex-center-left gap-2 cursor-pointer"><input type="checkbox" defaultChecked /> Enable UI Alerts</label>
                    <label className="flex-center-left gap-2 cursor-pointer"><input type="checkbox" /> Automate Emails to Staff</label>
                    <label className="flex-center-left gap-2 cursor-pointer"><input type="checkbox" /> Emergency SMS Warnings</label>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="card">
              <h3 className="mb-4">Terminal Broadcast</h3>
              <form onSubmit={handleSendBroadcast} className="mb-6 pb-6 border-bottom">
                 <div className="flex gap-4 mb-2">
                    <div className="flex-grow">
                       <label className="text-sm text-secondary">Message Payload</label>
                       <input 
                         type="text" 
                         className="input-field w-full mt-1" 
                         placeholder="Enter emergency or information text here..." 
                         value={broadcastMsg}
                         onChange={e => setBroadcastMsg(e.target.value)}
                         required
                       />
                    </div>
                    <div>
                        <label className="text-sm text-secondary">Severity</label>
                        <select className="input-field w-full mt-1" value={broadcastSeverity} onChange={e => setBroadcastSeverity(e.target.value)}>
                           <option value="info">Info (Blue)</option>
                           <option value="warning">Warning (Yellow)</option>
                           <option value="danger">Critical (Red)</option>
                        </select>
                    </div>
                 </div>
                 <button type="submit" className="btn-primary mt-2 flex-center-left gap-2"><Send size={16}/> Dispatch Broadcast</button>
              </form>

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
             <div className="grid gap-6">
                <div className="card">
                   <h3 className="mb-4">Historical Analytics</h3>
                   <p className="text-muted mb-6">Simulated analytics for the past 7 days based on current constraints.</p>
                   
                   <div style={{ width: '100%', height: 300 }}>
                     <ResponsiveContainer>
                        <AreaChart data={[
                           { day: 'Mon', peak: 85, avg: 40 },
                           { day: 'Tue', peak: 102, avg: 50 },
                           { day: 'Wed', peak: Math.floor(maxCrowdLimit * 1.1), avg: 60 },
                           { day: 'Thu', peak: 90, avg: 45 },
                           { day: 'Fri', peak: Math.floor(maxCrowdLimit * 1.3), avg: 85 },
                           { day: 'Sat', peak: Math.floor(maxCrowdLimit * 1.5), avg: 110 },
                           { day: 'Sun', peak: Math.floor(maxCrowdLimit * 0.9), avg: 70 },
                        ]}>
                          <defs>
                            <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis dataKey="day" stroke="var(--text-muted)" />
                          <YAxis stroke="var(--text-muted)" />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                          <Area type="monotone" dataKey="peak" stroke="var(--primary)" fillOpacity={1} fill="url(#colorPeak)" name="Peak Crowd" />
                          <Area type="monotone" dataKey="avg" stroke="var(--success)" fillOpacity={0.2} fill="var(--success)" name="Average Crowd" />
                        </AreaChart>
                     </ResponsiveContainer>
                   </div>
                </div>

                <div className="card">
                   <h3 className="mb-4">Export Compliance Records</h3>
                   <div className="flex gap-4">
                     <button className="btn-primary outline" onClick={() => alert("Generating CSV Export...")}>Download Last 30 Days (CSV)</button>
                     <button className="btn-primary" style={{ backgroundColor: 'var(--success)', border: 'none' }} onClick={() => alert("Generating PDF Report...")}>Generate Compliance PDF</button>
                   </div>
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
