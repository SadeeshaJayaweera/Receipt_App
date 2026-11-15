const { z } = require('zod');

const createFlavourSchema = z.object({
  name: z.string().trim().min(1, 'Flavour name is required').max(80, 'Flavour name cannot exceed 80 characters'),
  price: z.coerce.number().positive('Price must be greater than zero'),
  description: z.string().trim().max(300, 'Description cannot exceed 300 characters').optional(),
  category: z.string().trim().max(50).optional(),
  sku: z.string().trim().max(30).optional(),
  isAvailable: z.boolean().optional(),
  isActive: z.boolean().optional()
}).strict('Unrecognized field in request payload');

const updateFlavourSchema = z.object({
  name: z.string().trim().min(1, 'Flavour name is required').max(80).optional(),
  price: z.coerce.number().positive('Price must be greater than zero').optional(),
  description: z.string().trim().max(300).optional(),
  category: z.string().trim().max(50).optional(),
  sku: z.string().trim().max(30).optional(),
  isAvailable: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isActive: z.boolean().optional()
}).strict('Unrecognized field in request payload');

module.exports = {
  createFlavourSchema,
  updateFlavourSchema
};
