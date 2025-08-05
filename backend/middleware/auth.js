/ backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Nincs token, hozzáférés megtagadva' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Token nem érvényes' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token nem érvényes' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin jogosultság szükséges' });
    }
    
    next();
  } catch (error) {
    res.status(403).json({ message: 'Nincs jogosultság' });
  }
};

module.exports = { auth, adminAuth };