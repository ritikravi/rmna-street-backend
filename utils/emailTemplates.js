const orderConfirmationEmail = (order, user) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#000000;padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:6px;font-weight:900;">RMNA</h1>
            <p style="margin:4px 0 0;color:#BB0000;font-size:10px;letter-spacing:4px;text-transform:uppercase;">Built Different</p>
          </td>
        </tr>
        
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#000;font-size:24px;">Order Confirmed! 🎉</h2>
            <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
              Hey ${user.name}, thank you for your order! We're getting it ready for shipment.
            </p>
            
            <!-- Order Details -->
            <div style="background:#f8f8f8;padding:20px;margin:0 0 24px;border-radius:4px;">
              <p style="margin:0 0 8px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Order Details</p>
              <p style="margin:0 0 4px;color:#000;font-size:16px;font-weight:700;">Order #${order._id.toString().slice(-8).toUpperCase()}</p>
              <p style="margin:0;color:#666;font-size:14px;">Placed on ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            
            <!-- Items -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <thead>
                <tr style="border-bottom:2px solid #eee;">
                  <th style="padding:12px 0;text-align:left;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Item</th>
                  <th style="padding:12px 0;text-align:center;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Qty</th>
                  <th style="padding:12px 0;text-align:right;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:16px 0;">
                      <p style="margin:0;color:#000;font-size:14px;font-weight:600;">${item.product?.name || 'Product'}</p>
                      <p style="margin:4px 0 0;color:#666;font-size:12px;">Size: ${item.size}</p>
                    </td>
                    <td style="padding:16px 0;text-align:center;color:#666;font-size:14px;">${item.quantity}</td>
                    <td style="padding:16px 0;text-align:right;color:#000;font-size:14px;font-weight:600;">₹${item.price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <!-- Total -->
            <div style="border-top:2px solid #000;padding-top:16px;margin:0 0 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:4px 0;color:#666;font-size:14px;">Subtotal</td>
                  <td style="padding:4px 0;text-align:right;color:#000;font-size:14px;">₹${order.itemsPrice}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;color:#666;font-size:14px;">Shipping</td>
                  <td style="padding:4px 0;text-align:right;color:#000;font-size:14px;">₹${order.shippingPrice}</td>
                </tr>
                ${order.discount > 0 ? `
                <tr>
                  <td style="padding:4px 0;color:#BB0000;font-size:14px;">Discount</td>
                  <td style="padding:4px 0;text-align:right;color:#BB0000;font-size:14px;">-₹${order.discount}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding:12px 0 0;color:#000;font-size:16px;font-weight:700;">Total</td>
                  <td style="padding:12px 0 0;text-align:right;color:#000;font-size:18px;font-weight:900;">₹${order.totalPrice}</td>
                </tr>
              </table>
            </div>
            
            <!-- Shipping Address -->
            <div style="background:#f8f8f8;padding:20px;border-radius:4px;">
              <p style="margin:0 0 8px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Shipping Address</p>
              <p style="margin:0;color:#000;font-size:14px;line-height:1.6;">
                ${order.shippingAddress.fullName}<br/>
                ${order.shippingAddress.address}<br/>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}<br/>
                Phone: ${order.shippingAddress.phone}
              </p>
            </div>
            
            <p style="margin:24px 0 0;color:#666;font-size:13px;line-height:1.6;">
              We'll send you another email when your order ships. Track your order anytime at 
              <a href="https://rmnastreet.com/orders/${order._id}" style="color:#000;text-decoration:underline;">rmnastreet.com</a>
            </p>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="background:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0 0 8px;color:#000;font-size:14px;font-weight:600;">Need Help?</p>
            <p style="margin:0;color:#666;font-size:12px;">
              Contact us at <a href="mailto:ritikravi7724@gmail.com" style="color:#000;">ritikravi7724@gmail.com</a>
            </p>
            <p style="margin:16px 0 0;color:#bbb;font-size:11px;">© ${new Date().getFullYear()} RMNA Street. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const orderStatusUpdateEmail = (order, user, status) => {
  const statusMessages = {
    processing: 'Your order is being processed',
    shipped: 'Your order has been shipped! 📦',
    delivered: 'Your order has been delivered! 🎉',
    cancelled: 'Your order has been cancelled',
  };

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">
        <tr>
          <td style="background:#000000;padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:6px;font-weight:900;">RMNA</h1>
            <p style="margin:4px 0 0;color:#BB0000;font-size:10px;letter-spacing:4px;text-transform:uppercase;">Built Different</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#000;font-size:24px;">${statusMessages[status]}</h2>
            <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
              Hey ${user.name}, your order #${order._id.toString().slice(-8).toUpperCase()} status has been updated.
            </p>
            
            <div style="background:#f8f8f8;padding:20px;margin:0 0 24px;border-radius:4px;text-align:center;">
              <p style="margin:0 0 8px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Current Status</p>
              <p style="margin:0;color:#000;font-size:20px;font-weight:700;text-transform:uppercase;">${status}</p>
            </div>
            
            ${status === 'shipped' ? `
            <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.6;">
              Your order is on its way! Expected delivery in 3-5 business days.
            </p>
            ` : ''}
            
            <a href="https://rmnastreet.com/orders/${order._id}" style="display:inline-block;background:#000;color:#fff;padding:12px 32px;text-decoration:none;font-size:14px;font-weight:600;border-radius:4px;margin:8px 0;">
              Track Order
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#bbb;font-size:11px;">© ${new Date().getFullYear()} RMNA Street. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;
};

module.exports = {
  orderConfirmationEmail,
  orderStatusUpdateEmail,
};
