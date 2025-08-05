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
// Foglalás lemondása
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Foglalás nem található' });
    }

    // Ellenőrizzük hogy a felhasználó jogosult-e lemondani
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Nincs jogosultság' });
    }

    // Csak pending vagy confirmed foglalást lehet lemondani
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ message: 'Ez a foglalás nem mondható le' });
    }

    // Lemondási határidő ellenőrzése (pl. 48 órával korábban)
    const now = new Date();
    const checkInDate = new Date(booking.checkIn);
    const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);

    if (hoursUntilCheckIn < 48) {
      return res.status(400).json({ 
        message: 'A foglalás csak 48 órával a bejelentkezés előtt mondható le' 
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({
      message: 'Foglalás sikeresen lemondva',
      booking
    });
  } catch (error) {
    console.error('Foglalás lemondás hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});
// Fizetés szimuláció (valós fizetési gateway helyett)
router.post('/:id/payment', auth, async (req, res) => {
  try {
    const { paymentMethod, cardDetails } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Foglalás nem található' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Nincs jogosultság' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'A foglalás már ki van fizetve' });
    }

    // Itt egy valós alkalmazásban integrálnánk a fizetési gateway-t
    // Most csak szimulálunk egy sikeres fizetést
    
    // Szimuláljunk egy tranzakciós ID-t
    const transactionId = 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    booking.paymentDetails = {
      transactionId,
      paymentMethod,
      paidAt: new Date()
    };

    await booking.save();

    res.json({
      message: 'Fizetés sikeres',
      booking,
      transactionId
    });
  } catch (error) {
    console.error('Fizetés hiba:', error);
    res.status(500).json({ message: 'Fizetési hiba történt' });
  }
});
// ADMIN ROUTE-OK

// Összes foglalás lekérése (admin)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, apartment } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (apartment) query.apartment = apartment;

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('apartment', 'title location')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Admin foglalások lekérése hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});
// Foglalás státusz frissítése (admin)
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Érvénytelen státusz' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email').populate('apartment', 'title');

    if (!booking) {
      return res.status(404).json({ message: 'Foglalás nem található' });
    }

    res.json({
      message: 'Foglalás státusza frissítve',
      booking
    });
  } catch (error) {
    console.error('Státusz frissítés hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});
// Foglalási statisztikák (admin)
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    
    // Bevétel számítás
    const revenue = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    // Havi foglalások
    const monthlyBookings = await Booking.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalPrice', 0] } }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      stats: {
        totalBookings,
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        totalRevenue: revenue[0]?.total || 0,
        monthlyBookings
      }
    });
  } catch (error) {
    console.error('Statisztikák lekérése hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

module.exports = router;