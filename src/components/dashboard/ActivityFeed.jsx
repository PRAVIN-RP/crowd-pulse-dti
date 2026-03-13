import { useEffect, useRef, useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Wifi, Thermometer, Users, Eye } from 'lucide-react';
import './ActivityFeed.css';

const EVENT_ICONS = {
  alert:   { Icon: AlertTriangle,  color: 'var(--danger)'  },
  surge:   { Icon: TrendingUp,     color: 'var(--warning)' },
  calm:    { Icon: TrendingDown,   color: 'var(--success)' },
  sensor:  { Icon: Wifi,           color: 'var(--primary)' },
  temp:    { Icon: Thermometer,    color: 'var(--warning)' },
  people:  { Icon: Users,          color: 'var(--primary)' },
  camera:  { Icon: Eye,            color: 'var(--success)' },
  resolve: { Icon: CheckCircle2,   color: 'var(--success)' },
};

const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const ActivityFeed = () => {
  const { sensorData, alerts, maxCrowdLimit } = useDashboard();
  const [events, setEvents] = useState([]);
  const feedRef = useRef(null);
  const prevRef = useRef({ count: null, temp: null, alertLen: 0 });

  const push = (type, message) => {
    setEvents(prev => [
      { id: Date.now() + Math.random(), type, message, ts: new Date() },
      ...prev.slice(0, 49),
    ]);
  };

  // Seed on first load
  useEffect(() => {
    push('sensor', 'IoT sensor stream established');
    push('camera', 'Camera AI node online — Zone A');
  }, []);

  // React to sensor data changes
  useEffect(() => {
    const prev = prevRef.current;
    const count = sensorData.peopleCount;
    const temp  = sensorData.temperature;

    if (prev.count !== null) {
      const delta = count - prev.count;
      if (delta >= 5)  push('surge',  `Crowd surge: +${delta} people detected (now ${count})`);
      if (delta <= -5) push('calm',   `Crowd easing: ${delta} people left (now ${count})`);
      if (count >= maxCrowdLimit) push('alert', `⚠ CAPACITY BREACH: ${count}/${maxCrowdLimit} in Zone A`);
      if (temp !== prev.temp && Math.abs(temp - (prev.temp ?? temp)) > 1)
        push('temp', `Temperature shift: ${temp}°C`);
    } else {
      push('people', `Live count: ${count} people in facility`);
    }

    prevRef.current = { count, temp, alertLen: alerts.length };
  }, [sensorData.peopleCount, sensorData.temperature]);

  // React to new alerts
  useEffect(() => {
    const prev = prevRef.current;
    if (alerts.length > prev.alertLen) {
      const latest = alerts[0];
      push('alert', latest?.message ?? 'New system alert triggered');
      prevRef.current = { ...prevRef.current, alertLen: alerts.length };
    }
  }, [alerts.length]);

  // Auto-scroll to top - throttled for better performance
  useEffect(() => {
    if (feedRef.current) {
      // Use setTimeout to throttle the scroll for smoother performance
      setTimeout(() => {
        if (feedRef.current) {
          feedRef.current.scrollTop = 0;
        }
      }, 50);
    }
  }, [events.length]);

  return (
    <div className="activity-feed card">
      <div className="card-header pb-2 border-bottom" style={{ marginBottom: 0 }}>
        <h3><span className="mr-2">⚡</span>Live Activity Feed</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="live-indicator">● LIVE</span>
          <span className="text-muted text-xs">{events.length} events</span>
        </div>
      </div>

      <div className="feed-scroll" ref={feedRef}>
        {events.length === 0 && (
          <p className="text-muted text-center text-sm" style={{ padding: '2rem' }}>
            Waiting for events…
          </p>
        )}
        {events.map((ev, i) => {
          const { Icon, color } = EVENT_ICONS[ev.type] ?? EVENT_ICONS.sensor;
          return (
            <div key={ev.id} className={`feed-item ${i === 0 ? 'feed-item--new' : ''}`}>
              <div className="feed-icon" style={{ '--icon-color': color }}>
                <Icon size={14} />
              </div>
              <div className="feed-text">
                <p className="feed-message">{ev.message}</p>
                <span className="feed-time">{fmt(ev.ts)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;
