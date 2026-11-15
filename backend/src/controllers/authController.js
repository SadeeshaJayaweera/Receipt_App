const authService = require('../services/authService');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        message: 'Registration successful',
        token: result.token,
        user: result.user
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.json({
        message: 'Login successful',
        token: result.token,
        user: result.user
      });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.userId);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await authService.updateProfile(req.userId, req.body);
      res.json({
        message: 'Profile updated',
        user
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
