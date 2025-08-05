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
    // Vendégszám ellenőrzése
    if (guests > apartment.maxGuests) {
      return res.status(400).json({ 
        message: `Maximum ${apartment.maxGuests} vendég foglalható` 
      });
    }

    // Elérhetőség ellenőrzése
    const existingBookings = await Booking.find({
      apartment: apartmentId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { checkIn: { $lte: checkInDate }, checkOut: { $gt: checkInDate } },
        { checkIn: { $lt: checkOutDate }, checkOut: { $gte: checkOutDate } },
        { checkIn: { $gte: checkInDate }, checkOut: { $lte: checkOutDate } }
      ]
    });

    if (existingBookings.length > 0) {
      return res.status(400).json({ message: 'Az apartman már foglalt ebben az időszakban' });
    }

    // Ár számítás
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = nights * apartment.price;

    // Foglalás létrehozása
    const booking = new Booking({
      user: req.user._id,
      apartment: apartmentId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      totalPrice,
      specialRequests,
      contactInfo: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone
      }
    });

    await booking.save();

    // Populálás a válaszhoz
    await booking.populate('apartment', 'title location images');

    res.status(201).json({
      message: 'Foglalás sikeresen létrehozva',
      booking
    });
  } catch (error) {
    console.error('Foglalás létrehozás hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});
// Felhasználó foglalásainak lekérése
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('apartment', 'title location images')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    console.error('Foglalások lekérése hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

// Egy foglalás részleteinek lekérése
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('apartment')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Foglalás nem található' });
    }

    // Ellenőrizzük hogy a felhasználó jogosult-e megtekinteni
    if (booking.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Nincs jogosultság' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Foglalás lekérése hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});