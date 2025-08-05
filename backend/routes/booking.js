// backend/routes/bookings.js
const express = require('express');
const Booking = require('../models/Booking');
const Apartment = require('../models/Apartment');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Új foglalás létrehozása
router.post('/', auth, async (req, res) => {
  try {
    const { apartmentId, checkIn, checkOut, guests, specialRequests } = req.body;
    
    // Apartman létezésének ellenőrzése
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment || !apartment.isActive) {
      return res.status(404).json({ message: 'Apartman nem található' });
    }

    // Dátum validálás
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ message: 'A kijelentkezés dátuma későbbi kell legyen' });
    }
    
    if (checkInDate < new Date()) {
      return res.status(400).json({ message: 'A bejelentkezés dátuma nem lehet múltbeli' });
    }
