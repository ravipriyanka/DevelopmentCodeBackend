require('dotenv').config();

// Simple config file
const config = {
    port: process.env.PORT || 3000,

    // Database
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'Root@12345',
        name: process.env.DB_NAME || 'hotel_booking_db'
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES || '7d'
    },

    // Google API
    google: {
        apiKey: process.env.GOOGLE_API_KEY || '',
        baseUrl: 'https://maps.googleapis.com/maps/api/place'
    },

    // TBO API
    tbo: {
        apiUrl: process.env.TBO_API_URL || 'https://api.tbotechnology.in/TBOHolidays_HotelAPI',
        username: process.env.TBO_USERNAME || '',
        password: process.env.TBO_PASSWORD || '',
        clientId: process.env.TBO_CLIENT_ID || ''
    },

    // Firebase
    firebase: {
        apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyA1ht4djtSyHKp9Iwfv2AFmX-1hcXYjcQA',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'goodweeksluxury.firebaseapp.com',
        projectId: process.env.FIREBASE_PROJECT_ID || 'goodweeksluxury',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'goodweeksluxury.firebasestorage.app',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '715794249710',
        appId: process.env.FIREBASE_APP_ID || '1:715794249710:web:eea2fc541d1a5c58c740ff'
    }
};

module.exports = config;






