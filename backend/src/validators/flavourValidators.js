const { z } = require('zod');

const createFlavourSchema = z.object({
  name: z.string().trim().min(1, 'Flavour name is required').max(80, 'Flavour name cannot exceed 80 characters'),
  price: z.coerce.number().positive('Price must be greater than zero'),
  description: z.string().trim().max(300, 'Description cannot exceed 300 characters').optional()
}).strict('Unrecognized field in request payload');

const updateFlavourSchema = z.object({
  name: z.string().trim().min(1, 'Flavour name is required').max(80).optional(),
  price: z.coerce.number().positive('Price must be greater than zero').optional(),
  description: z.string().trim().max(300).optional(),
  isActive: z.boolean().optional()
}).strict('Unrecognized field in request payload');

module.exports = {
  createFlavourSchema,
  updateFlavourSchema
};
