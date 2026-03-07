import './MetricCard.css';

const MetricCard = ({ title, value, unit, icon: Icon, trend, subtext, colorClass = 'primary' }) => {
  return (
    <div className={`card metric-card border-hover-${colorClass}`}>
      <div className="metric-header">
        <h3 className="metric-title">{title}</h3>
        <div className={`icon-wrapper bg-${colorClass}-subtle text-${colorClass}`}>
          <Icon size={20} />
        </div>
      </div>
      
      <div className="metric-body">
        <div className="metric-value-container">
          <span className="metric-value">{value}</span>
          {unit && <span className="metric-unit">{unit}</span>}
        </div>
        
        {trend && (
          <div className={`metric-trend ${trend > 0 ? 'text-success' : 'text-danger'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      {subtext && <div className="metric-subtext">{subtext}</div>}
    </div>
  );
};

export default MetricCard;
