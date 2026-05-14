const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  // Create transporter with increased timeout
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  // Send email
  const info = await transporter.sendMail({
    from: `"RMNA Street" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  return info;
};

module.exports = { sendEmail };
