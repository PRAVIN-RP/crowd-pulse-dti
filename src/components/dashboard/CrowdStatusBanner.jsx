import { AlertTriangle, CheckCircle, Info, Volume2 } from 'lucide-react';
import './CrowdStatusBanner.css';

const CrowdStatusBanner = ({ densityCategory, peopleCount, maxLimit, alarmActive = false }) => {
  let colorClass = 'success';
  let icon = <CheckCircle size={32} />;
  let title = 'SAFE CAPACITY';
  let desc = `Current capacity is monitored and within safe limits (${peopleCount} / ${maxLimit}).`;

  if (densityCategory === 'Overcrowded') {
     colorClass = 'danger alert-pulse';
     icon = <AlertTriangle size={32} />;
     title = 'OVERCROWDED LIMIT REACHED';
     desc = `Critical: Current count of ${peopleCount} exceeds maximum secure capacity of ${maxLimit}!`;
  } else if (densityCategory === 'High') {
     colorClass = 'warning';
     icon = <AlertTriangle size={32} />;
     title = 'HIGH CAPACITY WARNING';
     desc = `Caution: Crowd density is high. Nearing maximum capacity of ${maxLimit}.`;
  } else if (densityCategory === 'Moderate') {
     colorClass = 'primary';
     icon = <Info size={32} />;
     title = 'MODERATE CAPACITY';
     desc = `Notice: Crowd is building up. Steady flow maintained.`;
  }

  return (
    <div className={`status-banner ${colorClass}`}>
      <div className="status-icon-wrapper">
        {icon}
      </div>
      
      <div className="status-content">
        <h2 className="status-title">
          {title}
          {alarmActive && (
            <Volume2 size={20} className="alarm-indicator animate-pulse" style={{ marginLeft: '0.5rem', display: 'inline-block' }} />
          )}
        </h2>
        <p className="status-description">{desc}</p>
      </div>

      <div className="status-metric">
        <span className="count">{peopleCount}</span>
        <span className="divider">/</span>
        <span className="max">{maxLimit}</span>
      </div>
    </div>
  );
};

export default CrowdStatusBanner;
