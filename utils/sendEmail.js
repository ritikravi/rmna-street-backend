const https = require('https');

const sendEmail = async ({ to, subject, html }) => {
  // Use Brevo API instead of SMTP (more reliable on Render)
  const data = JSON.stringify({
    sender: { 
      name: 'RMNA Street', 
      email: process.env.EMAIL_USER || 'noreply@rmnastreet.com' 
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.EMAIL_PASS, // Using EMAIL_PASS as Brevo API key
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 10000, // 10 second timeout
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Email sent to ${to}`);
          resolve(body);
        } else {
          console.error(`❌ Email API error (${res.statusCode}):`, body);
          reject(new Error(`Email API error: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Email request error:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Email request timeout'));
    });

    req.write(data);
    req.end();
  });
};

module.exports = { sendEmail };
