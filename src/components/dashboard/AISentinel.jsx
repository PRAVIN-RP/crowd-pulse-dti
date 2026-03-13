import { useEffect, useRef, useState } from 'react';
import { BrainCircuit, TrendingUp, TrendingDown, Minus, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import './AISentinel.css';

/**
 * AISentinel — AI Confidence Ring + Threat Matrix
 * Shows the AI prediction confidence as an animated SVG arc ring,
 * colour-coded by risk level, plus a 3×3 threat decision matrix.
 */
const AISentinel = () => {
  const { aiPrediction, sensorData, maxCrowdLimit } = useDashboard();
  const [animatedPct, setAnimatedPct] = useState(0);
  const rafRef = useRef(null);

  const confidence = aiPrediction?.confidence ?? 85;
  const riskLevel  = aiPrediction?.riskLevel ?? 'Low';
  const forecast   = aiPrediction?.forecastedCount ?? sensorData.peopleCount;
  const suggestion = aiPrediction?.suggestion ?? 'Monitoring nominal.';

  // Risk colours
  const riskColor = riskLevel === 'High' ? 'var(--danger)' :
                    riskLevel === 'Medium' ? 'var(--warning)' : 'var(--success)';
  const RiskIcon  = riskLevel === 'High' ? ShieldX :
                    riskLevel === 'Medium' ? ShieldAlert : ShieldCheck;

  // SVG ring math
  const R   = 52;
  const CX  = 64;
  const CY  = 64;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference - (animatedPct / 100) * circumference;

  // Animate the ring on confidence change
  useEffect(() => {
    let start = null;
    const from = animatedPct;
    const to   = confidence;
    const dur  = 900;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPct(from + (to - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [confidence]);

  // Micro threat matrix for the next 3 x 3 time windows
  const matrix = [
    { label: 'Now',     pct: Math.round((sensorData.peopleCount / maxCrowdLimit) * 100) },
    { label: '+10m',    pct: Math.min(100, Math.round((forecast / maxCrowdLimit) * 100)) },
    { label: '+20m',    pct: Math.min(100, Math.round((forecast * 1.08 / maxCrowdLimit) * 100)) },
    { label: '+30m',    pct: Math.min(100, Math.round((forecast * 1.12 / maxCrowdLimit) * 100)) },
    { label: '+40m',    pct: Math.min(100, Math.round((forecast * 1.05 / maxCrowdLimit) * 100)) },
    { label: '+50m',    pct: Math.min(100, Math.round((forecast * 0.97 / maxCrowdLimit) * 100)) },
    { label: '+60m',    pct: Math.min(100, Math.round((forecast * 0.90 / maxCrowdLimit) * 100)) },
    { label: '+70m',    pct: Math.min(100, Math.round((forecast * 0.83 / maxCrowdLimit) * 100)) },
    { label: '+80m',    pct: Math.min(100, Math.round((forecast * 0.75 / maxCrowdLimit) * 100)) },
  ];

  const cellColor = (p) =>
    p >= 90 ? 'var(--danger)' : p >= 60 ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="ai-sentinel card">
      <div className="card-header pb-2 border-bottom">
        <h3><BrainCircuit size={17} className="mr-2 inline" />AI Sentinel — Confidence Ring</h3>
        <span className="live-indicator">● LIVE</span>
      </div>

      <div className="sentinel-body">
        {/* Ring */}
        <div className="ring-wrapper">
          <svg width="128" height="128" viewBox="0 0 128 128" className="ring-svg">
            {/* Background track */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border-color)" strokeWidth="10" />
            {/* Glow filter */}
            <defs>
              <filter id="ring-glow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* Progress arc */}
            <circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={riskColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${CX} ${CY})`}
              filter="url(#ring-glow)"
              style={{ transition: 'stroke 0.5s' }}
            />
            {/* Centre text */}
            <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle"
              fill="var(--text-primary)" fontSize="20" fontWeight="800" fontFamily="Space Grotesk, sans-serif">
              {Math.round(animatedPct)}%
            </text>
            <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle"
              fill="var(--text-muted)" fontSize="9" fontWeight="600" letterSpacing="1">
              CONFIDENCE
            </text>
          </svg>

          {/* Risk badge */}
          <div className="risk-badge" style={{ '--risk-color': riskColor }}>
            <RiskIcon size={14} />
            <span>{riskLevel.toUpperCase()} RISK</span>
          </div>
        </div>

        {/* Suggestions & forecast */}
        <div className="sentinel-detail">
          <div className="forecast-row">
            <span className="forecast-label">Projected +10min</span>
            <span className="forecast-value" style={{ color: riskColor }}>
              {forecast} <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 400 }}>/ {maxCrowdLimit}</span>
            </span>
          </div>
          <p className="sentinel-suggestion">{suggestion}</p>

          {/* 3×3 Predictive Matrix Grid */}
          <div className="matrix-grid">
            {matrix.map((cell) => (
              <div key={cell.label} className="matrix-cell"
                style={{ '--cell-color': cellColor(cell.pct), '--cell-pct': `${cell.pct}%` }}>
                <div className="cell-fill" />
                <span className="cell-label">{cell.label}</span>
                <span className="cell-pct">{cell.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISentinel;
