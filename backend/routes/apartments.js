/ backend/routes/apartments.js
const express = require('express');
const Apartment = require('../models/Apartment');
const Booking = require('../models/Booking');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Összes apartman lekérése (publikus)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, city, minPrice, maxPrice } = req.query;
    
    let query = { isActive: true };
    
    // Keresési szűrők
    if (search) {
      query.$text = { $search: search };
    }
    
    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const apartments = await Apartment.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .exec();

    const total = await Apartment.countDocuments(query);

    res.json({
      apartments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Apartmanok lekérése hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

// Egy apartman lekérése (publikus)
router.get('/:id', async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.params.id);
    
    if (!apartment || !apartment.isActive) {
      return res.status(404).json({ message: 'Apartman nem található' });
    }

    res.json(apartment);
  } catch (error) {
    console.error('Apartman lekérése hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});