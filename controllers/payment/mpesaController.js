const request = require('request')
require('dotenv').config()
const { getTimestamp } = require('../../utiles/timestamp')

// Initiate STK Push payment request
const InitiateStkPush = async (req, res) => {
    try {
        const { amount, phone, order_id } = req.body;
        const url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
        const auth = 'Bearer ' + req.safaricom_access_token;

        const timestamp = getTimestamp();
        const password = Buffer.from(
            process.env.BUSSINESS_SHORT_CODE + process.env.PASS_KEY + timestamp
        ).toString('base64');

        const callback_url = 'https://dukamall-backend.onrender.com//api/mpesa/stkPushCallback/Order_Id';

        request(
            {
                url: url,
                method: 'POST',
                headers: {
                    Authorization: auth,
                },
                json: {
                    BusinessShortCode: 174379,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: 'CustomerPayBillOnline',
                    Amount: 1,
                    PartyA: '254111239949',
                    PartyB: 174379,
                    PhoneNumber: '254111239949',
                    CallBackURL: callback_url,
                    AccountReference: 'Duka_Mall',
                    TransactionDesc: 'Online Payment',
                },
            },
            function (e, response, body) {
                if (e) {
                    console.error(e);
                    res.status(503).send({
                        message: 'Technical error',
                        error: e,
                    });
                } else {
                    res.status(200).json(body);
                }
            }
        );
    } catch (e) {
        console.error('STK Push Error:', e);
        res.status(500).json({ message: 'Request failed', error: e });
    }
}

// STK Push Callback
const StkPushCallback = async (req, res) => {
    try {
        const { Order_Id } = req.params;

        // Ensure stkcallback exists
        const stkCallback = req.body?.Body?.stkCallback;
        if (!stkCallback) {
            return res.status(400).json({ message: 'Invalid STK callback format' });
        }

        const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
            stkCallback;

        // Handle missing CallbackMetadata
        const meta = CallbackMetadata?.Item ? Object.values(CallbackMetadata.Item) : [];

        const PhoneNumber = meta.find((item) => item.Name === 'PhoneNumber')?.Value?.toString() || 'N/A';
        const Amount = meta.find((item) => item.Name === 'Amount')?.Value?.toString() || '0';
        const MpesaReceiptNumber =
            meta.find((item) => item.Name === 'MpesaReceiptNumber')?.Value?.toString() || 'N/A';
        const TransactionDate =
            meta.find((item) => item.Name === 'TransactionDate')?.Value?.toString() || 'N/A';

        console.log('-'.repeat(20), 'OUTPUT IN THE CALLBACK', '-'.repeat(20));
        console.log(`
            Order_ID: ${Order_Id},
            MerchantRequestID: ${MerchantRequestID},
            CheckoutRequestID: ${CheckoutRequestID},
            ResultCode: ${ResultCode},
            ResultDesc: ${ResultDesc},
            PhoneNumber: ${PhoneNumber},
            Amount: ${Amount},
            MpesaReceiptNumber: ${MpesaReceiptNumber},
            TransactionDate: ${TransactionDate}
        `);

        res.json(true);
    } catch (e) {
        console.error('Technical error', e);
        res.status(500).json({ message: 'Request failed', error: e.message });
    }
}

module.exports = {
    InitiateStkPush,
    StkPushCallback,
};
