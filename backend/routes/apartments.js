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

// Apartman elérhetőségének ellenőrzése
router.post('/:id/check-availability', async (req, res) => {
  try {
    const { checkIn, checkOut } = req.body;
    const apartmentId = req.params.id;

    // Dátum validálás
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'A kijelentkezés dátuma későbbi kell legyen' });
    }
    
    if (checkInDate < new Date()) {
      return res.status(400).json({ message: 'A bejelentkezés dátuma nem lehet múltbeli' });
    }

    // Foglaltság ellenőrzése
    const existingBookings = await Booking.find({
      apartment: apartmentId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { checkIn: { $lte: checkInDate }, checkOut: { $gt: checkInDate } },
        { checkIn: { $lt: checkOutDate }, checkOut: { $gte: checkOutDate } },
        { checkIn: { $gte: checkInDate }, checkOut: { $lte: checkOutDate } }
      ]
    });

    const isAvailable = existingBookings.length === 0;

    res.json({
      available: isAvailable,
      conflictingDates: existingBookings.map(booking => ({
        checkIn: booking.checkIn,
        checkOut: booking.checkOut
      }))
    });
  } catch (error) {
    console.error('Elérhetőség ellenőrzés hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

// Foglalt dátumok lekérése apartmanhoz
router.get('/:id/booked-dates', async (req, res) => {
  try {
    const apartmentId = req.params.id;
    
    const bookings = await Booking.find({
      apartment: apartmentId,
      status: { $in: ['confirmed', 'pending'] },
      checkOut: { $gte: new Date() }
    }).select('checkIn checkOut');

    const bookedDates = bookings.map(booking => ({
      start: booking.checkIn,
      end: booking.checkOut
    }));

    res.json({ bookedDates });
  } catch (error) {
    console.error('Foglalt dátumok lekérése hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

// Új apartman létrehozása (csak admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const apartmentData = req.body;
    const apartment = new Apartment(apartmentData);
    await apartment.save();

    res.status(201).json({
      message: 'Apartman sikeresen létrehozva',
      apartment
    });
  } catch (error) {
    console.error('Apartman létrehozás hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

/ Apartman frissítése (csak admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const apartment = await Apartment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!apartment) {
      return res.status(404).json({ message: 'Apartman nem található' });
    }

    res.json({
      message: 'Apartman sikeresen frissítve',
      apartment
    });
  } catch (error) {
    console.error('Apartman frissítés hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

// Apartman törlése (csak admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.params.id);
    
    if (!apartment) {
      return res.status(404).json({ message: 'Apartman nem található' });
    }
