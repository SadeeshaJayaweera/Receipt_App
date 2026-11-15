const Flavour = require('../models/Flavour');
const { BadRequestError, NotFoundError, ConflictError } = require('../errors/AppError');

class FlavourService {
  async getAll(userId) {
    return Flavour.find({ userId, isActive: true }).sort({ name: 1 });
  }

  async create(userId, { name, price, description }) {
    if (!name || price === undefined || price === null) {
      throw new BadRequestError('Name and price are required');
    }

    const trimmedName = name.trim();
    const existing = await Flavour.findOne({ userId, name: trimmedName });
    if (existing) {
      if (existing.isActive) {
        throw new ConflictError('Flavour already exists');
      } else {
        // Reactivate soft-deleted flavour
        existing.isActive = true;
        existing.price = price;
        existing.description = description;
        existing.updatedAt = Date.now();
        return existing.save();
      }
    }

    const flavour = new Flavour({
      userId,
      name: trimmedName,
      price: Number(price),
      description: description ? description.trim() : undefined
    });

    return flavour.save();
  }

  async update(userId, flavourId, { name, price, description, isActive }) {
    const flavour = await Flavour.findOne({ _id: flavourId, userId });
    if (!flavour) {
      throw new NotFoundError('Flavour not found');
    }

    if (name !== undefined) flavour.name = name.trim();
    if (price !== undefined) flavour.price = Number(price);
    if (description !== undefined) flavour.description = description ? description.trim() : '';
    if (isActive !== undefined) flavour.isActive = Boolean(isActive);
    flavour.updatedAt = Date.now();

    return flavour.save();
  }

  async delete(userId, flavourId) {
    const flavour = await Flavour.findOneAndUpdate(
      { _id: flavourId, userId },
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );
    if (!flavour) {
      throw new NotFoundError('Flavour not found');
    }
    return { message: 'Flavour deleted successfully' };
  }
}

module.exports = new FlavourService();
