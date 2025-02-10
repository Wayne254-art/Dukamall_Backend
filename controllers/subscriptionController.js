
const subscriptionModel = require('../models/subscriptionModels');

class MailSubscription {
  async addSubscription(req, res) {
    const { email } = req.body;

    try {
      const existingSubscription = await subscriptionModel.findOne({ email });
      if (existingSubscription) {
        return res.status(400).json({ message: 'Email is already subscribed' });
      }

      const newSubscription = new subscriptionModel({ email });
      await newSubscription.save();

      res.status(201).json({ message: 'Subscription successful', subscription: newSubscription });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  }
}

module.exports = new MailSubscription();
