const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  try {
    // Create a transporter using SMTP
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Send mail with defined transport object
    let info = await transporter.sendMail({
      from: `"Trip-day" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: html
    });

    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;