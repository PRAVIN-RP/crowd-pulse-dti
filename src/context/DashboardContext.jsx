import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';

const DashboardContext = createContext();

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const [maxCrowdLimit, setMaxCrowdLimit] = useState(100);
  const [warningLimit, setWarningLimit] = useState(75);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
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
  const [socketConnected, setSocketConnected] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const [cameraNodes, setCameraNodes] = useState([{ id: 'cam-main', name: 'Zone A Camera', count: 0 }]);
  const [cameraCount, setCameraCount] = useState(0); // Aggregate Total AI Tracking Metric
  const cameraCountRef = useRef(0); // For socket closure access

  // Sync ref with state
  useEffect(() => {
    cameraCountRef.current = cameraCount;
  }, [cameraCount]);

  const [aiPrediction, setAiPrediction] = useState({ forecastedCount: 0, riskLevel: 'Low', suggestion: 'Normal operation.' });

  useEffect(() => {
    if (!user?.token) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMaxCrowdLimit(data.maxCrowdLimit || 100);
          setWarningLimit(data.warningLimit || 75);
          setIsEmergencyMode(data.isEmergencyMode || false);
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
            temp: newData.temperature,
            camera: cameraCountRef.current,
            fused: Math.max(newData.peopleCount, cameraCountRef.current)
          }].slice(-20);

          setSensorData({ ...newData, history: historyCache });
        }
      } catch (err) {
        console.error("Error fetching sensor data:", err);
      }
    };

    fetchSensorData(); // Initial fetch

    // Setup Socket.IO connection instead of 3s polling
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to real-time socket server');
      setSocketConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setSocketConnected(false);
    });

    newSocket.on('sensor_data', (newData) => {
      // Only merge if we aren't using the local USB Serial
      setSerialStatus(status => {
        if (status !== 'connected') {
          setSensorData(prev => {
            const newHist = [...prev.history, {
              time: new Date(newData.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              people: newData.peopleCount,
              temp: newData.temperature,
              camera: cameraCountRef.current,
              fused: Math.max(newData.peopleCount, cameraCountRef.current)
            }].slice(-20);

            return { ...prev, ...newData, history: newHist };
          });
        }
        return status;
      });
    });

    newSocket.on('admin_broadcast', (broadcast) => {
      setActiveBroadcast(broadcast);
    });

    newSocket.on('emergency_status', (status) => {
      setIsEmergencyMode(status);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, serialStatus]);

  // AI Prediction Engine (Calculates forecasted capacity using velocity of history array)
  useEffect(() => {
    if (sensorData.history.length < 5) return;

    // Linear regression proxy: get start vs current
    const recentHistory = sensorData.history.slice(-10); // Look at last 10 points
    const startObj = recentHistory[0];
    const endObj = recentHistory[recentHistory.length - 1];

    const countDiff = endObj.fused - startObj.fused;
    // Assuming 1 data point = approx 3 seconds, meaning 10 points = 30 seconds.
    // To predict 10 minutes out (600 seconds) -> multiply by 20.
    let velocity = (countDiff / recentHistory.length) * 20;

    let forecast = Math.max(0, Math.floor(endObj.fused + velocity));

    let risk = 'Low';
    let sug = 'System normal. No action required.';

    if (countDiff >= 15) {
      risk = 'High';
      sug = 'CRITICAL SURGE DETECTED: Rapid crowd influx! Immediate dispersion required.';
    } else if (forecast >= maxCrowdLimit) {
      risk = 'High';
      sug = 'Critical: Crowd projected to exceed maximum capacity. Prepare redirection protocols.';
    } else if (forecast >= warningLimit) {
      risk = 'Medium';
      sug = 'Notice: Crowd growing steadily. Consider opening additional lanes.';
    }

    setAiPrediction({
      forecastedCount: forecast,
      riskLevel: risk,
      suggestion: sug
    });
  }, [sensorData.history, maxCrowdLimit, warningLimit]);

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
      } catch (err) {
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
                    temp: parsed.temperature || 0,
                    camera: cameraCountRef.current,
                    fused: Math.max(parsed.peopleCount || 0, cameraCountRef.current)
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
            } catch (e) {
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

  const updateSettings = async (updates) => {
    if (!user?.token) return;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.maxCrowdLimit) setMaxCrowdLimit(data.maxCrowdLimit);
        if (data.warningLimit) setWarningLimit(data.warningLimit);
        if (data.isEmergencyMode !== undefined) setIsEmergencyMode(data.isEmergencyMode);
      } else {
        alert("Failed to update settings. Admin access required.");
      }
    } catch (err) {
      console.error("Error updating settings:", err);
    }
  };

  // Check for alerts and fire system log if triggered
  useEffect(() => {
    const fusedCount = Math.max(sensorData.peopleCount, cameraCount);
    
    // 1. Surge Detection Logic
    let isSurge = false;
    if (sensorData.history.length >= 10) {
        const recentHistory = sensorData.history.slice(-10);
        const countDiff = recentHistory[recentHistory.length - 1].fused - recentHistory[0].fused;
        if (countDiff >= 15) isSurge = true;
    }

    // 2. Data Verification Drift Detection
    let isDrift = false;
    if (fusedCount >= 10 && Math.abs(sensorData.peopleCount - cameraCount) / fusedCount > 0.3) {
        isDrift = true;
    }

    const needsCrowdAlert = fusedCount >= maxCrowdLimit;

    const hasCrowdAlert = alerts.some(a => a.id === 'crowd-limit');
    const hasSurgeAlert = alerts.some(a => a.id === 'surge-limit');
    const hasDriftAlert = alerts.some(a => a.id === 'drift-limit');

    if (needsCrowdAlert !== hasCrowdAlert || isSurge !== hasSurgeAlert || isDrift !== hasDriftAlert) {
        setAlerts(prev => {
           let newAlerts = [...prev];

           if (needsCrowdAlert && !hasCrowdAlert) {
               newAlerts.unshift({ id: 'crowd-limit', type: 'danger', message: `CRITICAL: Overcrowding detected! Count (${fusedCount}) exceeds limit of ${maxCrowdLimit}.`, timestamp: new Date() });
           } else if (!needsCrowdAlert && hasCrowdAlert) {
               newAlerts = newAlerts.filter(a => a.id !== 'crowd-limit');
           }

           if (isSurge && !hasSurgeAlert) {
               newAlerts.unshift({ id: 'surge-limit', type: 'danger', message: `SURGE ALERT: Rapid crowd growth detected (+15 people in 30s)!`, timestamp: new Date() });
           } else if (!isSurge && hasSurgeAlert) {
               newAlerts = newAlerts.filter(a => a.id !== 'surge-limit');
           }

           if (isDrift && !hasDriftAlert) {
               newAlerts.unshift({ id: 'drift-limit', type: 'warning', message: `HARDWARE DISCREPANCY: Sensored count (${sensorData.peopleCount}) and AI mapping (${cameraCount}) mismatch heavily. Validating via highest value.`, timestamp: new Date() });
           } else if (!isDrift && hasDriftAlert) {
               newAlerts = newAlerts.filter(a => a.id !== 'drift-limit');
           }

           return newAlerts;
        });

        // Push to server log unconditionally when any major safety status engages
        if (user?.token) {
           if (needsCrowdAlert && !hasCrowdAlert) {
              fetch('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ action: 'ALERT_TRIGGERED', message: `CRITICAL: Overcrowding detected! Count (${fusedCount})`, level: 'danger' }) });
           }
           if (isSurge && !hasSurgeAlert) {
              fetch('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` }, body: JSON.stringify({ action: 'ALERT_TRIGGERED', message: `SURGE ALERT: Rapid crowd growth observed.`, level: 'danger' }) });
           }
        }
    }
  }, [sensorData.peopleCount, cameraCount, maxCrowdLimit, sensorData.history, alerts, user]);

  const updateCameraNode = (id, newCount) => {
     setCameraNodes(prev => {
        const updated = prev.map(c => c.id === id ? { ...c, count: newCount } : c);
        const total = updated.reduce((sum, c) => sum + c.count, 0);
        setCameraCount(total);
        return updated;
     });
  };

  return (
    <DashboardContext.Provider value={{
      sensorData,
      maxCrowdLimit,
      warningLimit,
      updateSettings,
      alerts,
      isOvercrowded: sensorData.peopleCount >= maxCrowdLimit,
      connectSerial,
      disconnectSerial,
      serialStatus,
      socketConnected,
      darkMode,
      setDarkMode,
      activeBroadcast,
      setActiveBroadcast,
      isEmergencyMode,
      aiPrediction,
      cameraCount,
      cameraNodes,
      updateCameraNode
    }}>
      {children}
    </DashboardContext.Provider>
  );
};
