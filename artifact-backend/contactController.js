const { validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { sendContactEmail, sendContactAutoReply } = require('../utils/emailHelper');

// ─── POST /api/contact ────────────────────────────────────────────────────────
const submitContact = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
      });
    }

    const { name, email, message } = req.body;

    // Save to database
    const contact = await Contact.create({
      name,
      email,
      message,
      ipAddress: req.ip
    });

    // Send emails (fire and forget — don't block response)
    Promise.all([
      sendContactEmail({ name, email, message }),
      sendContactAutoReply({ name, email })
    ]).catch(err => console.error('Email send error:', err));

    res.status(201).json({
      success: true,
      message: "Thank you for reaching out! We'll get back to you within 24–48 hours.",
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/contact (Admin only) ───────────────────────────────────────────
const getAllContacts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      Contact.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Contact.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: contacts
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitContact, getAllContacts };
