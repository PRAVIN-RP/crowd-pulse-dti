import { useState } from 'react';
import { AlertTriangle, Send, MapPin, CheckCircle, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './IncidentReport.css';

const ZONES = ['Zone-A (Main Hall)', 'Zone-B (Entrance)', 'Zone-C (Exit Gates)'];
const SEVERITIES = [
  { value: 'low', label: 'Low — Minor issue', color: 'var(--success)' },
  { value: 'medium', label: 'Medium — Needs attention', color: 'var(--warning)' },
  { value: 'high', label: 'High — Urgent response', color: 'var(--danger)' },
];
const INCIDENT_TYPES = [
  'Crowd blocking exit',
  'Physical altercation',
  'Medical emergency',
  'Equipment malfunction',
  'Unauthorized access',
  'Fire / smoke detected',
  'Other',
];

const IncidentReport = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [zone, setZone] = useState(ZONES[0]);
  const [severity, setSeverity] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [myReports, setMyReports] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify({ title, description, zone, severity }),
      });
      if (res.ok) {
        const data = await res.json();
        setMyReports(prev => [data, ...prev]);
        setSubmitted(true);
        setTitle(''); setDescription(''); setZone(ZONES[0]); setSeverity('medium');
        setTimeout(() => setSubmitted(false), 4000);
      } else {
        const d = await res.json();
        setError(d.message || 'Submission failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/incidents', { headers: { Authorization: `Bearer ${user.token}` } });
      if (res.ok) {
        const all = await res.json();
        setMyReports(all.filter(r => r.reportedById === user._id));
      }
    } catch {}
    setShowHistory(true);
  };

  const statusColor = (s) => s === 'resolved' ? 'var(--success)' : s === 'acknowledged' ? 'var(--primary)' : 'var(--warning)';

  return (
    <div className="incident-page animate-fade-in">
      <header className="page-header pb-4 border-bottom mb-6">
        <div>
          <h1 className="page-title">Incident Report</h1>
          <p className="page-subtitle">Report ground incidents to the command center immediately</p>
        </div>
        <button
          className="btn outline border text-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={loadHistory}
        >
          <ClipboardList size={18} /> My Reports
        </button>
      </header>

      <div className="incident-layout">
        {/* Submission Form */}
        <div className="card incident-form-card">
          <h3 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} className="text-warning" /> New Incident Report
          </h3>

          {submitted && (
            <div className="alert-success mb-4 animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', color: 'var(--success)' }}>
              <CheckCircle size={20} /> Report submitted successfully! The admin team has been notified.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group-col mb-4">
              <label className="font-bold mb-1" style={{ display: 'block' }}>Incident Type</label>
              <select className="input-field" value={title} onChange={e => setTitle(e.target.value)} required>
                <option value="">-- Select incident type --</option>
                {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="input-group-col">
                <label className="font-bold mb-1" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} /> Zone
                </label>
                <select className="input-field" value={zone} onChange={e => setZone(e.target.value)}>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div className="input-group-col">
                <label className="font-bold mb-1" style={{ display: 'block' }}>Severity Level</label>
                <select
                  className="input-field"
                  value={severity}
                  onChange={e => setSeverity(e.target.value)}
                  style={{ color: SEVERITIES.find(s => s.value === severity)?.color }}
                >
                  {SEVERITIES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group-col mb-4">
              <label className="font-bold mb-1" style={{ display: 'block' }}>Description</label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Describe what happened, location details, number of people involved..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {error && <p className="text-danger text-sm mb-3">{error}</p>}

            <button
              type="submit"
              className="btn-primary w-full"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={submitting}
            >
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit Incident Report'}
            </button>
          </form>
        </div>

        {/* My Report History */}
        {showHistory && (
          <div className="card animate-fade-in" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <h3 className="mb-4">My Submitted Reports</h3>
            {myReports.length === 0 ? (
              <p className="text-muted text-sm">No reports submitted yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myReports.map(r => (
                  <li key={r._id} className="border rounded p-3" style={{ borderLeft: `4px solid ${r.severity === 'high' ? 'var(--danger)' : r.severity === 'medium' ? 'var(--warning)' : 'var(--success)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p className="font-bold">{r.title}</p>
                        <p className="text-muted text-sm mt-1">{r.zone} • {new Date(r.timestamp).toLocaleString()}</p>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: `color-mix(in srgb, ${statusColor(r.status)} 15%, transparent)`, color: statusColor(r.status) }}>
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm mt-2">{r.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentReport;
