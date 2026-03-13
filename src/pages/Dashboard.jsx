import { MapPin, Users, Thermometer, Droplets, Activity, Usb, Bell, X, AlertTriangle, BrainCircuit, Volume2, VolumeX, QrCode } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import MetricCard from '../components/dashboard/MetricCard';
import CrowdStatusBanner from '../components/dashboard/CrowdStatusBanner';
import DataChart from '../components/charts/DataChart';
import CameraAI from '../components/dashboard/CameraAI';
import { useState, useEffect, useRef } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const { sensorData, maxCrowdLimit, warningLimit, isOvercrowded, connectSerial, disconnectSerial, serialStatus, socketConnected, activeBroadcast, setActiveBroadcast, isEmergencyMode, aiPrediction, cameraCount } = useDashboard();
  const { isAdmin } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState('Zone-A (Main Hall)');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'));

  // Data Fusion: The highest count is the source of truth for safety
  const hybridCount = Math.max(sensorData.peopleCount, cameraCount);
  const fusedOvercrowded = hybridCount >= maxCrowdLimit;

  let densityCategory = 'Safe';
  if (hybridCount >= maxCrowdLimit) densityCategory = 'Overcrowded';
  else if (hybridCount >= warningLimit) densityCategory = 'High';
  else if (hybridCount >= warningLimit * 0.5) densityCategory = 'Moderate';

  useEffect(() => {
     // Automatically play alarms when limits are exceeded
     const shouldPlayAlarm = fusedOvercrowded || isEmergencyMode;

     if (shouldPlayAlarm) {
        // Play the alert sound looping
        audioRef.current.loop = true;
        audioRef.current.volume = isEmergencyMode ? 1.0 : 0.8; // Louder for emergency
        audioRef.current.play().catch(e => console.log("Audio play blocked by browser."));
     } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
     }

     return () => {
        audioRef.current.pause();
     };
  }, [fusedOvercrowded, isEmergencyMode]);

  if (isEmergencyMode) {
     return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-pulse" style={{ backgroundColor: 'var(--danger)', color: 'white', position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
           <AlertTriangle size={120} className="mb-6" />
           <h1 style={{ fontSize: '4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px', textAlign: 'center' }}>CRITICAL EMERGENCY</h1>
           <p style={{ fontSize: '1.5rem', marginTop: '1rem', maxWidth: '800px', textAlign: 'center', opacity: 0.9 }}>
              Pursuant to Administrator override, this facility is now in EMERGENCY EVACUATION MODE. 
              All personnel are to immediately halt standard operations and begin redirecting all crowds to the nearest emergency exits.
           </p>
           <div style={{ marginTop: '3rem', padding: '2rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '1rem', border: '2px solid rgba(255,255,255,0.2)' }}>
              <h2 style={{ fontSize: '2rem', textAlign: 'center' }}>CURRENT LOAD: {hybridCount} SOULS</h2>
              <p style={{ textAlign: 'center', marginTop: '0.5rem' }}>Do not return to normal operations until the Administrator deactivates this override.</p>
           </div>
        </div>
     );
  }

  return (
    <div className="dashboard animate-fade-in">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Live Overview</h1>
          <p className="page-subtitle flex-center-left">
             <MapPin size={16} className="mr-2"/> Monitoring Location: 
             <select 
               value={selectedLocation} 
               onChange={(e) => setSelectedLocation(e.target.value)}
               className="ml-2 bg-transparent border-none text-primary font-bold outline-none cursor-pointer"
             >
               <option>Zone-A (Main Hall)</option>
               <option>Zone-B (Entrance)</option>
               <option>Zone-C (Exit Gates)</option>
             </select>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Admin-only hardware controls */}
          {isAdmin && (
            <button className="btn outline border text-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => alert("Scanner interface initializing...")}>
               <QrCode size={18} />
               Scan Entry QR
            </button>
          )}
          <div className="flex-center mx-4" style={{ gap: '8px' }}>
             <span className={`dot ${socketConnected ? 'online' : 'offline'}`} style={{ width: '12px', height: '12px'}}></span>
             <span className="text-secondary text-sm">IoT Link: {socketConnected ? 'Active' : 'Offline'}</span>
          </div>
          <button 
             className={`btn ${(fusedOvercrowded || isEmergencyMode) ? 'btn-danger animate-pulse' : audioEnabled ? 'btn-primary' : 'outline text-secondary border'}`}
             onClick={() => {
               if (fusedOvercrowded || isEmergencyMode) {
                 // Silence alarms
                 audioRef.current.pause();
                 audioRef.current.currentTime = 0;
               } else {
                 setAudioEnabled(!audioEnabled);
               }
             }}
             style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.4rem 0.8rem' }}
             title={(fusedOvercrowded || isEmergencyMode) ? 'Silence Alarms' : 'Toggle Audio Alerts'}
          >
             {(fusedOvercrowded || isEmergencyMode) ? <VolumeX size={18} /> : audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />} 
             {(fusedOvercrowded || isEmergencyMode) ? 'SILENCE' : audioEnabled ? 'Audio On' : 'Audio Off'}
          </button>
          {/* Admin-only: USB sensor management */}
          {isAdmin && (
            <button 
              className={`btn ${serialStatus === 'connected' ? 'btn-success' : 'btn-primary'}`}
              onClick={serialStatus === 'connected' ? disconnectSerial : connectSerial}
              disabled={serialStatus === 'connecting'}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Usb size={18} />
              {serialStatus === 'connected' ? 'Disconnect USB Sensor' : serialStatus === 'connecting' ? 'Connecting...' : 'Connect USB Sensor'}
            </button>
          )}
        </div>
      </header>

      <CrowdStatusBanner 
        densityCategory={densityCategory}
        peopleCount={hybridCount}
        maxLimit={maxCrowdLimit}
        alarmActive={fusedOvercrowded || isEmergencyMode}
      />

      {activeBroadcast && (
         <div className={`broadcast-banner border rounded p-4 mb-6 flex-between animate-fade-in`} style={{ backgroundColor: `var(--${activeBroadcast.severity}-glow)`, borderColor: `var(--${activeBroadcast.severity})` }}>
            <div className="flex-center-left gap-3">
               <Bell className={`text-${activeBroadcast.severity}`} size={24} />
               <div>
                  <h4 className={`text-${activeBroadcast.severity} font-bold`}>ADMINISTRATOR BROADCAST</h4>
                  <p className="mt-1">{activeBroadcast.message}</p>
               </div>
            </div>
            <button className="bg-transparent border-none cursor-pointer" onClick={() => setActiveBroadcast(null)}>
               <X className="text-secondary hover:text-primary transition-all" />
            </button>
         </div>
      )}

      <div className="metrics-grid">
        <MetricCard
          title="Total People (Fused AI)"
          value={hybridCount}
          icon={Users}
          colorClass={hybridCount >= maxCrowdLimit ? 'danger' : (hybridCount >= warningLimit ? 'warning' : 'success')}
          subtext={`Sources: Camera (${cameraCount}) | Sensor (${sensorData.peopleCount})`}
        />
        
        <MetricCard
          title="Room Temperature"
          value={sensorData.temperature}
          unit="°C"
          icon={Thermometer}
          colorClass={sensorData.temperature > 28 ? 'warning' : 'success'}
          trend={0.5}
          subtext="Sensor DHT22"
        />
        
        <MetricCard
          title="Air Humidity"
          value={sensorData.humidity}
          unit="%"
          icon={Droplets}
          colorClass={sensorData.humidity > 60 || sensorData.humidity < 30 ? 'warning' : 'success'}
          trend={-1.2}
          subtext="Sensor DHT22"
        />
        
        <MetricCard
          title="Avg Body Temperature"
          value={sensorData.bodyTemperatureAvg}
          unit="°C"
          icon={Activity}
          colorClass={sensorData.bodyTemperatureAvg >= 37.5 ? 'danger' : 'success'}
          subtext="Sensor MLX90614"
        />
      </div>

      <div className="card mt-4">
        <div className="card-header pb-2 border-bottom">
           <h3><MapPin size={18} className="mr-2 inline" /> Zone Occupancy Monitor</h3>
           <span className="live-indicator">● LIVE</span>
        </div>
        <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[
            {
              name: 'Zone A — Main Hall',
              count: sensorData.peopleCount,
              limit: maxCrowdLimit,
              color: densityCategory === 'Overcrowded' ? 'var(--danger)' : densityCategory === 'High' ? 'var(--warning)' : densityCategory === 'Moderate' ? 'var(--primary)' : 'var(--success)',
              status: densityCategory,
            },
            {
              name: 'Zone B — Entrance',
              count: Math.round(sensorData.peopleCount * 0.4),
              limit: Math.round(maxCrowdLimit * 0.5),
              color: 'var(--primary)',
              status: sensorData.peopleCount * 0.4 >= maxCrowdLimit * 0.5 ? 'Overcrowded' : sensorData.peopleCount * 0.4 >= maxCrowdLimit * 0.35 ? 'High' : 'Safe',
            },
            {
              name: 'Zone C — Exit Gates',
              count: Math.round(sensorData.peopleCount * 0.2),
              limit: Math.round(maxCrowdLimit * 0.3),
              color: 'var(--success)',
              status: 'Safe',
            }
          ].map(zone => {
            const pct = Math.min(100, Math.round((zone.count / zone.limit) * 100));
            const statusColor = zone.status === 'Overcrowded' ? 'var(--danger)' : zone.status === 'High' ? 'var(--warning)' : zone.status === 'Moderate' ? 'var(--primary)' : 'var(--success)';
            return (
              <div key={zone.name} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <span className="font-bold text-sm">{zone.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="text-sm font-bold">{zone.count} <span className="text-muted font-normal">/ {zone.limit}</span></span>
                    <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: `color-mix(in srgb, ${statusColor} 15%, transparent)`, color: statusColor }}>
                      {zone.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div style={{ width: '100%', height: '10px', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    borderRadius: '999px',
                    backgroundColor: statusColor,
                    transition: 'width 1s ease-in-out, background-color 0.5s',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <span className="text-xs text-muted">{pct}% capacity</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header pb-2 border-bottom">
           <h3><BrainCircuit size={18} className="mr-2 inline" /> AI Predictive Analytics (Smart City Framework)</h3>
        </div>
        <div className="mt-4 p-4 rounded border" style={{ backgroundColor: 'var(--bg-base)'}}>
           <div className="flex-between flex-wrap gap-4">
              <div>
                 <p className="text-secondary text-sm font-bold uppercase tracking-wider">Projected Volume (Next 10 Mins)</p>
                 <h2 className="mt-1 flex-center-left text-primary">
                    {aiPrediction.forecastedCount} 
                    <span className="text-sm ml-2 text-muted font-normal">(vs Limit: {maxCrowdLimit})</span>
                 </h2>
              </div>
              <div>
                 <p className="text-secondary text-sm font-bold uppercase tracking-wider">Threat Level</p>
                 <div className="mt-1 flex-center-left">
                    <span className={`px-3 py-1 rounded text-sm font-bold bg-${aiPrediction.riskLevel === 'High' ? 'danger' : aiPrediction.riskLevel === 'Medium' ? 'warning' : 'success'}-glow text-${aiPrediction.riskLevel === 'High' ? 'danger' : aiPrediction.riskLevel === 'Medium' ? 'warning' : 'success'}`}>
                       {aiPrediction.riskLevel.toUpperCase()}
                    </span>
                 </div>
              </div>
              <div className="flex-grow" style={{ minWidth: '300px' }}>
                 <p className="text-secondary text-sm font-bold uppercase tracking-wider">Intelligent Suggestion</p>
                 <p className={`mt-1 font-bold ${aiPrediction.riskLevel === 'High' ? 'text-danger' : 'text-primary'}`}>{aiPrediction.suggestion}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Live AI Camera Override */}
      <CameraAI />

      <div className="charts-grid mt-4">
        <div className="card">
          <div className="card-header">
            <h3>Crowd Density over Time</h3>
            <span className="live-indicator">● LIVE</span>
          </div>
          <DataChart 
            data={sensorData.history} 
            dataKey="fused"
            name="Fused Count"
            color="var(--primary)"
            maxLimit={maxCrowdLimit}
            showLimit={true}
          />
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Temperature Trend</h3>
            <span className="live-indicator">● LIVE</span>
          </div>
          <DataChart 
            data={sensorData.history} 
            dataKey="temp"
            name="Temp (°C)"
            color="var(--warning)"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
