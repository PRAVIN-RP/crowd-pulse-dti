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
  const [serialStatus, setSerialStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  const [port, setPort] = useState(null);

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

    // Poll every 3 seconds if not using serial
    let interval;
    if (serialStatus !== 'connected') {
      interval = setInterval(fetchSensorData, 3000);
      fetchSensorData(); // Initial fetch
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, serialStatus]);

  const connectSerial = async () => {
    if (!('serial' in navigator)) {
      alert("Web Serial API not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      setSerialStatus('connecting');
      const selectedPort = await navigator.serial.requestPort();
      await selectedPort.open({ baudRate: 9600 });
      setPort(selectedPort);
      setSerialStatus('connected');
      readSerialData(selectedPort);
    } catch (err) {
      console.error("Error connecting to serial port:", err);
      setSerialStatus('error');
    }
  };

  const disconnectSerial = async () => {
    if (port) {
      try {
        await port.close();
        setPort(null);
        setSerialStatus('disconnected');
      } catch(err) {
        console.error("Error closing port", err);
      }
    }
  };

  const readSerialData = async (activePort) => {
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = activePort.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep incomplete line in buffer

          for (const line of lines) {
            try {
              const dataStr = line.trim();
              if (dataStr.startsWith('{') && dataStr.endsWith('}')) {
                const parsed = JSON.parse(dataStr);
                
                setSensorData(prev => {
                  const newHistory = [...prev.history, {
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    people: parsed.peopleCount || 0,
                    temp: parsed.temperature || 0
                  }].slice(-20);

                  return {
                    ...prev,
                    ...parsed,
                    history: newHistory
                  };
                });

                // Send to backend so history/logs are tracked
                if (user?.token) {
                   fetch('/api/sensor', {
                     method: 'POST',
                     headers: { 
                       'Content-Type': 'application/json',
                       Authorization: `Bearer ${user.token}` 
                     },
                     body: JSON.stringify(parsed)
                   }).catch(e => console.error("Error sending serial data to backend", e));
                }
              }
            } catch(e) {
              console.log("Error parsing serial line:", line, e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading from serial port:', error);
      setSerialStatus('error');
    } finally {
      reader.releaseLock();
    }
  };

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
      isOvercrowded: sensorData.peopleCount >= maxCrowdLimit,
      connectSerial,
      disconnectSerial,
      serialStatus
    }}>
      {children}
    </DashboardContext.Provider>
  );
};
