const { validationResult } = require('express-validator');
const Newsletter = require('../models/Newsletter');

// ─── POST /api/newsletter/subscribe ──────────────────────────────────────────
const subscribe = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
      });
    }

    const { email } = req.body;

    const existing = await Newsletter.findOne({ email: email.toLowerCase() });

    if (existing) {
      if (existing.isSubscribed) {
        return res.status(409).json({
          success: false,
          message: 'This email is already subscribed to our newsletter.'
        });
      }

      // Re-subscribe
      existing.isSubscribed = true;
      existing.subscribedAt = new Date();
      existing.unsubscribedAt = null;
      await existing.save();

      return res.status(200).json({
        success: true,
        message: "Welcome back! You've been re-subscribed to our newsletter."
      });
    }

    await Newsletter.create({ email });

    res.status(201).json({
      success: true,
      message: "You're subscribed! Get ready for updates on new features and monuments."
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/newsletter/unsubscribe ──────────────────────────────────────
const unsubscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const subscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    if (!subscriber || !subscriber.isSubscribed) {
      return res.status(404).json({ success: false, message: 'Email not found in our subscriber list.' });
    }

    subscriber.isSubscribed = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.status(200).json({ success: true, message: 'You have been successfully unsubscribed.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { subscribe, unsubscribe };
