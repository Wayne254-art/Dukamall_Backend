
const express = require('express');
const router = express.Router();

// Predefined responses mapped to keywords
const responses = [
  { keywords: ['hello', 'hi', 'hey'], reply: 'Hello! How can I assist you today? 😊' },
  { keywords: ['who are you', 'what is your name'], reply: 'I am a DukaMall assistant, here to assist you with our services.' },
  { keywords: ['about dukamall', 'what is dukamall'], reply: 'DukaMall is an online marketplace where buyers and sellers connect for a seamless shopping experience.' },
  { keywords: ['pricing', 'cost', 'price'], reply: 'Our pricing varies based on products and vendors. Check product listings for exact prices.' },
  { keywords: ['payment methods', 'how to pay', 'pay'], reply: 'We accept credit/debit cards, mobile money, and bank transfers.' },
  { keywords: ['refund', 'money back'], reply: 'Refunds are processed within 7 business days after approval. Mail refunds@dukamall.co.ke for more details.' },
  { keywords: ['installment', 'pay later'], reply: 'We currently do not offer installment payments, but stay tuned for future updates!' },
  { keywords: ['order status', 'track order', 'where is my order'], reply: 'You can track your order under "My Orders" in your account.' },
  { keywords: ['cancel order', 'how to cancel'], reply: 'To cancel an order, go to "My Orders" and select the order. If it’s shipped, cancellation may not be possible.' },
  { keywords: ['shipping', 'delivery', 'ship', 'deliver'], reply: 'Shipping times vary by vendor and location and it takes a maximum of 7-days. Check product pages for estimated delivery times.' },
  { keywords: ['return policy', 'how to return'], reply: 'Our return policy allows returns within 3 days of delivery for eligible products. Check product details for return eligibility.' },
  { keywords: ['reset password'], reply: 'To reset your password, click "Forgot Password" on the login page and follow the instructions.' },
  { keywords: ['sell', 'vendor', 'seller'], reply: 'To sell on DukaMall, login as a Seller and register your store. Wait for Admin approval!' },
  { keywords: ['offers', 'discounts', 'deals'], reply: 'Check our homepage or the "Offers" section for the latest discounts and promotions.' },
  { keywords: ['contact support', 'help'], reply: 'You can reach our support team at support@dukamall.co.ke or use this chat for assistance.' },
  { keywords: ['working hours', 'support hours'], reply: 'Our support team is available 24/7 to assist you.' },
  { keywords: ['store location', 'where is dukamall', 'location'], reply: 'DukaMall is an online platform, accessible anytime, anywhere!' },
  { keywords: ['secure shopping', 'secure', 'is this safe', 'safety'], reply: 'Yes! We use secure payment gateways and buyer protection policies for a safe shopping experience.' }
];

router.post('/helpcenter/chat', (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ reply: 'Please provide a valid message.' });
    }

    const lowerMessage = message.toLowerCase().trim();

    // Search for a matching response
    const matchedResponse = responses.find(({ keywords }) => 
      keywords.some(keyword => lowerMessage.includes(keyword))
    );

    // Send reply or default response
    res.json({ reply: matchedResponse ? matchedResponse.reply : 'I’m sorry, I didn’t understand that. Can you rephrase or reach out to our support team?' });
  } catch (error) {
    console.error('Chatbot Error:', error);
    res.status(500).json({ reply: 'An error occurred. Please try again later or contact support.' });
  }
});

module.exports = router;