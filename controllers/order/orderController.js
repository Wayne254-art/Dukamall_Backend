
const axios = require('axios');
const moment = require("moment");
const authOrderModel = require("../../models/authOrder");
const customerOrder = require("../../models/customerOrder");
const customer = require("../../models/customerModel");
const cartModel = require("../../models/cartModel");
const myShopWallet = require("../../models/myShopWallet");
const sellerWallet = require("../../models/sellerWallet");
const productModel = require("../../models/productModel")

const { mongo: { ObjectId }, } = require("mongoose");
const { responseReturn } = require("../../utiles/response");
const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);

class orderController {
    paymentCheck = async (id) => {
        try {
            const order = await customerOrder.findById(id);
            if (order.payment_status === "unpaid") {
                await customerOrder.findByIdAndUpdate(id, {
                    delivery_status: "cancelled",
                });
                await authOrderModel.updateMany(
                    {
                        orderId: id,
                    },
                    {
                        delivery_status: "cancelled",
                    }
                );
            }
            return true;
        } catch (error) {
            console.log(error);
        }
    };

    place_order = async (req, res) => {
        const { price, products, shipping_fee, shippingInfo, userId } = req.body;
        let authorOrderData = [];
        let cartId = [];
        const tempDate = moment(Date.now()).format("LLL");

        let customerOrderProduct = [];

        for (let i = 0; i < products.length; i++) {
            const pro = products[i].products;
            for (let j = 0; j < pro.length; j++) {
                let tempCusPro = pro[j].productInfo;
                tempCusPro.quantity = pro[j].quantity;
                customerOrderProduct.push(tempCusPro);
                if (pro[j]._id) {
                    cartId.push(pro[j]._id);
                }

                const product = await productModel.findById(tempCusPro._id);
                if (product) {
                    if (product.stock < tempCusPro.quantity) {
                        return res.status(400).json({ message: "Not enough stock available" });
                    }
                    product.stock -= tempCusPro.quantity;
                    await product.save();
                }
            }
        }

        try {
            const order = await customerOrder.create({
                customerId: userId,
                shippingInfo,
                products: customerOrderProduct,
                price: price + shipping_fee,
                delivery_status: "pending",
                payment_status: "unpaid",
                date: tempDate,
            });
            for (let i = 0; i < products.length; i++) {
                const pro = products[i].products;
                const pri = products[i].price;
                const sellerId = products[i].sellerId;
                let storePro = [];
                for (let j = 0; j < pro.length; j++) {
                    let tempPro = pro[j].productInfo;
                    tempPro.quantity = pro[j].quantity;
                    storePro.push(tempPro);
                }

                authorOrderData.push({
                    orderId: order.id,
                    sellerId,
                    products: storePro,
                    price: pri,
                    payment_status: "unpaid",
                    shippingInfo: "Duka Mall Warehouse",
                    delivery_status: "pending",
                    date: tempDate,
                });
            }
            await authOrderModel.insertMany(authorOrderData);
            for (let k = 0; k < cartId.length; k++) {
                await cartModel.findByIdAndDelete(cartId[k]);
            }
            setTimeout(() => {
                this.paymentCheck(order.id);
            }, 15000);
            responseReturn(res, 201, {
                message: "order placeed success",
                orderId: order.id,
            });
        } catch (error) {
            console.log(error.message);
        }
    };

    get_customer_databorad_data = async (req, res) => {
        const { userId } = req.params;

        try {
            const recentOrders = await customerOrder
                .find({
                    customerId: new ObjectId(userId),
                })
                .limit(5);
            const pendingOrder = await customerOrder
                .find({
                    customerId: new ObjectId(userId),
                    delivery_status: "pending",
                })
                .countDocuments();
            const totalOrder = await customerOrder
                .find({
                    customerId: new ObjectId(userId),
                })
                .countDocuments();
            const cancelledOrder = await customerOrder
                .find({
                    customerId: new ObjectId(userId),
                    delivery_status: "cancelled",
                })
                .countDocuments();
            responseReturn(res, 200, {
                recentOrders,
                pendingOrder,
                cancelledOrder,
                totalOrder,
            });
        } catch (error) {
            console.log(error.message);
        }
    };

    get_orders = async (req, res) => {
        const { customerId, status } = req.params;

        try {
            let orders = [];
            if (status !== "all") {
                orders = await customerOrder.find({
                    customerId: new ObjectId(customerId),
                    delivery_status: status,
                });
            } else {
                orders = await customerOrder.find({
                    customerId: new ObjectId(customerId),
                });
            }
            responseReturn(res, 200, {
                orders,
            });
        } catch (error) {
            console.log(error.message);
        }
    };

    get_order = async (req, res) => {
        const { orderId } = req.params;

        try {
            const order = await customerOrder.findById(orderId);
            responseReturn(res, 200, {
                order,
            });
        } catch (error) {
            console.log(error.message);
        }
    };

    get_admin_orders = async (req, res) => {
        let { page, parPage, searchValue } = req.query;
        page = parseInt(page);
        parPage = parseInt(parPage);

        const skipPage = parPage * (page - 1);

        try {
            if (searchValue) {
            } else {
                const orders = await customerOrder
                    .aggregate([
                        {
                            $lookup: {
                                from: "authororders",
                                localField: "_id",
                                foreignField: "orderId",
                                as: "suborder",
                            },
                        },
                    ])
                    .skip(skipPage)
                    .limit(parPage)
                    .sort({ createdAt: -1 });

                const totalOrder = await customerOrder.aggregate([
                    {
                        $lookup: {
                            from: "authororders",
                            localField: "_id",
                            foreignField: "orderId",
                            as: "suborder",
                        },
                    },
                ]);

                responseReturn(res, 200, { orders, totalOrder: totalOrder.length });
            }
        } catch (error) {
            console.log(error.message);
        }
    };

    get_admin_order = async (req, res) => {
        const { orderId } = req.params;

        try {
            const order = await customerOrder.aggregate([
                {
                    $match: { _id: new ObjectId(orderId) },
                },
                {
                    $lookup: {
                        from: "authororders",
                        localField: "_id",
                        foreignField: "orderId",
                        as: "suborder",
                    },
                },
            ]);
            responseReturn(res, 200, { order: order[0] });
        } catch (error) {
            console.log("get admin order " + error.message);
        }
    };

    admin_order_status_update = async (req, res) => {
        const { orderId } = req.params;
        const { status } = req.body;

        try {
            await customerOrder.findByIdAndUpdate(orderId, {
                delivery_status: status,
            });
            responseReturn(res, 200, { message: "order status change success" });
        } catch (error) {
            console.log("get admin order status error " + error.message);
            responseReturn(res, 500, { message: "internal server error" });
        }
    };

    get_seller_orders = async (req, res) => {
        const { sellerId } = req.params;
        let { page, parPage, searchValue } = req.query;
        page = parseInt(page);
        parPage = parseInt(parPage);

        const skipPage = parPage * (page - 1);

        try {
            if (searchValue) {
            } else {
                const orders = await authOrderModel
                    .find({
                        sellerId,
                    })
                    .skip(skipPage)
                    .limit(parPage)
                    .sort({ createdAt: -1 });
                const totalOrder = await authOrderModel
                    .find({
                        sellerId,
                    })
                    .countDocuments();
                responseReturn(res, 200, { orders, totalOrder });
            }
        } catch (error) {
            console.log("get seller order error " + error.message);
            responseReturn(res, 500, { message: "internal server error" });
        }
    };

    get_seller_order = async (req, res) => {
        const { orderId } = req.params;

        try {
            const order = await authOrderModel.findById(orderId);

            responseReturn(res, 200, { order });
        } catch (error) {
            console.log("get admin order " + error.message);
        }
    };

    seller_order_status_update = async (req, res) => {
        const { orderId } = req.params;
        const { status } = req.body;

        try {
            await authOrderModel.findByIdAndUpdate(orderId, {
                delivery_status: status,
            });
            responseReturn(res, 200, { message: "order status change success" });
        } catch (error) {
            console.log("get admin order status error " + error.message);
            responseReturn(res, 500, { message: "internal server error" });
        }
    };

    responseReturn = (res, status, data) => {
        res.status(status).json(data);
    };

    create_payment = async (req, res) => {
        try {
            const { price, email, orderId } = req.body;

            if (!price || !email || !orderId) {
                return res.status(400).json({ message: 'Price and email are required' });
            }

            const payment = await paystack.transaction.initialize({
                amount: price * 100,
                email,
                currency: "KES",
                callback_url: `${process.env.FRONTEND_URL}/payment/success`,
                metadata: {
                    order_id: orderId,
                },
            });

            return res.status(200).json({
                authorizationUrl: payment.data.authorization_url,
                email,
                reference: payment.data.reference,
                orderId
            });
        } catch (error) {
            console.error("Error creating payment:", error.message);

            return res.status(500).json({ message: "Internal server error" });
        }
    };

    verifyPayment = async (req, res) => {
        const { reference } = req.params;

        try {
            const response = await axios.get(
                `https://api.paystack.co/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    },
                }
            );

            const paymentData = response.data.data;
            // console.log(paymentData);

            const orderId = paymentData.metadata.order_id;

            if (paymentData.status === 'success') {
                // Handle successful payment (e.g., update order status)
                res.json({ status: 'success', orderId: orderId, message: 'Payment verified successfully' });
            } else if (paymentData.status === 'abandoned' || paymentData.status === 'failed') {
                // Handle failed or abandoned payments
                res.json({ status: 'failed', message: 'Payment verification failed' });
            } else {
                // Handle other statuses (e.g., pending or processing)
                res.json({ status: 'processing', message: 'Payment is still processing' });
            }
        } catch (error) {
            console.error('Error verifying payment:', error?.response?.data || error.message);
            res.status(500).json({
                status: 'failed',
                message: 'An error occurred during payment verification',
            });
        }
    };

    order_confirm = async (req, res) => {
        const { orderId } = req.params;
        const { reference } = req.body;

        // console.log('Request Body:', req.body);
        // console.log('Reference:', reference);

        if (!reference) {
            return responseReturn(res, 400, { error: "Reference is required." });
        }

        try {
            // Verify payment with Paystack
            const paystackResponse = await axios.get(
                `https://api.paystack.co/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    },
                }
            );

            // console.log('Paystack Response:', paystackResponse.data);

            if (!paystackResponse.data.status || paystackResponse.data.data.status !== 'success') {
                return responseReturn(res, 400, { error: 'Payment verification failed.' });
            }

            // Update customer order
            const updatedOrder = await customerOrder.findByIdAndUpdate(
                orderId,
                {
                    payment_status: "paid",
                    delivery_status: "pending",
                },
                { new: true }
            );

            if (!updatedOrder) {
                console.error(`No order found with ID: ${orderId}`);
                return responseReturn(res, 404, { error: "Order not found." });
            }

            // Update auth orders
            const updatedAuthOrders = await authOrderModel.updateMany(
                { orderId: new ObjectId(orderId) },
                {
                    payment_status: "paid",
                    delivery_status: "pending",
                }
            );

            console.log('Auth Orders Updated:', updatedAuthOrders.matchedCount);

            // Wallet creation
            const time = moment(Date.now()).format("l");
            const splitTime = time.split("/");

            await myShopWallet.create({
                amount: updatedOrder.price,
                manth: splitTime[0],
                year: splitTime[2],
            });

            const auOrder = await authOrderModel.find({ orderId: new ObjectId(orderId) });
            for (const order of auOrder) {
                await sellerWallet.create({
                    sellerId: order.sellerId.toString(),
                    amount: order.price,
                    manth: splitTime[0],
                    year: splitTime[2],
                });
            }

            responseReturn(res, 200, { message: "Order confirmed successfully." });
        } catch (error) {
            console.error("Error confirming order:", error.response?.data || error.message);
            responseReturn(res, 500, { message: "Internal server error." });
        }
    };

}

module.exports = new orderController();
