const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    minlength: [2, 'Business name must be at least 2 characters'],
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address format']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  defaultCurrency: {
    type: String,
    enum: ['LKR', 'USD'],
    default: 'LKR'
  },
  taxEnabled: {
    type: Boolean,
    default: false
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  receiptFooter: {
    type: String,
    trim: true,
    default: 'Thank you for your business!'
  },
  tagline: {
    type: String,
    trim: true,
    default: ''
  },
  website: {
    type: String,
    trim: true,
    default: ''
  },
  receiptPrefix: {
    type: String,
    trim: true,
    uppercase: true,
    default: 'RCP',
    maxlength: 8
  },
  showLogo: {
    type: Boolean,
    default: true
  },
  logoIcon: {
    type: String,
    trim: true,
    default: '🧃'
  },
  showCustomerInfo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
