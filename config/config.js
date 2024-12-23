// config/config.js
module.exports = {
    smtp: {
      host: 'smtp.mailgun.org',
      port: 587, // 일반적으로 587 (TLS) 또는 465 (SSL) 포트를 사용
      secure: false, // true for 465, false for other ports
      auth: {
        user: 'trip-day.com',
        pass: 'Admin@@3306'
      }
    }
  };
  