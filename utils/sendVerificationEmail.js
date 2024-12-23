// utils/sendVerificationEmail.js
const nodemailer = require('nodemailer');
const config = require('../config/config');

// SMTP 설정
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.auth.user,
    pass: config.smtp.auth.pass
  }
});

// 이메일 보내기 함수
const sendVerificationEmail = (email, token) => {
  const mailOptions = {
    from: config.smtp.auth.user,
    to: email,
    subject: 'Email Verification',
    text: `Please verify your email by clicking the following link: http://your-domain.com/verify-email?token=${token}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error('Error sending email:', error);
    }
    console.log('Email sent:', info.response);
  });
};

module.exports = sendVerificationEmail;
