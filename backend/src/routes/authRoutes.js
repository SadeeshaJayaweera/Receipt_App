const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerSchema, loginSchema, updateProfileSchema } = require('../validators/authValidators');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', authLimiter, validate(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/logout', authMiddleware, (req, res, next) => authController.logout(req, res, next));
router.get('/profile', authMiddleware, (req, res, next) => authController.getProfile(req, res, next));
router.put('/profile', authMiddleware, validate(updateProfileSchema), (req, res, next) => authController.updateProfile(req, res, next));

module.exports = router;
