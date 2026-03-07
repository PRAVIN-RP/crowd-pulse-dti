import { AlertTriangle, CheckCircle } from 'lucide-react';
import './CrowdStatusBanner.css';

const CrowdStatusBanner = ({ isOvercrowded, peopleCount, maxLimit }) => {
  return (
    <div className={`status-banner ${isOvercrowded ? 'danger alert-pulse' : 'success'}`}>
      <div className="status-icon-wrapper">
        {isOvercrowded ? <AlertTriangle size={32} /> : <CheckCircle size={32} />}
      </div>
      
      <div className="status-content">
        <h2 className="status-title">
          {isOvercrowded ? 'OVERCROWDED LIMIT REACHED' : 'SAFE CAPACITY'}
        </h2>
        <p className="status-description">
          {isOvercrowded 
            ? `Critical: Current count of ${peopleCount} exceeds maximum secure capacity of ${maxLimit}!` 
            : `Current capacity is monitored and within safe limits (${peopleCount} / ${maxLimit}).`}
        </p>
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
