const https = require('https');

const sendEmail = async ({ to, subject, html }) => {
  const data = JSON.stringify({
    sender: { name: 'RMNA Street', email: process.env.EMAIL_FROM || 'ritikravi7724@gmail.com' },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Email sent to ${to}`);
          resolve(body);
        } else {
          console.error(`❌ Email failed: ${body}`);
          reject(new Error(`Email API error: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

module.exports = { sendEmail };
