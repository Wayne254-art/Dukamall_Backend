const router = require('express').Router()
const bannerController = require('../controllers/bannerController')
const { authMiddleware } = require('../middlewares/authMiddleware')
router.post('/banner/add', authMiddleware, bannerController.add_banner)
router.post('/banner/admin/add', authMiddleware, bannerController.add_banner_image)
router.get('/banner/get/:productId', authMiddleware, bannerController.get_banner)
router.put('/banner/update/:bannerId', authMiddleware, bannerController.update_banner)
router.get('/banners', bannerController.get_banners)
router.delete('/banner/delete/:bannerId', authMiddleware, bannerController.delete_banner)

module.exports = router