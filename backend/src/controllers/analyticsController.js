const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  async getDashboard(req, res, next) {
    try {
      const summary = await analyticsService.getDashboardSummary(req.userId, req.query);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticsController();
