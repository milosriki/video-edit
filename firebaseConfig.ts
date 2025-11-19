import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCamMhfOYNAqnKnK-nQ78f1u5o8VDx9IaU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ptd-fitness-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ptd-fitness-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ptd-fitness-demo.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "489769736562",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:489769736562:web:08dab8e996d315949665eb",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-B005380N01"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let functions;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);
  
  console.log('🔥 Firebase initialized successfully!');
  console.log('📦 Project ID:', firebaseConfig.projectId);
} catch (error) {
  console.warn('⚠️ Firebase initialization failed:', error);
}

export { auth, db, storage, functions };

// Initialize Analytics only if supported
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app);
      console.log('📊 Analytics initialized');
    }
  }).catch(() => {
    console.log('📊 Analytics not supported in this environment');
  });
}
export { analytics };

// Log Firebase initialization for testing
console.log('🔥 Firebase initialized successfully!');
console.log('📦 Project ID:', firebaseConfig.projectId);

export default app;
