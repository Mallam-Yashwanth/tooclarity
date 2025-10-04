const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { validateRegistration, validateLogin } = require('../middleware/validators');
const { otpLimiter } = require('../middleware/rateLimiter');
// const { protect } = require('../middleware/globalAuth.middleware');

const router = express.Router();

// const passwordResetLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 10,
//   message: 'Too many requests from this IP, please try again after 15 minutes',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

router.post('/login', validateLogin, authController.login);

router.use(['/register', '/verify-otp', '/verify-email'], otpLimiter);

router.post(
    '/register',
    validateRegistration,
    authController.register
);

// 📱 Phone OTP verification
// router.post(
//     '/verify-otp',
//     body('contactNumber').isMobilePhone('any', { strictMode: true }),
//     body('otp').isString().isLength({ min: 6, max: 6 }).trim(),
//     authController.verifyPhoneOtp
// );

// 📧 Email OTP verification
router.post(
    '/verify-email',
    body('email').isEmail().normalizeEmail(),
    body('otp').isString().isLength({ min: 6, max: 6 }).trim(),
    authController.verifyEmailOtp
);

router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

module.exports = router;