const Flavour = require('../models/Flavour');
const { BadRequestError, NotFoundError, ConflictError } = require('../errors/AppError');

class FlavourService {
  async getAll(userId, query = {}) {
    const filter = { userId };

    // Default to excluding archived flavours unless explicitly requested
    if (query.includeArchived === 'true' || query.includeArchived === true) {
      // Include all
    } else {
      filter.isArchived = { $ne: true };
    }

    // Filter by active status
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true' || query.isActive === true;
    } else if (!query.includeArchived) {
      filter.isActive = true;
    }

    // Filter by category
    if (query.category) {
      filter.category = query.category.trim();
    }

    // Filter by stock availability
    if (query.isAvailable !== undefined) {
      filter.isAvailable = query.isAvailable === 'true' || query.isAvailable === true;
    }

    // Search by name or description
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { sku: searchRegex }
      ];
    }

    return Flavour.find(filter).sort({ category: 1, name: 1 });
  }

  async getById(userId, flavourId) {
    const flavour = await Flavour.findOne({ _id: flavourId, userId });
    if (!flavour) {
      throw new NotFoundError('Flavour not found');
    }
    return flavour;
  }

  async create(userId, { name, price, description, category, sku, isAvailable, isActive }) {
    if (!name || price === undefined || price === null) {
      throw new BadRequestError('Name and price are required');
    }

    const trimmedName = name.trim();
    const existing = await Flavour.findOne({ userId, name: trimmedName });
    if (existing) {
      if (!existing.isArchived && existing.isActive) {
        throw new ConflictError(`Flavour "${trimmedName}" already exists for this business`);
      } else {
        // Reactivate previously archived or deleted flavour
        existing.isActive = true;
        existing.isArchived = false;
        existing.price = Number(price);
        if (description !== undefined) existing.description = description.trim();
        if (category !== undefined) existing.category = category.trim();
        if (sku !== undefined) existing.sku = sku.trim().toUpperCase();
        if (isAvailable !== undefined) existing.isAvailable = Boolean(isAvailable);
        return existing.save();
      }
    }

    const flavour = new Flavour({
      userId,
      name: trimmedName,
      price: Number(price),
      description: description ? description.trim() : undefined,
      category: category ? category.trim() : 'Fresh Juice',
      sku: sku ? sku.trim().toUpperCase() : undefined,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      isArchived: false
    });

    return flavour.save();
  }

  async update(userId, flavourId, updateData) {
    const flavour = await Flavour.findOne({ _id: flavourId, userId });
    if (!flavour) {
      throw new NotFoundError('Flavour not found');
    }

    if (updateData.name && updateData.name.trim() !== flavour.name) {
      const trimmedName = updateData.name.trim();
      const existing = await Flavour.findOne({ userId, name: trimmedName });
      if (existing && existing._id.toString() !== flavourId) {
        throw new ConflictError(`Flavour "${trimmedName}" already exists`);
      }
      flavour.name = trimmedName;
    }

    if (updateData.price !== undefined) flavour.price = Number(updateData.price);
    if (updateData.description !== undefined) flavour.description = updateData.description.trim();
    if (updateData.category !== undefined) flavour.category = updateData.category.trim();
    if (updateData.sku !== undefined) flavour.sku = updateData.sku.trim().toUpperCase();
    if (updateData.isAvailable !== undefined) flavour.isAvailable = Boolean(updateData.isAvailable);
    if (updateData.isActive !== undefined) flavour.isActive = Boolean(updateData.isActive);
    if (updateData.isArchived !== undefined) flavour.isArchived = Boolean(updateData.isArchived);

    return flavour.save();
  }

  async archive(userId, flavourId) {
    const flavour = await Flavour.findOneAndUpdate(
      { _id: flavourId, userId },
      { isArchived: true, isActive: false },
      { new: true }
    );
    if (!flavour) {
      throw new NotFoundError('Flavour not found');
    }
    return { message: 'Flavour archived successfully', flavour };
  }

  async restore(userId, flavourId) {
    const flavour = await Flavour.findOneAndUpdate(
      { _id: flavourId, userId },
      { isArchived: false, isActive: true },
      { new: true }
    );
    if (!flavour) {
      throw new NotFoundError('Flavour not found');
    }
    return { message: 'Flavour restored successfully', flavour };
  }

  async toggleAvailability(userId, flavourId) {
    const flavour = await Flavour.findOne({ _id: flavourId, userId });
    if (!flavour) {
      throw new NotFoundError('Flavour not found');
    }
    flavour.isAvailable = !flavour.isAvailable;
    await flavour.save();
    return {
      message: `Flavour marked as ${flavour.isAvailable ? 'in stock' : 'out of stock'}`,
      isAvailable: flavour.isAvailable,
      flavour
    };
  }

  async delete(userId, flavourId) {
    // Soft delete/archive to preserve historical receipts
    return this.archive(userId, flavourId);
  }
}

module.exports = new FlavourService();
