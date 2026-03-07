// Simulated IoT Sensor Data Generator

let pollingInterval = null;

// Initial logical state
let currentPeopleCount = 45;
let currentTemp = 24.5;
let currentHumidity = 45.2;

export const startSensorPolling = (onDataReceived) => {
  if (pollingInterval) return;

  pollingInterval = setInterval(() => {
    // Simulate entry/exit via VL53L0X
    const entryProbability = Math.random();
    let entryDistance = 1200;
    let exitDistance = 1200;
    
    if (entryProbability > 0.6) {
      currentPeopleCount += 1; // Someone entered
      entryDistance = Math.floor(Math.random() * 400) + 200; // 200-600mm
    } else if (entryProbability < 0.3 && currentPeopleCount > 0) {
      currentPeopleCount -= 1; // Someone left
      exitDistance = Math.floor(Math.random() * 400) + 200;
    }

    // Simulate DHT22 Environmental changes (slow drift)
    currentTemp += (Math.random() - 0.5) * 0.2;
    currentHumidity += (Math.random() - 0.5) * 0.5;

    // Simulate MLX90614 Body Temp (average of people, normally distributed around 36.6)
    const bodyTemp = 36.4 + (Math.random() * 0.5);

    onDataReceived({
      peopleCount: currentPeopleCount,
      temperature: Number(currentTemp.toFixed(1)),
      humidity: Number(currentHumidity.toFixed(1)),
      bodyTemperatureAvg: Number(bodyTemp.toFixed(1)),
      lastEntryDistance: entryDistance,
      lastExitDistance: exitDistance
    });

  }, 3000); // Polling every 3 seconds
};

export const stopSensorPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
};
