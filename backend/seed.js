import { collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db } from './config/firebase.js';
import User from './models/User.js';

const seedData = async () => {
  try {
    console.log('Clearing existing data from Firestore...');
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const d of usersSnap.docs) await deleteDoc(doc(db, 'users', d.id));
    
    const settingsSnap = await getDocs(collection(db, 'settings'));
    for (const d of settingsSnap.docs) await deleteDoc(doc(db, 'settings', d.id));

    const sensorSnap = await getDocs(collection(db, 'sensorData'));
    for (const d of sensorSnap.docs) await deleteDoc(doc(db, 'sensorData', d.id));

    console.log('Seeding new data...');
    // Create Admin and User
    await User.create({ username: 'admin', password: 'password', role: 'admin' });
    await User.create({ username: 'user', password: 'password', role: 'user' });

    // Create default settings
    await addDoc(collection(db, 'settings'), { maxCrowdLimit: 150 });

    // Insert 1 random initial sensor row
    await addDoc(collection(db, 'sensorData'), {
      peopleCount: 45,
      temperature: 24.5,
      humidity: 45.2,
      bodyTemperatureAvg: 36.5,
      crowdStatus: 'SAFE',
      timestamp: Date.now()
    });

    console.log('Firebase Firestore successfully seeded!');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
