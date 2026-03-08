import { Users, Thermometer, Droplets, Activity, Usb } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import MetricCard from '../components/dashboard/MetricCard';
import CrowdStatusBanner from '../components/dashboard/CrowdStatusBanner';
import DataChart from '../components/charts/DataChart';
import './Dashboard.css';

const Dashboard = () => {
  const { sensorData, maxCrowdLimit, isOvercrowded, connectSerial, disconnectSerial, serialStatus } = useDashboard();

  return (
    <div className="dashboard animate-fade-in">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Live Overview</h1>
          <p className="page-subtitle">Real-time IoT Monitoring Dashboard</p>
        </div>
        <div>
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

      <div className="metrics-grid">
        <MetricCard
          title="Total People"
          value={sensorData.peopleCount}
          icon={Users}
          colorClass="primary"
          subtext={`Distance Sensors: Entry ${sensorData.lastEntryDistance}mm / Exit ${sensorData.lastExitDistance}mm`}
        />
        
        <MetricCard
          title="Room Temperature"
          value={sensorData.temperature}
          unit="°C"
          icon={Thermometer}
          colorClass="warning"
          trend={0.5}
          subtext="Sensor DHT22"
        />
        
        <MetricCard
          title="Air Humidity"
          value={sensorData.humidity}
          unit="%"
          icon={Droplets}
          colorClass="success"
          trend={-1.2}
          subtext="Sensor DHT22"
        />
        
        <MetricCard
          title="Avg Body Temperature"
          value={sensorData.bodyTemperatureAvg}
          unit="°C"
          icon={Activity}
          colorClass={sensorData.bodyTemperatureAvg > 37.5 ? 'danger' : 'primary'}
          subtext="Sensor MLX90614"
        />
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
