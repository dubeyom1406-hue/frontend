// Firebase Client Configuration (Configured by User)
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAsaurz_Sr2W0K56wJDGD9sOrRD2DLWEdk",
  authDomain: "webr-b1960.firebaseapp.com",
  projectId: "webr-b1960",
  storageBucket: "webr-b1960.firebasestorage.app",
  messagingSenderId: "969561197528",
  appId: "1:969561197528:web:1efa2c24ce62b2c2b5c0ad",
  measurementId: "G-D7GDE9K8KN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };
export default app;
