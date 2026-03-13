import { useState } from 'react';
import { Megaphone, ShieldAlert, DoorOpen, Radio, CheckCircle2, Loader, RotateCcw } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import './QuickActions.css';

const PROTOCOLS = [
  {
    id: 'divert',
    icon: DoorOpen,
    label: 'Divert Crowd',
    description: 'Open secondary entrances and redirect flow to Zone B & C.',
    color: 'var(--primary)',
  },
  {
    id: 'broadcast',
    icon: Radio,
    label: 'PA Broadcast',
    description: 'Trigger a pre-recorded crowd management announcement.',
    color: 'var(--warning)',
  },
  {
    id: 'lockdown',
    icon: ShieldAlert,
    label: 'Lock Entries',
    description: 'Close all entry gates until occupancy drops below 80%.',
    color: 'var(--danger)',
  },
  {
    id: 'announce',
    icon: Megaphone,
    label: 'Alert Personnel',
    description: 'Push an urgent notification to all on-duty personnel.',
    color: 'var(--success)',
  },
];

const QuickActions = () => {
  const { setActiveBroadcast } = useDashboard();
  const { isAdmin } = useAuth();
  const [executing, setExecuting] = useState(null);
  const [done, setDone] = useState([]);

  const execute = async (p) => {
    if (!isAdmin) return;
    setExecuting(p.id);
    // simulate async action
    await new Promise(r => setTimeout(r, 1400));
    setExecuting(null);
    setDone(prev => [...prev, p.id]);

    // Push a broadcast for PA or Alert
    if (p.id === 'broadcast' || p.id === 'announce') {
      setActiveBroadcast({
        message: p.id === 'broadcast'
          ? 'Attention: The facility is operating at high capacity. Please use all available exits and move calmly.'
          : `Urgent: All on-duty personnel — crowd management protocol "${p.label}" has been activated.`,
        severity: p.id === 'lockdown' ? 'danger' : 'warning',
      });
    }

    setTimeout(() => setDone(prev => prev.filter(x => x !== p.id)), 4000);
  };

  const reset = () => { setDone([]); setExecuting(null); };

  return (
    <div className="quick-actions card">
      <div className="card-header pb-2 border-bottom">
        <h3>⚙️ Quick Response Protocols</h3>
        {done.length > 0 && (
          <button className="reset-btn" onClick={reset}>
            <RotateCcw size={13} /> Reset
          </button>
        )}
      </div>
      {!isAdmin && (
        <p className="text-muted text-sm" style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>
          Only administrators can execute response protocols.
        </p>
      )}
      <div className="qa-grid">
        {PROTOCOLS.map(p => {
          const Icon    = p.icon;
          const loading = executing === p.id;
          const isDone  = done.includes(p.id);
          return (
            <button
              key={p.id}
              className={`qa-btn ${loading ? 'qa-btn--loading' : ''} ${isDone ? 'qa-btn--done' : ''}`}
              style={{ '--btn-color': p.color }}
              onClick={() => execute(p)}
              disabled={!isAdmin || !!executing || isDone}
            >
              <div className="qa-icon">
                {loading ? <Loader size={20} className="spin" />
                  : isDone ? <CheckCircle2 size={20} />
                  : <Icon size={20} />}
              </div>
              <div className="qa-text">
                <span className="qa-label">{p.label}</span>
                <span className="qa-desc">{p.description}</span>
              </div>
              {isDone && <span className="qa-done-tag">Executed</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
