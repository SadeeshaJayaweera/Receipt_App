const { z } = require('zod');

const registerSchema = z.object({
  businessName: z.string().trim().min(2, 'Business name must be at least 2 characters').max(100, 'Business name must not exceed 100 characters'),
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional()
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

const updateProfileSchema = z.object({
  businessName: z.string().trim().min(2, 'Business name must be at least 2 characters').max(100).optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema
};
