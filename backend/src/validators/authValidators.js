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
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(200).optional(),
  defaultCurrency: z.enum(['LKR', 'USD']).optional(),
  taxEnabled: z.boolean().optional(),
  taxRate: z.coerce.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%').optional(),
  receiptFooter: z.string().trim().max(200).optional(),
  tagline: z.string().trim().max(120).optional(),
  website: z.string().trim().max(100).optional(),
  receiptPrefix: z.string().trim().toUpperCase().min(2).max(8).optional(),
  showLogo: z.boolean().optional(),
  logoIcon: z.string().trim().max(10).optional(),
  showCustomerInfo: z.boolean().optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema
};
