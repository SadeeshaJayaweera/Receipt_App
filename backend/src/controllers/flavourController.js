const flavourService = require('../services/flavourService');

class FlavourController {
  async getAll(req, res, next) {
    try {
      const flavours = await flavourService.getAll(req.userId);
      res.json(flavours);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const flavour = await flavourService.create(req.userId, req.body);
      res.status(201).json(flavour);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const flavour = await flavourService.update(req.userId, req.params.id, req.body);
      res.json(flavour);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await flavourService.delete(req.userId, req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FlavourController();
