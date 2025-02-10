const router = require('express').Router()
const paymentController = require('../controllers/payment/paymentController')
const { authMiddleware } = require('../middlewares/authMiddleware')

router.post('/payment/create-paystack-sub-account', authMiddleware, paymentController.create_paystack_subaccount)

router.put('/payment/activate-paystack-sub-account/:activeCode', authMiddleware, paymentController.activate_paystack_subaccount)


router.get('/payment/seller-payment-details/:sellerId', authMiddleware, paymentController.get_seller_payment_details)
router.get('/payment/request', authMiddleware, paymentController.get_payment_request)

router.post('/payment/request-confirm', authMiddleware, paymentController.payment_request_confirm)

router.post('/payment/withdrawal-request', authMiddleware, paymentController.withdrawal_request)

router.get("/seller/:sellerId/payment-details", authMiddleware, paymentController.get_seller_bank_account_details);

module.exports = router


