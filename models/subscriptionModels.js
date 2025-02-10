
const { Schema, model } = require('mongoose')

const mailSubscriptionSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowerCase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['subscribed', 'unsubscribed'],
    default: 'subscribed',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

module.exports = model('MailSubscription', mailSubscriptionSchema);
