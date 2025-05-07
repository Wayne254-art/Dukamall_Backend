
const router = require('express').Router()
const InstallmentProductControllers = require('../controllers/payment/InstallmentController')
// const { authMiddleware } = require('../middlewares/authMiddleware')

router.post("/installments/apply", InstallmentProductControllers.apply_for_installment)
router.get("/installments/customer/:customerId", InstallmentProductControllers.get_customer_installments);
router.get("/installments/seller/:sellerId", InstallmentProductControllers.get_seller_customer_installments);
router.get("/installments/admin/all", InstallmentProductControllers.get_all_installments_for_admin);

module.exports = router