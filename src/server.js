const express = require('express');
const cors = require('cors');
require('dotenv').config();

const config = require('./config/config');
const { testConnection } = require('./config/database');
const { createUsersTable } = require('./models/userModel');

// Import routes
const googleRoutes = require('./routes/googleRoutes');
const tboRoutes = require('./routes/tboRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');   // <-- fixed path

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/google', googleRoutes);
app.use('/api/tbo', tboRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profile', paymentRoutes);
app.use('/api', notificationRoutes);          // POST /api/notifications

// Home route - API Documentation
app.get('/', (req, res) => {
  res.json({
    message: '🏨 Hotel API is running!',
    version: '1.0.0',
    endpoints: {
      auth: {
        '1. Register (Email)': 'POST /api/auth/register/email',
        '2. Login (Email)': 'POST /api/auth/login/email',
        '3. Send OTP': 'POST /api/auth/send-otp',
        '4. Verify OTP': 'POST /api/auth/verify-otp',
        '5. Forgot Password': 'POST /api/auth/forgot-password',
        '6. Resend Verification': 'POST /api/auth/resend-verification',
        '7. Logout': 'POST /api/auth/logout',
        '8. Get Current User': 'GET /api/auth/me'
      },
      profile: {
        '1. Get Profile': 'GET /api/profile',
        '2. Update Profile': 'PUT /api/profile',
        '3. Update Email': 'PUT /api/profile/email',
        '4. Update Phone': 'PUT /api/profile/phone',
        '5. Delete Account': 'DELETE /api/profile',
        '6. Get Settings': 'GET /api/profile/settings',
        '7. Update Settings': 'PUT /api/profile/settings'
      },
      google: {
        '1. Home Dashboard': 'GET /api/google/home',
        '2. Search Hotels': 'GET /api/google/search',
        '3. Autocomplete': 'GET /api/google/autocomplete',
        '4. Hotel Details': 'GET /api/google/details/:placeId',
        '5. Nearby Hotels': 'GET /api/google/nearby',
        '6. Get Photo': 'GET /api/google/photo',
        '7. Get Offers': 'GET /api/google/offers'
      },
      tbo: {
        '1. Search Hotels': 'POST /api/tbo/search',
        '2. Hotel Details': 'POST /api/tbo/details',
        '3. Room Selection': 'POST /api/tbo/rooms',
        '4. Pre-Book': 'POST /api/tbo/prebook',
        '5. Confirm Booking': 'POST /api/tbo/book',
        '6. Cancel Booking': 'POST /api/tbo/cancel',
        '7. Booking Details': 'GET /api/tbo/booking/:bookingId',
        '8. Get Cities': 'GET /api/tbo/cities/:countryCode',
        '9. Get Countries': 'GET /api/tbo/countries'
      }
    },
    totalEndpoints: 31
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.log('Error:', err.message);
  res.status(500).json({ success: false, message: 'Something went wrong', error: err.message });
});

// Start server
const startServer = async () => {
  const PORT = config.port;

  // Test database connection
  await testConnection();

  // Create tables
  await createUsersTable();

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📖 API Docs: http://localhost:${PORT}`);
    console.log(`\n📊 Total Endpoints: 33`);
    console.log(`   - Auth: 8 endpoints`);
    console.log(`   - Profile: 7 endpoints`);
    console.log(`   - Google: 7 endpoints`);
    console.log(`   - TBO: 11 endpoints\n`);
  });
};

startServer();
