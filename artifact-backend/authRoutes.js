const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { signup, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

// ─── Validation Rules ─────────────────────────────────────────────────────────
const signupValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 * @body    { name, email, password }
 * @returns { success, token, user }
 */
router.post('/signup', authLimiter, signupValidation, signup);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 * @body    { email, password }
 * @returns { success, token, user }
 */
router.post('/login', authLimiter, loginValidation, login);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged-in user
 * @access  Private (JWT required)
 * @returns { success, user }
 */
router.get('/me', protect, getMe);

/**
 * @route   PUT /api/auth/update-profile
 * @desc    Update user's name or avatar
 * @access  Private
 * @body    { name?, avatar? }
 */
router.put('/update-profile', protect, updateProfileValidation, updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.post('/change-password', protect, changePasswordValidation, changePassword);

module.exports = router;
