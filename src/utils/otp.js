// src/utils/otp.js

// 6-digit numeric OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 10 minutes expiry
const otpExpiryMinutes = 10;
const getExpiryTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + otpExpiryMinutes);
  return now;
};

module.exports = { generateOtp, getExpiryTime };
