require('dotenv').config();
const mongoose = require('mongoose');
const { sendEmail } = require('./utils/sendEmail');
const { orderConfirmationEmail } = require('./utils/emailTemplates');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Test order data
const testOrder = {
  _id: new mongoose.Types.ObjectId(),
  items: [
    {
      product: { name: 'RMNA Street Men\'s Printed Casual Shirt – Rose Pink' },
      size: 'M',
      quantity: 1,
      price: 346
    }
  ],
  itemsPrice: 346,
  shippingPrice: 0,
  discount: 0,
  totalPrice: 346,
  shippingAddress: {
    fullName: 'Test User',
    address: '123 Test Street',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    phone: '9876543210'
  },
  createdAt: new Date()
};

const testUser = {
  name: 'Test User',
  email: 'ritiksweta8@gmail.com'
};

// Send test email
async function sendTestEmail() {
  try {
    console.log('\n📧 Sending test order confirmation email...');
    console.log(`To: ${testUser.email}`);
    
    await sendEmail({
      to: testUser.email,
      subject: `Test Order Confirmed #${testOrder._id.toString().slice(-8).toUpperCase()} - RMNA Street`,
      html: orderConfirmationEmail(testOrder, testUser),
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`Check inbox: ${testUser.email}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

sendTestEmail();
