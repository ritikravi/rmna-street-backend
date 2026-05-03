const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"RMNA Street" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`Email sent to ${to}: ${info.messageId}`);
  return info;
};

module.exports = { sendEmail };
