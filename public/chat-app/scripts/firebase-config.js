// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyB2pfSErajNgcMLJMR2NSDQBzKjNSwQPOY",
    authDomain: "flametalk-ceacf.firebaseapp.com",
    databaseURL: "https://flametalk-ceacf-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "flametalk-ceacf",
    storageBucket: "flametalk-ceacf.appspot.com",
    messagingSenderId: "1048153773684",
    appId: "1:1048153773684:web:8f6b11ed7d375cb0b92321",
    measurementId: "G-Y23QYFHZNS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app };
