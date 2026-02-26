const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    countryCode: {
      type: String,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lon: {
      type: Number,
      required: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      maxlength: [200, 'Notes cannot exceed 200 characters'],
      default: '',
    },
    // AI-generated weather insight cache
    lastInsight: {
      text: String,
      generatedAt: Date,
    },
  },
  { timestamps: true }
);

// Prevent duplicate cities per user
citySchema.index({ user: 1, lat: 1, lon: 1 }, { unique: true });

module.exports = mongoose.model('City', citySchema);
