import { Thermometer, Droplets, Wind, HeartPulse } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import './EnvironmentGauges.css';

/**
 * EnvironmentGauges — Animated arc gauges for temperature, humidity,
 * body-temp, and a derived "comfort index".
 */
const Arc = ({ value, min, max, color, label, icon: Icon, unit, warnAt }) => {
  const pct    = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angle  = pct * 180;  // 0–180 degrees
  const rad    = (angle - 180) * (Math.PI / 180);
  const R      = 44;
  const cx     = 60, cy = 54;

  // Arc path: semi-circle from left (180°) to right (0°)
  const describeArc = (pctEnd) => {
    const endAngle = pctEnd * 180 - 180;
    const ex = cx + R * Math.cos(endAngle * Math.PI / 180);
    const ey = cy + R * Math.sin(endAngle * Math.PI / 180);
    const largeArc = pctEnd > 0.5 ? 1 : 0;
    return `M ${cx - R} ${cy} A ${R} ${R} 0 ${largeArc} 1 ${ex} ${ey}`;
  };

  // Needle tip
  const nx = cx + (R - 6) * Math.cos(rad);
  const ny = cy + (R - 6) * Math.sin(rad);
  const isWarn = warnAt != null && value >= warnAt;

  return (
    <div className="env-gauge">
      <svg viewBox="0 0 120 68" className="gauge-svg">
        <defs>
          <filter id={`glow-${label}`}>
            <feGaussianBlur stdDeviation="2" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <path d={`M ${cx-R} ${cy} A ${R} ${R} 0 0 1 ${cx+R} ${cy}`}
          fill="none" stroke="var(--border-color)" strokeWidth="8" strokeLinecap="round"/>
        {/* Fill */}
        <path d={describeArc(pct)}
          fill="none" stroke={isWarn ? 'var(--warning)' : color}
          strokeWidth="8" strokeLinecap="round"
          filter={`url(#glow-${label})`}
          style={{ transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)' }}/>
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={isWarn ? 'var(--warning)' : 'var(--text-primary)'}
          strokeWidth="2" strokeLinecap="round"
          style={{ transition: 'all 0.8s cubic-bezier(0.22,1,0.36,1)', transformOrigin: `${cx}px ${cy}px` }}/>
        <circle cx={cx} cy={cy} r="3.5" fill={isWarn ? 'var(--warning)' : color}/>
        {/* Value text */}
        <text x="50%" y="48" textAnchor="middle" fill="var(--text-primary)"
          fontSize="14" fontWeight="800" fontFamily="Space Grotesk, sans-serif">
          {value}{unit}
        </text>
      </svg>
      <div className="gauge-label">
        <Icon size={13} style={{ color }} />
        <span>{label}</span>
      </div>
    </div>
  );
};

const EnvironmentGauges = () => {
  const { sensorData } = useDashboard();

  // Derived comfort index (0-100): temp & humidity combined
  const tempScore = Math.max(0, 100 - Math.abs(sensorData.temperature - 22) * 5);
  const humScore  = Math.max(0, 100 - Math.abs(sensorData.humidity - 45) * 2);
  const comfort   = Math.round((tempScore * 0.6 + humScore * 0.4));
  const comfortLabel = comfort >= 80 ? 'Excellent' : comfort >= 60 ? 'Good' : comfort >= 40 ? 'Mild' : 'Poor';

  return (
    <div className="env-gauges card">
      <div className="card-header pb-2 border-bottom">
        <h3>🌡️ Environmental Vitals</h3>
        <span className="badge badge-primary text-xs">{comfortLabel} Environment</span>
      </div>

      <div className="gauges-row">
        <Arc value={sensorData.temperature} min={10} max={45}
          color="var(--warning)" label="Room Temp" icon={Thermometer} unit="°C" warnAt={30} />

        <Arc value={sensorData.humidity} min={0} max={100}
          color="var(--primary)" label="Humidity" icon={Droplets} unit="%" warnAt={70} />

        <Arc value={sensorData.bodyTemperatureAvg ?? 36.5} min={35} max={40}
          color="var(--danger)" label="Body Temp" icon={HeartPulse} unit="°C" warnAt={37.5} />

        <Arc value={comfort} min={0} max={100}
          color="var(--success)" label="Comfort Index" icon={Wind} unit="" />
      </div>

      {/* Horizontal bar summary */}
      <div className="env-bars">
        {[
          { label: 'Temperature', val: sensorData.temperature, min: 10, max: 45, color: 'var(--warning)' },
          { label: 'Humidity',    val: sensorData.humidity,    min: 0,  max: 100, color: 'var(--primary)' },
        ].map(({ label, val, min, max, color }) => {
          const p = Math.round(((val - min) / (max - min)) * 100);
          return (
            <div key={label} className="env-bar-row">
              <span className="env-bar-label">{label}</span>
              <div className="env-bar-track">
                <div className="env-bar-fill" style={{ width: `${p}%`, backgroundColor: color }} />
              </div>
              <span className="env-bar-val" style={{ color }}>{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnvironmentGauges;
