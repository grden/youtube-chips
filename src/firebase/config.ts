// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAZPRJEAp8gC0ylKXfx-9xqU-W1ApNDGsQ",
  authDomain: "chips-a62e5.firebaseapp.com",
  projectId: "chips-a62e5",
  storageBucket: "chips-a62e5.firebasestorage.app",
  messagingSenderId: "863952740787",
  appId: "1:863952740787:web:61d14e70be34c6a40c2bc6",
  measurementId: "G-DJLSC25TJV"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);