const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { config } = require('../config/env');
const tokenBlacklistService = require('./tokenBlacklistService');
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

    const token = jwt.sign(
      { userId: user._id, jti: crypto.randomUUID() },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

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

    const token = jwt.sign(
      { userId: user._id, jti: crypto.randomUUID() },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

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
      phone: user.phone || '',
      address: user.address || '',
      defaultCurrency: user.defaultCurrency || 'LKR',
      taxEnabled: Boolean(user.taxEnabled),
      taxRate: user.taxRate || 0,
      receiptFooter: user.receiptFooter || 'Thank you for your business!',
      tagline: user.tagline || '',
      website: user.website || '',
      receiptPrefix: user.receiptPrefix || 'RCP',
      showLogo: user.showLogo !== undefined ? Boolean(user.showLogo) : true,
      logoIcon: user.logoIcon || '🧃',
      showCustomerInfo: user.showCustomerInfo !== undefined ? Boolean(user.showCustomerInfo) : true
    };
  }

  async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (updateData.businessName !== undefined) user.businessName = updateData.businessName.trim();
    if (updateData.phone !== undefined) user.phone = updateData.phone ? updateData.phone.trim() : '';
    if (updateData.address !== undefined) user.address = updateData.address ? updateData.address.trim() : '';
    if (updateData.defaultCurrency !== undefined) {
      const cur = updateData.defaultCurrency.toUpperCase().trim();
      if (!['LKR', 'USD'].includes(cur)) {
        throw new BadRequestError('Invalid currency. Supported currencies: LKR, USD');
      }
      user.defaultCurrency = cur;
    }
    if (updateData.taxEnabled !== undefined) user.taxEnabled = Boolean(updateData.taxEnabled);
    if (updateData.taxRate !== undefined) {
      const rate = Number(updateData.taxRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        throw new BadRequestError('Tax rate must be between 0% and 100%');
      }
      user.taxRate = rate;
    }
    if (updateData.receiptFooter !== undefined) user.receiptFooter = updateData.receiptFooter.trim();
    if (updateData.tagline !== undefined) user.tagline = updateData.tagline.trim();
    if (updateData.website !== undefined) user.website = updateData.website.trim();
    if (updateData.receiptPrefix !== undefined) user.receiptPrefix = updateData.receiptPrefix.toUpperCase().trim();
    if (updateData.showLogo !== undefined) user.showLogo = Boolean(updateData.showLogo);
    if (updateData.logoIcon !== undefined) user.logoIcon = updateData.logoIcon.trim();
    if (updateData.showCustomerInfo !== undefined) user.showCustomerInfo = Boolean(updateData.showCustomerInfo);

    await user.save();

    return {
      id: user._id,
      businessName: user.businessName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      defaultCurrency: user.defaultCurrency,
      taxEnabled: user.taxEnabled,
      taxRate: user.taxRate,
      receiptFooter: user.receiptFooter,
      tagline: user.tagline,
      website: user.website,
      receiptPrefix: user.receiptPrefix,
      showLogo: user.showLogo,
      logoIcon: user.logoIcon,
      showCustomerInfo: user.showCustomerInfo
    };
  }

  async logout(token, tokenPayload) {
    if (token) {
      tokenBlacklistService.revoke(token, tokenPayload?.exp);
    }
    return { message: 'Logged out successfully' };
  }
}

module.exports = new AuthService();
