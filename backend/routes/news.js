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
// Legutóbbi hírek (publikus - főoldalhoz)
router.get('/latest/:count', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 5;
    
    const news = await News.find({ isPublished: true })
      .populate('author', 'name')
      .sort({ publishedAt: -1 })
      .limit(count)
      .select('title excerpt image publishedAt author');

    res.json({ news });
  } catch (error) {
    console.error('Legutóbbi hírek lekérése hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});
// ADMIN ROUTE-OK

// Új hír létrehozása (admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, content, excerpt, image, tags, isPublished } = req.body;

    const newsItem = new News({
      title,
      content,
      excerpt,
      image,
      tags,
      author: req.user._id,
      isPublished: isPublished !== false, // alapértelmezetten publikált
      publishedAt: isPublished !== false ? new Date() : null
    });

    await newsItem.save();
    await newsItem.populate('author', 'name');

    res.status(201).json({
      message: 'Hír sikeresen létrehozva',
      news: newsItem
    });
  } catch (error) {
    console.error('Hír létrehozás hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

// Hír frissítése (admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, content, excerpt, image, tags, isPublished } = req.body;
    
    const updateData = {
      title,
      content,
      excerpt,
      image,
      tags,
      isPublished
    };

    // Ha publikálásra állítjuk és még nincs publishedAt dátum
    if (isPublished && !await News.findById(req.params.id).publishedAt) {
      updateData.publishedAt = new Date();
    }

    const newsItem = await News.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'name');

    if (!newsItem) {
      return res.status(404).json({ message: 'Hír nem található' });
    }

    res.json({
      message: 'Hír sikeresen frissítve',
      news: newsItem
    });
  } catch (error) {
    console.error('Hír frissítés hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

// Hír törlése (admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const newsItem = await News.findByIdAndDelete(req.params.id);

    if (!newsItem) {
      return res.status(404).json({ message: 'Hír nem található' });
    }

    res.json({ message: 'Hír sikeresen törölve' });
  } catch (error) {
    console.error('Hír törlés hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

// Admin: összes hír lekérése (publikálatlanokkal együtt)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    let query = {};
    
    if (search) {
      query.$text = { $search: search };
    }

    if (status === 'published') {
      query.isPublished = true;
    } else if (status === 'draft') {
      query.isPublished = false;
    }

    const news = await News.find(query)
      .populate('author', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .exec();

    const total = await News.countDocuments(query);

    res.json({
      news,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Admin hírek lekérése hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

// Hír publikálás/depublikálás (admin)
router.put('/:id/toggle-publish', adminAuth, async (req, res) => {
  try {
    const newsItem = await News.findById(req.params.id);

    if (!newsItem) {
      return res.status(404).json({ message: 'Hír nem található' });
    }

    newsItem.isPublished = !newsItem.isPublished;
    
    if (newsItem.isPublished && !newsItem.publishedAt) {
      newsItem.publishedAt = new Date();
    }

    await newsItem.save();
    await newsItem.populate('author', 'name');

    res.json({
      message: `Hír ${newsItem.isPublished ? 'publikálva' : 'depublikálva'}`,
      news: newsItem
    });
  } catch (error) {
    console.error('Publikálás toggle hiba:', error);
    res.status(500).json({ message: 'Szerver hiba' });
  }
});

module.exports = router;