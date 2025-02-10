
const express = require('express');
const subscriptionController = require('../controllers/subscriptionController')
const router = express.Router();

router.post('/subscribe', subscriptionController.addSubscription);

module.exports = router;
