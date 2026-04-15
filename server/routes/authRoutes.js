const express = require('express');
const router = express.Router();
const {
    sendSignupOtp,
    registerAndSetPassword,
    login,
    sendForgotPasswordOtp,
    resetPassword,
    getCurrentUser
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup-otp', sendSignupOtp);
router.post('/register', registerAndSetPassword);
router.post('/login', login);
router.post('/forgot-password-otp', sendForgotPasswordOtp);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getCurrentUser);

module.exports = router;
