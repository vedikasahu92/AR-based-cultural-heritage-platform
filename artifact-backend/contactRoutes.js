const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { submitContact, getAllContacts } = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { contactLimiter } = require('../middleware/rateLimiter');

const contactValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters')
];

/**
 * @route   POST /api/contact
 * @desc    Submit contact form
 * @access  Public
 * @body    { name, email, message }
 * @returns { success, message, data: { id, name, email, createdAt } }
 */
router.post('/', contactLimiter, contactValidation, submitContact);

/**
 * @route   GET /api/contact
 * @desc    Get all contact submissions (admin only)
 * @access  Private/Admin
 * @query   page, limit
 */
router.get('/', protect, authorize('admin'), getAllContacts);

module.exports = router;
