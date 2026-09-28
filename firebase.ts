import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "உன் API KEY",
  authDomain: "blood-line-navigator.firebaseapp.com",
  projectId: "blood-line-navigator",
  storageBucket: "blood-line-navigator.firebasestorage.app",
  messagingSenderId: "285224518506",
  appId: "1:285224518506:web:6753374881f28990c61b13",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);