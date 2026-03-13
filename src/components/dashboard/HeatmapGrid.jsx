import { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import './HeatmapGrid.css';

const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['06', '08', '10', '12', '14', '16', '18', '20', '22'];

/**
 * HeatmapGrid — weekly crowd density heatmap (GitHub-contribution style).
 * Intensity is simulated from realistic weekly patterns, with the current
 * live count injected into the current timeslot.
 */
const HeatmapGrid = () => {
  const { sensorData, maxCrowdLimit } = useDashboard();

  // Simulate realistic weekly pattern (0-1 intensity)
  const basePattern = useMemo(() => {
    return DAYS.map((_, d) => {
      return HOURS.map((_, h) => {
        const isWeekend = d >= 5;
        const peak      = isWeekend ? [3, 4, 5] : [2, 3, 4, 5]; // peak hour indices
        const isPeak    = peak.includes(h);
        const base      = isWeekend ? 0.45 : 0.3;
        const noise     = (Math.sin(d * 7 + h * 13) * 0.15 + 0.15);
        return Math.min(1, base + (isPeak ? 0.35 : 0) + noise);
      });
    });
  }, []);

  // Inject live data into current slot
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7;          // Mon=0
  const hourIdx  = HOURS.findIndex(h => parseInt(h) > now.getHours()) - 1;
  const liveIntensity = sensorData.peopleCount / maxCrowdLimit;

  const data = basePattern.map((row, d) =>
    row.map((v, h) => (d === todayIdx && h === Math.max(0, hourIdx) ? liveIntensity : v))
  );

  const color = (v) => {
    if (v >= 0.9) return 'var(--danger)';
    if (v >= 0.65) return 'var(--warning)';
    if (v >= 0.35) return 'var(--primary)';
    if (v >= 0.1)  return 'var(--success)';
    return 'var(--border-color)';
  };

  return (
    <div className="heatmap-grid card">
      <div className="card-header pb-2 border-bottom">
        <h3>📅 Weekly Crowd Density Heatmap</h3>
        <div style={{ display: 'flex', gap: '10px', fontSize: '0.7rem', alignItems: 'center' }}>
          {[['Low','var(--success)'], ['Moderate','var(--primary)'], ['High','var(--warning)'], ['Critical','var(--danger)']].map(([l,c]) => (
            <span key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c, display: 'inline-block' }} />
              {l}
            </span>
          ))}
        </div>
      </div>

      <div className="heatmap-body">
        {/* Hour labels */}
        <div className="hm-hour-labels">
          <div className="hm-corner" />
          {HOURS.map(h => <div key={h} className="hm-hour">{h}:00</div>)}
        </div>

        {/* Grid rows */}
        {DAYS.map((day, d) => (
          <div key={day} className="hm-row">
            <div className="hm-day">{day}</div>
            {data[d].map((v, h) => {
              const isNow = d === todayIdx && h === Math.max(0, hourIdx);
              return (
                <div
                  key={h}
                  className={`hm-cell ${isNow ? 'hm-cell--now' : ''}`}
                  style={{ '--cell-bg': color(v), '--cell-opacity': Math.max(0.15, v) }}
                  title={`${day} ${HOURS[h]}:00 — ${Math.round(v * 100)}% capacity`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeatmapGrid;
