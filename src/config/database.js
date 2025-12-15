const mysql = require('mysql2/promise');
const path = require('path');

// Load .env from project root
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Debug: Check if password is loaded
console.log('🔑 DB Config: Host=' + (process.env.DB_HOST || 'localhost') + ', User=' + (process.env.DB_USER || 'root') + ', Password=' + (process.env.DB_PASSWORD ? '***SET***' : 'NOT SET'));

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hotel_booking_db',
    waitForConnections: true,
    connectionLimit: 10
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        return false;
    }
};

module.exports = { pool, testConnection, dbConfig };
