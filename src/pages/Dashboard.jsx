import { MapPin, Users, Thermometer, Droplets, Activity, Usb, Bell, X } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import MetricCard from '../components/dashboard/MetricCard';
import CrowdStatusBanner from '../components/dashboard/CrowdStatusBanner';
import DataChart from '../components/charts/DataChart';
import { useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const { sensorData, maxCrowdLimit, warningLimit, isOvercrowded, connectSerial, disconnectSerial, serialStatus, socketConnected, activeBroadcast, setActiveBroadcast } = useDashboard();
  const [selectedLocation, setSelectedLocation] = useState('Zone-A (Main Hall)');

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
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="flex-center mr-4" style={{ gap: '8px' }}>
             <span className={`dot ${socketConnected ? 'online' : 'offline'}`} style={{ width: '12px', height: '12px'}}></span>
             <span className="text-secondary text-sm">IoT Link: {socketConnected ? 'Active' : 'Offline'}</span>
          </div>
          <button 
            className={`btn ${serialStatus === 'connected' ? 'btn-success' : 'btn-primary'}`}
            onClick={serialStatus === 'connected' ? disconnectSerial : connectSerial}
            disabled={serialStatus === 'connecting'}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Usb size={18} />
            {serialStatus === 'connected' ? 'Disconnect USB Sensor' : serialStatus === 'connecting' ? 'Connecting...' : 'Connect USB Sensor'}
          </button>
        </div>
      </header>

      <CrowdStatusBanner 
        isOvercrowded={isOvercrowded}
        peopleCount={sensorData.peopleCount}
        maxLimit={maxCrowdLimit}
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
          title="Total People"
          value={sensorData.peopleCount}
          icon={Users}
          colorClass={sensorData.peopleCount >= maxCrowdLimit ? 'danger' : (sensorData.peopleCount >= warningLimit ? 'warning' : 'success')}
          subtext={`Distance Sensors: Entry ${sensorData.lastEntryDistance || 0}mm / Exit ${sensorData.lastExitDistance || 0}mm`}
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
           <h3><MapPin size={18} className="mr-2 inline" /> Map Visualization</h3>
        </div>
        <div className="map-placeholder mt-4 flex-center" style={{ width: '100%', height: '200px', backgroundColor: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
           <div className="text-center text-muted">
             <MapPin size={32} className="mb-2 mx-auto opacity-50"/>
             <p>Interactive Map View Loading...</p>
             <p className="text-sm mt-1">Status: {isOvercrowded ? <span className="text-danger font-bold">RED ZONE</span> : <span className="text-success font-bold">GREEN ZONE</span>}</p>
           </div>
        </div>
      </div>

      <div className="charts-grid mt-4">
        <div className="card">
          <div className="card-header">
            <h3>Crowd Density over Time</h3>
            <span className="live-indicator">● LIVE</span>
          </div>
          <DataChart 
            data={sensorData.history} 
            dataKey="people"
            name="People"
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
