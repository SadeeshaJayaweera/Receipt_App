const { z } = require('zod');

const receiptItemSchema = z.object({
  flavourId: z.string().optional(),
  flavourName: z.string().trim().min(1, 'Flavour name is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  subtotal: z.coerce.number().min(0, 'Subtotal cannot be negative')
}).strict('Unrecognized field in item');

const customerSchema = z.object({
  name: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email('Invalid email address format').or(z.literal('')).optional(),
  loyaltyNumber: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(300).optional()
}).strict('Unrecognized field in customer object');

const paymentSchema = z.object({
  method: z.enum(['cash', 'card', 'mobile']).default('cash'),
  cashReceived: z.coerce.number().min(0).optional(),
  changeGiven: z.coerce.number().min(0).optional(),
  reference: z.string().trim().max(100).optional()
}).strict('Unrecognized field in payment object');

const createReceiptSchema = z.object({
  receiptNumber: z.string().trim().min(3).max(50).optional(),
  currency: z.enum(['LKR', 'USD']).default('LKR'),
  status: z.enum(['draft', 'issued', 'voided']).default('issued'),
  items: z.array(receiptItemSchema).min(1, 'Receipt must contain at least one item'),
  subtotal: z.coerce.number().min(0, 'Subtotal cannot be negative').optional(),
  discount: z.coerce.number().min(0, 'Discount cannot be negative').optional(),
  discountType: z.enum(['fixed', 'percent']).default('fixed').optional(),
  discountValue: z.coerce.number().min(0).optional(),
  taxEnabled: z.boolean().default(false).optional(),
  taxRate: z.coerce.number().min(0, 'Tax rate cannot be negative').optional(),
  taxAmount: z.coerce.number().min(0, 'Tax amount cannot be negative').optional(),
  totalAmount: z.coerce.number().min(0, 'Total amount cannot be negative').optional(),
  paymentMethod: z.enum(['cash', 'card', 'mobile']).default('cash'),
  cashReceived: z.coerce.number().min(0, 'Cash received cannot be negative').optional(),
  customerName: z.string().trim().max(100).optional(),
  customerPhone: z.string().trim().max(30).optional(),
  customerEmail: z.string().trim().email('Invalid email address format').or(z.literal('')).optional(),
  customer: customerSchema.optional(),
  payment: paymentSchema.optional(),
  notes: z.string().trim().max(500).optional()
}).strict('Unrecognized field in receipt payload');

const updateReceiptSchema = z.object({
  currency: z.enum(['LKR', 'USD']).optional(),
  status: z.enum(['draft', 'issued', 'voided']).optional(),
  items: z.array(receiptItemSchema).min(1).optional(),
  subtotal: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional(),
  discountType: z.enum(['fixed', 'percent']).optional(),
  discountValue: z.coerce.number().min(0).optional(),
  taxEnabled: z.boolean().optional(),
  taxRate: z.coerce.number().min(0).optional(),
  taxAmount: z.coerce.number().min(0).optional(),
  totalAmount: z.coerce.number().min(0).optional(),
  paymentMethod: z.enum(['cash', 'card', 'mobile']).optional(),
  cashReceived: z.coerce.number().min(0).optional(),
  customerName: z.string().trim().max(100).optional(),
  customerPhone: z.string().trim().max(30).optional(),
  customerEmail: z.string().trim().email('Invalid email address format').or(z.literal('')).optional(),
  customer: customerSchema.optional(),
  payment: paymentSchema.optional(),
  notes: z.string().trim().max(500).optional()
}).strict('Unrecognized field in update payload');

const voidReceiptSchema = z.object({
  reason: z.string().trim().min(5, 'Void reason must be at least 5 characters').max(300, 'Void reason cannot exceed 300 characters')
}).strict('Unrecognized field in void payload');

module.exports = {
  createReceiptSchema,
  updateReceiptSchema,
  receiptItemSchema,
  customerSchema,
  paymentSchema,
  voidReceiptSchema
};
