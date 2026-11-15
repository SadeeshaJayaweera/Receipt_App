const { z } = require('zod');

const receiptItemSchema = z.object({
  flavourId: z.string().optional(),
  flavourName: z.string().trim().min(1, 'Flavour name is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  subtotal: z.coerce.number().min(0, 'Subtotal cannot be negative')
});

const createReceiptSchema = z.object({
  items: z.array(receiptItemSchema).min(1, 'Receipt must contain at least one item'),
  totalAmount: z.coerce.number().min(0, 'Total amount cannot be negative'),
  paymentMethod: z.enum(['cash', 'card', 'mobile']).default('cash'),
  customerName: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional()
});

const updateReceiptSchema = z.object({
  items: z.array(receiptItemSchema).min(1).optional(),
  totalAmount: z.coerce.number().min(0).optional(),
  paymentMethod: z.enum(['cash', 'card', 'mobile']).optional(),
  customerName: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional()
});

module.exports = {
  createReceiptSchema,
  updateReceiptSchema,
  receiptItemSchema
};
