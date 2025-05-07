const router = require('express').Router()
const { accessToken } = require('../middlewares/mpesaMiddleware')
const { InitiateStkPush, StkPushCallback }= require('../controllers/payment/mpesaController')

router.post('/mpesa/stkPush', accessToken, InitiateStkPush)
router.post('/mpesa/stkPushCallback/:Order_Id', StkPushCallback)

module.exports = router;
