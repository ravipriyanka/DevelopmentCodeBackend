const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "AIzaSyA1ht4djtSyHKp9Iwfv2AFmX-1hcXYjcQA",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "goodweeksluxury.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "goodweeksluxury",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "goodweeksluxury.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "715794249710",
    appId: process.env.FIREBASE_APP_ID || "1:715794249710:web:eea2fc541d1a5c58c740ff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

module.exports = { app, auth, firebaseConfig };

