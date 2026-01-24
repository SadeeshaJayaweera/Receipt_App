const express = require('express');
const Flavour = require('../models/Flavour');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const flavours = await Flavour.find({ userId: req.userId, isActive: true });
    res.json(flavours);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, price, description } = req.body;

    const existingFlavour = await Flavour.findOne({ userId: req.userId, name });
    if (existingFlavour) {
      return res.status(400).json({ message: 'Flavour already exists' });
    }

    const flavour = new Flavour({ userId: req.userId, name, price, description });
    await flavour.save();
    res.status(201).json(flavour);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, price, description, isActive } = req.body;
    const flavour = await Flavour.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, price, description, isActive, updatedAt: Date.now() },
      { new: true }
    );
    res.json(flavour);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Flavour.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isActive: false }
    );
    res.json({ message: 'Flavour deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;