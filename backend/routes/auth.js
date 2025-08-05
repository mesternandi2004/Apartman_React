// backend/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Regisztráció
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Ellenőrizzük hogy létezik-e már a felhasználó
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Ez az email cím már regisztrálva van' });
    }

    // Új felhasználó létrehozása
    const user = new User({ name, email, password, phone });
    await user.save();

    // JWT token generálása
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Sikeres regisztráció',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Regisztráció hiba:', error);
    res.status(500).json({ message: 'Szerver hiba a regisztráció során' });
  }
});

// Bejelentkezés
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Felhasználó keresése
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Hibás email vagy jelszó' });
    }

    // Jelszó ellenőrzése
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Hibás email vagy jelszó' });
    }

    // JWT token generálása
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Sikeres bejelentkezés',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Bejelentkezés hiba:', error);
    res.status(500).json({ message: 'Szerver hiba a bejelentkezés során' });
  }
});

// Profil lekérése
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('bookings');
    res.json(user);
  } catch (error) {
    console.error('Profil lekérés hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

// Profil frissítése
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profil sikeresen frissítve',
      user
    });
  } catch (error) {
    console.error('Profil frissítés hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

// Token validálás
router.get('/validate', auth, (req, res) => {
  res.json({ 
    valid: true, 
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: req.user.isAdmin
    }
  });
});

module.exports = router;