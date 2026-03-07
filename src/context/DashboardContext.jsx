import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DashboardContext = createContext();

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const [maxCrowdLimit, setMaxCrowdLimit] = useState(100);
  const [sensorData, setSensorData] = useState({
    peopleCount: 0,
    temperature: 0,
    humidity: 0,
    bodyTemperatureAvg: 0,
    history: []
  });

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!user?.token) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMaxCrowdLimit(data.maxCrowdLimit);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };

    fetchSettings();
  }, [user]);

  useEffect(() => {
    if (!user?.token) return;

    let historyCache = [];

    const fetchSensorData = async () => {
      try {
        const res = await fetch('/api/sensor/latest', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          const newData = await res.json();
          
          historyCache = [...historyCache, { 
            time: new Date(newData.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
            people: newData.peopleCount,
            temp: newData.temperature
          }].slice(-20);

          setSensorData({ ...newData, history: historyCache });
        }
      } catch (err) {
        console.error("Error fetching sensor data:", err);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(fetchSensorData, 3000);
    fetchSensorData(); // Initial fetch

    return () => clearInterval(interval);
  }, [user]);

  const updateSettings = async (newLimit) => {
    if (!user?.token) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ maxCrowdLimit: newLimit })
      });
      if (res.ok) {
        const data = await res.json();
        setMaxCrowdLimit(data.maxCrowdLimit);
      } else {
        alert("Failed to update settings. Admin access required.");
      }
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  };

  // Check for alerts
  useEffect(() => {
    const hasAlert = alerts.some(a => a.id === 'crowd-limit');

    if (sensorData.peopleCount >= maxCrowdLimit) {
      if (!hasAlert) {
        setAlerts(prev => [{
          id: 'crowd-limit',
          type: 'danger',
          message: `CRITICAL: Overcrowding detected! Count (${sensorData.peopleCount}) exceeds limit of ${maxCrowdLimit}.`,
          timestamp: new Date()
        }, ...prev]);
      }
    } else {
      if (hasAlert) {
        setAlerts(prev => prev.filter(a => a.id !== 'crowd-limit'));
      }
    }
  }, [sensorData.peopleCount, maxCrowdLimit, alerts]);

  return (
    <DashboardContext.Provider value={{
      sensorData,
      maxCrowdLimit,
      updateSettings,
      alerts,
      isOvercrowded: sensorData.peopleCount >= maxCrowdLimit
    }}>
      {children}
    </DashboardContext.Provider>
  );
};
