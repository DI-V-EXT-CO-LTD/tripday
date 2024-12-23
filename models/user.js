const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); // 토큰 생성을 위해 추가

const userSchema = new mongoose.Schema({
  companyName: { type: String, required: false },
  contactPerson: { type: String, required: false },
  contactNumber: { type: String, required: false },
  businessNumber: { type: String, required: false },
  companyAddress: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  role: {
    type: String,
    enum: ['SuperAdmin', 'Admin', 'LandCompany', 'Vendor', 'Agency', 'Customer'],
    default: 'Customer'
  },
  kycStatus: {
    type: String,
    enum: ['KYC Not Complete', 'KYC Complete'],
    default: 'KYC Not Complete'
  },
  isVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false }, // 관리자 승인 필드 추가
  verificationToken: String,
  registrationDate: { type: Date, default: Date.now },
  userLevel: { type: Number, default: 0 },
  userReceiveEmail: {type: String},
  userPaybackRate: {type: Number, default: 0},
  lastLogin: Date,
  emailVerificationDate: Date,
  registrationIP: String,
  emailVerificationIP: String,
  registrationCountry: String,
  emailVerificationCountry: String,
  registrationBrowser: String,
  emailVerificationBrowser: String,
  registrationDevice: String,
  emailVerificationDevice: String,
  smsVerificationCode: String,
});

// 비밀번호 비교 메서드
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 이메일 인증 토큰 생성 메서드 추가
userSchema.methods.generateVerificationToken = function() {
  const token = crypto.randomBytes(20).toString('hex');
  this.verificationToken = token;
  return token;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
