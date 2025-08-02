// backend/models/Apartment.js
const mongoose = require('mongoose');

const apartmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 200
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'Magyarország'
    }
  },
  amenities: [{
    type: String,
    required: true
  }],
  images: [{
    url: String,
    alt: String
  }],
  maxGuests: {
    type: Number,
    required: true,
    min: 1
  },
  bedrooms: {
    type: Number,
    required: true,
    min: 1
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 1
  },
  area: {
    type: Number, // m2
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }]
}, {
  timestamps: true
});

// Index for search functionality
apartmentSchema.index({ 
  title: 'text', 
  description: 'text', 
  'location.city': 'text' 
});

module.exports = mongoose.model('Apartment', apartmentSchema);