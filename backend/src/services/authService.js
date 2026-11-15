const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { config } = require('../config/env');
const { BadRequestError, UnauthorizedError, NotFoundError, ConflictError } = require('../errors/AppError');

class AuthService {
  async register({ businessName, email, password, phone, address }) {
    if (!businessName || !email || !password) {
      throw new BadRequestError('Missing required fields: businessName, email, and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const user = new User({
      businessName: businessName.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : undefined,
      address: address ? address.trim() : undefined
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });

    return {
      token,
      user: {
        id: user._id,
        businessName: user.businessName,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    };
  }

  async login({ email, password }) {
    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });

    return {
      token,
      user: {
        id: user._id,
        businessName: user.businessName,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    };
  }

  async getProfile(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return {
      id: user._id,
      businessName: user.businessName,
      email: user.email,
      phone: user.phone,
      address: user.address
    };
  }

  async updateProfile(userId, { businessName, phone, address }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (businessName !== undefined) user.businessName = businessName.trim();
    if (phone !== undefined) user.phone = phone ? phone.trim() : '';
    if (address !== undefined) user.address = address ? address.trim() : '';

    await user.save();

    return {
      id: user._id,
      businessName: user.businessName,
      email: user.email,
      phone: user.phone,
      address: user.address
    };
  }
}

module.exports = new AuthService();
