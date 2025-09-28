// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA6EIBPLNxFnTGdLVM7OIenwh66WFFwzNI",
  authDomain: "website-5a446.firebaseapp.com",
  projectId: "website-5a446",
  storageBucket: "website-5a446.firebasestorage.app",
  messagingSenderId: "1004080337081",
  appId: "1:1004080337081:web:19f1c7be970f6b6987cb68",
  measurementId: "G-RPGCYQ14GS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
