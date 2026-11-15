const mongoose = require('mongoose');
const Receipt = require('../models/Receipt');
const { round } = require('../utils/calcEngine');

class AnalyticsService {
  /**
   * Generates comprehensive business metrics for the dashboard
   */
  async getDashboardSummary(userId, options = {}) {
    const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    const targetCurrency = (options.currency || 'LKR').toUpperCase();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0 for Monday
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Core financial metrics for target currency
    const summaryAggregation = await Receipt.aggregate([
      {
        $match: {
          userId: userObjectId,
          currency: targetCurrency
        }
      },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          issuedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'issued'] }, 1, 0] }
          },
          draftCount: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          voidedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'voided'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ['$status', 'issued'] }, '$totalAmount', 0] }
          },
          todayRevenue: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'issued'] }, { $gte: ['$createdAt', startOfToday] }] },
                '$totalAmount',
                0
              ]
            }
          },
          todayReceipts: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startOfToday] }, 1, 0]
            }
          },
          weekRevenue: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'issued'] }, { $gte: ['$createdAt', startOfWeek] }] },
                '$totalAmount',
                0
              ]
            }
          },
          monthRevenue: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'issued'] }, { $gte: ['$createdAt', startOfMonth] }] },
                '$totalAmount',
                0
              ]
            }
          }
        }
      }
    ]);

    const summary = summaryAggregation[0] || {
      totalCount: 0,
      issuedCount: 0,
      draftCount: 0,
      voidedCount: 0,
      totalRevenue: 0,
      todayRevenue: 0,
      todayReceipts: 0,
      weekRevenue: 0,
      monthRevenue: 0
    };

    const avgOrderValue = summary.issuedCount > 0
      ? round(summary.totalRevenue / summary.issuedCount)
      : 0;

    // 2. Top-selling flavours/products
    const topFlavoursAggregation = await Receipt.aggregate([
      {
        $match: {
          userId: userObjectId,
          status: 'issued',
          currency: targetCurrency
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.flavourName',
          flavourId: { $first: '$items.flavourId' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: '$_id',
          flavourId: 1,
          quantity: '$totalQuantity',
          revenue: { $round: ['$totalRevenue', 2] }
        }
      }
    ]);

    // 3. Payment method distribution
    const paymentBreakdownAggregation = await Receipt.aggregate([
      {
        $match: {
          userId: userObjectId,
          status: 'issued',
          currency: targetCurrency
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          _id: 0,
          method: '$_id',
          count: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] }
        }
      }
    ]);

    // 4. Daily timeline (last 7 or 30 days)
    const timelineAggregation = await Receipt.aggregate([
      {
        $match: {
          userId: userObjectId,
          status: 'issued',
          currency: targetCurrency,
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          revenue: { $round: ['$revenue', 2] },
          count: 1
        }
      }
    ]);

    // 5. Multi-currency summary across all currencies
    const multiCurrencyAggregation = await Receipt.aggregate([
      {
        $match: {
          userId: userObjectId,
          status: 'issued'
        }
      },
      {
        $group: {
          _id: '$currency',
          totalRevenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          currency: '$_id',
          totalRevenue: { $round: ['$totalRevenue', 2] },
          count: 1
        }
      }
    ]);

    return {
      currency: targetCurrency,
      metrics: {
        totalRevenue: round(summary.totalRevenue),
        todayRevenue: round(summary.todayRevenue),
        todayReceipts: summary.todayReceipts,
        weekRevenue: round(summary.weekRevenue),
        monthRevenue: round(summary.monthRevenue),
        avgOrderValue,
        counts: {
          total: summary.totalCount,
          issued: summary.issuedCount,
          draft: summary.draftCount,
          voided: summary.voidedCount
        }
      },
      topFlavours: topFlavoursAggregation,
      paymentBreakdown: paymentBreakdownAggregation,
      dailyTimeline: timelineAggregation,
      multiCurrencySummary: multiCurrencyAggregation
    };
  }
}

module.exports = new AnalyticsService();
