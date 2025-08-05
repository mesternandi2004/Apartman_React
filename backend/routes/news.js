// backend/routes/news.js
const express = require('express');
const News = require('../models/News');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

// Összes hír lekérése (publikus)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    let query = { isPublished: true };
    
    if (search) {
      query.$text = { $search: search };
    }

    const news = await News.find(query)
      .populate('author', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ publishedAt: -1 })
      .exec();

    const total = await News.countDocuments(query);

    res.json({
      news,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Hírek lekérése hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

// Egy hír lekérése (publikus)
router.get('/:id', async (req, res) => {
  try {
    const newsItem = await News.findById(req.params.id)
      .populate('author', 'name');
    
    if (!newsItem || !newsItem.isPublished) {
      return res.status(404).json({ message: 'Hír nem található' });
    }

    res.json({ news: newsItem });
  } catch (error) {
    console.error('Hír lekérése hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});