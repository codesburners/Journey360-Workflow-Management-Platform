import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  GoogleAuthProvider,
} from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyDSc7ePpHZqBtwNz_deEUTztwOy5eLuQn4",
  authDomain: "journey360-b10b9.firebaseapp.com",
  projectId: "journey360-b10b9",
  storageBucket: "journey360-b10b9.firebasestorage.app",
  messagingSenderId: "838228316352",
  appId: "1:838228316352:web:077c81ed8ec51e51b15d25"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
setPersistence(auth, browserSessionPersistence);