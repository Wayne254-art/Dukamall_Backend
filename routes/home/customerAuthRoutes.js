const router = require('express').Router()
const customerAuthController = require('../../controllers/home/customerAuthController')
router.post('/customer/customer-register', customerAuthController.customer_register)
router.post('/customer/customer-login', customerAuthController.customer_login)
router.get('/customer/logout', customerAuthController.customer_logout)
router.post("/customer/forgot-password", customerAuthController.request_password_reset)
router.post("/customer/verify-otp", customerAuthController.verify_OTP)
router.post("/customer/reset-password", customerAuthController.reset_password)
module.exports = router