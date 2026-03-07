import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwQDgzdqdsVdYw1pb2RAXSF18_BHK0aMy",
  authDomain: "crowdpulse-d561c.firebaseapp.com",
  projectId: "crowdpulse-d561c",
  storageBucket: "crowdpulse-d561c.firebasestorage.app",
  messagingSenderId: "666311741977",
  appId: "1:666311741977:web:adba7e86ee99ddfa985088",
  measurementId: "G-E4M34NZTHJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
