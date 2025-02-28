const router = require('express').Router()
const orderController = require('../../controllers/order/orderController')
const { customerMiddleware } = require('../../middlewares/customerMiddleware')

// ---- customer
router.post('/home/order/place-order', orderController.place_order)
router.get('/home/customer/get-dashboard-data/:userId', orderController.get_customer_databorad_data)
router.get('/home/customer/get-orders/:customerId/:status', orderController.get_orders)
router.get('/home/customer/get-order/:orderId', orderController.get_order)
router.post('/order/create-payment', customerMiddleware, orderController.create_payment)
router.post('/order/confirm/:orderId', orderController.order_confirm)
router.get('/verify/:reference', orderController.verifyPayment)

// --- admin
router.get('/admin/orders', orderController.get_admin_orders)
router.get('/admin/order/:orderId', orderController.get_admin_order)
router.put('/admin/order-status/update/:orderId', orderController.admin_order_status_update)

// ---seller

router.get('/seller/orders/:sellerId', orderController.get_seller_orders)
router.get('/seller/order/:orderId', orderController.get_seller_order)
router.put('/seller/order-status/update/:orderId', orderController.seller_order_status_update)

module.exports = router