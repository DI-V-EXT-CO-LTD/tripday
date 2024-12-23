const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['bank_transfer', 'credit_card', 'crypto'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { discriminatorKey: 'type' });

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

const BankTransferSchema = new mongoose.Schema({
  bankName: String,
  accountNumber: String,
  accountName: String,
  swiftCode: String
});

const CreditCardSchema = new mongoose.Schema({
  cardType: String,
  lastFourDigits: String
});

const CryptoSchema = new mongoose.Schema({
  walletAddress: String,
  network: String,
  paymentTimeLimit: Number // in minutes
});

const BankTransfer = PaymentMethod.discriminator('bank_transfer', BankTransferSchema);
const CreditCard = PaymentMethod.discriminator('credit_card', CreditCardSchema);
const Crypto = PaymentMethod.discriminator('crypto', CryptoSchema);

module.exports = {
  PaymentMethod,
  BankTransfer,
  CreditCard,
  Crypto
};