const router = require('express').Router()
const { authMiddleware } = require('../../middlewares/authMiddleware')
const productController = require('../../controllers/dashboard/productController')

router.post('/product-add', authMiddleware, productController.add_product)
router.get('/products-get', authMiddleware, productController.products_get)
router.get('/product-get/:productId', authMiddleware, productController.product_get)
router.post('/product-update', authMiddleware, productController.product_update)
router.post('/product-image-update', authMiddleware, productController.product_image_update)
router.get('/products/discounted/:sellerId', authMiddleware, productController.get_seller_discounted_products);
router.get('/products-get-all', authMiddleware, productController.get_all_products);
router.delete('/delete/product/:productId', authMiddleware, productController.delete_product);
router.get('/products/random/discounted', productController.get_random_discounted_products)
router.post('/product-status-update',authMiddleware,productController.product_status_update)

module.exports = router