const ReceiptCounter = require('../models/ReceiptCounter');

class ReceiptNumberService {
  /**
   * Generates a collision-safe sequential receipt number for a business tenant.
   * Format: RCP-YYYYMM-0001 (e.g., RCP-202611-0001)
   *
   * @param {string|mongoose.Types.ObjectId} userId - The tenant's user ID.
   * @param {Object} [options]
   * @param {string} [options.prefix='RCP'] - Optional prefix.
   * @param {Date} [options.date=new Date()] - Reference date for period calculation.
   * @param {number} [options.padding=4] - Padding length for sequence number.
   * @returns {Promise<string>} Sequential formatted receipt number.
   */
  async generateNextReceiptNumber(userId, options = {}) {
    if (!userId) {
      throw new Error('UserId is required to generate receipt number');
    }

    const prefix = (options.prefix || 'RCP').toUpperCase().trim();
    const now = options.date || new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const period = `${year}${month}`;
    const padding = options.padding || 4;

    const counter = await ReceiptCounter.findOneAndUpdate(
      { userId, prefix, period },
      { $inc: { seq: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    const formattedSeq = String(counter.seq).padStart(padding, '0');
    return `${prefix}-${period}-${formattedSeq}`;
  }

  /**
   * Peeks the current sequence number for a tenant without incrementing.
   */
  async getCurrentSequence(userId, prefix = 'RCP', period = null) {
    if (!period) {
      const now = new Date();
      period = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    const counter = await ReceiptCounter.findOne({ userId, prefix: prefix.toUpperCase(), period });
    return counter ? counter.seq : 0;
  }
}

module.exports = new ReceiptNumberService();
