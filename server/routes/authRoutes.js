const express = require('express');
const router = express.Router();
const {
    sendSignupOtp,
    registerAndSetPassword,
    login,
    sendForgotPasswordOtp,
    resetPassword
} = require('../controllers/authController');

router.post('/signup-otp', sendSignupOtp);
router.post('/register', registerAndSetPassword);
router.post('/login', login);
router.post('/forgot-password-otp', sendForgotPasswordOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
