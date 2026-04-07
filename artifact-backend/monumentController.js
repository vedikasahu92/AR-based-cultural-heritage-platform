const { validationResult } = require('express-validator');
const Monument = require('../models/Monument');

// ─── GET /api/monuments ───────────────────────────────────────────────────────
const getAllMonuments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { isPublished: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { 'location.city': { $regex: req.query.search, $options: 'i' } },
        { 'location.state': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [monuments, total] = await Promise.all([
      Monument.find(filter)
        .select('-reviews')  // Exclude full reviews array in list view
        .sort({ averageRating: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Monument.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: monuments
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/monuments/:id ───────────────────────────────────────────────────
const getMonumentById = async (req, res, next) => {
  try {
    const monument = await Monument.findById(req.params.id).populate('reviews.user', 'name avatar');
    if (!monument || !monument.isPublished) {
      return res.status(404).json({ success: false, message: 'Monument not found' });
    }

    res.status(200).json({ success: true, data: monument });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/monuments (Admin only) ────────────────────────────────────────
const createMonument = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
      });
    }

    const monument = await Monument.create(req.body);
    res.status(201).json({ success: true, message: 'Monument created successfully', data: monument });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A monument with this name already exists.' });
    }
    next(error);
  }
};

// ─── POST /api/monuments/:id/reviews ─────────────────────────────────────────
const addReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
      });
    }

    const monument = await Monument.findById(req.params.id);
    if (!monument) {
      return res.status(404).json({ success: false, message: 'Monument not found' });
    }

    // Check if user already reviewed
    const alreadyReviewed = monument.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this monument.' });
    }

    const { rating, comment } = req.body;
    monument.reviews.push({ user: req.user._id, userName: req.user.name, rating, comment });
    monument.calculateAverageRating();
    await monument.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      averageRating: monument.averageRating,
      totalReviews: monument.totalReviews
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllMonuments, getMonumentById, createMonument, addReview };
