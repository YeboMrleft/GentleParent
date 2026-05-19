// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBchxRAoLU2d9LJ9xrv40jjvtStZSdvSOE",
  authDomain: "gentleparent-e4900.firebaseapp.com",
  projectId: "gentleparent-e4900",
  storageBucket: "gentleparent-e4900.firebasestorage.app",
  messagingSenderId: "506810468724",
  appId: "1:506810468724:web:fbe443ce932edefa750421",
  measurementId: "G-41ZC502919"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);