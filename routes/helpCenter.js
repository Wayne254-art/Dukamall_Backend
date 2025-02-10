
const express = require('express');
const router = express.Router();

router.post('/helpcenter/chat', (req, res) => {
  const { message } = req.body;

  let reply;

  const lowerMessage = message.toLowerCase();

  // Greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    reply = 'Hello! How can I assist you today?';
  } 
  // Pricing
  else if (lowerMessage.includes('pricing') || lowerMessage.includes('cost')) {
    reply = 'Our pricing details vary for different products and vendors. You can find specific prices on the product listing pages.';
  } 
  //Who are You
  else if (lowerMessage.includes('who') || lowerMessage.includes('you')) {
    reply = 'I am DukaMall AI to help you about our Services';
  } 
  // Orders
  else if (lowerMessage.includes('order status') || lowerMessage.includes('track order')) {
    reply = 'You can track your order status under "My Orders" in your account.';
  } else if (lowerMessage.includes('cancel order')) {
    reply = 'To cancel an order, go to "My Orders" and select the order you want to cancel. If the order is already shipped, cancellation may not be possible.';
  } 
  // Payments
  else if (lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
    reply = 'We accept various payment methods, including credit/debit cards, mobile money, and bank transfers.';
  } else if (lowerMessage.includes('refund')) {
    reply = 'Refunds are processed within 7 business days after the request is approved. You can check your refund status in "My Orders."';
  } 
  // Shipping
  else if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery') || lowerMessage.includes('ship') || lowerMessage.includes('deliver')) {
    reply = 'Shipping times vary based on the vendor/seller and location. Check the product page for estimated delivery times.';
  } else if (lowerMessage.includes('return policy')) {
    reply = 'Our return policy allows returns within 3 days of delivery for eligible products. Please check the product details for return eligibility.';
  } 
  // Account Management
  else if (lowerMessage.includes('reset password')) {
    reply = 'To reset your password, click "Forgot Password" on the login page and follow the instructions.';
  } else if (lowerMessage.includes('update profile')) {
    reply = 'You can update your profile information under the "My Account" section.';
  } 
  // Vendor Queries
  else if (lowerMessage.includes('sell') || lowerMessage.includes('vendor')) {
    reply = 'If you want to sell on our platform, Login as a Seller and register your store.';
  } else if (lowerMessage.includes('commission')) {
    reply = 'We charge a commission on each sale. The rate depends on the category of products you are selling. Check the vendor dashboard for more details.';
  } 
  // General Queries
  else if (lowerMessage.includes('contact support')) {
    reply = 'You can contact our support team at support@myshop.co.ke or through this chat for assistance.';
  } else if (lowerMessage.includes('working hours')) {
    reply = 'Our support team is available 24/7 to assist you.';
  } else if (lowerMessage.includes('offers') || lowerMessage.includes('discounts')) {
    reply = 'You can find the latest offers and discounts on our homepage or in the "Offers" section.';
  } 
  // Default Response
  else {
    reply = 'I am sorry, I did not understand that. Reach Out Our support team';
  }

  res.json({ reply });
});

module.exports = router;
