const authorOrder = require('../../models/authOrder')
const customerOrder = require('../../models/customerOrder')
const sellerWallet = require('../../models/sellerWallet')
const myShopWallet = require('../../models/myShopWallet')
const sellerModel = require('../../models/sellerModel')

const adminSellerMessage = require('../../models/chat/adminSellerMessage')
const sellerCustomerMessage = require('../../models/chat/sellerCustomerMessage')
const productModel = require('../../models/productModel')

const { mongo: { ObjectId } } = require('mongoose')
const { responseReturn } = require('../../utiles/response')

module.exports.get_seller_dashboard_data = async (req, res) => {
    const { id } = req;

    try {
        const totalSele = await sellerWallet.aggregate([
            {
                $match: {
                    sellerId: {
                        $eq: id
                    }
                }
            }, {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ])

        const totalProduct = await productModel.find({
            sellerId: new ObjectId(id)
        }).countDocuments()

        const totalOrder = await authorOrder.find({
            sellerId: new ObjectId(id)
        }).countDocuments()

        const totalPendingOrder = await authorOrder.find({
            $and: [
                {
                    sellerId: {
                        $eq: new ObjectId(id)
                    }
                },
                {
                    delivery_status: {
                        $eq: 'pending'
                    }
                }
            ]
        }).countDocuments()

        const messages = await sellerCustomerMessage.find({
            $or: [
                {
                    senderId: {
                        $eq: id
                    }
                },
                {
                    receverId: {
                        $eq: id
                    }
                }
            ]
        }).limit(3)

        const recentOrders = await authorOrder.find({
            sellerId: new ObjectId(id)
        }).limit(5)

        const monthlySales = await sellerWallet.aggregate([
            { $match: {
                sellerId: {
                    $eq: id
                }
            } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]);

        const formattedMonthlySales = Array(12).fill(0);
        monthlySales.forEach(({ _id, totalAmount }) => {
            formattedMonthlySales[_id - 1] = totalAmount;
        });

        const monthlyOrders = await authorOrder.aggregate([
            { $match: { sellerId: new ObjectId(id) } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalOrders: { $sum: 1 },
                },
            },
        ]);

        const formattedMonthlyOrders = Array(12).fill(0);
        monthlyOrders.forEach(({ _id, totalOrders }) => {
            formattedMonthlyOrders[_id - 1] = totalOrders;
        });

        const monthlyProducts = await productModel.aggregate([
            { $match: { sellerId: new ObjectId(id) } },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalProducts: { $sum: 1 },
                },
            },
        ]);

        const formattedMonthlyProducts = Array(12).fill(0);
        monthlyProducts.forEach(({ _id, totalProducts }) => {
            formattedMonthlyProducts[_id - 1] = totalProducts;
        });


        responseReturn(res, 200, {
            totalOrder,
            totalSale: totalSele.length > 0 ? totalSele[0].totalAmount : 0,
            totalPendingOrder,
            messages,
            recentOrders,
            totalProduct,
            monthlySales: formattedMonthlySales,
            monthlyOrders: formattedMonthlyOrders,
            monthlyProducts: formattedMonthlyProducts,
        })
    } catch (error) {
        console.log('get seller dashboard data error ' + error.messages)
    }
}

module.exports.get_admin_dashboard_data = async (req, res) => {
    const { id } = req
    try {
        const totalSele = await myShopWallet.aggregate([
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' }
                }
            }
        ])


        const totalProduct = await productModel.find({}).countDocuments()

        const totalOrder = await customerOrder.find({}).countDocuments()

        const totalSeller = await sellerModel.find({}).countDocuments()

        const messages = await adminSellerMessage.find({}).limit(3)

        const recentOrders = await customerOrder.find({}).limit(5)

        const monthlySales = await myShopWallet.aggregate([
            {
                $group: {
                    _id: { month: { $month: '$createdAt' } },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.month': 1 } }
        ]);

        const monthlyOrders = await customerOrder.aggregate([
            {
                $group: {
                    _id: { month: { $month: '$createdAt' } },
                    count: { $sum: 1 } // Count the number of documents
                }
            },
            { $sort: { '_id.month': 1 } }
        ]);
        

        const monthlySellers = await sellerModel.aggregate([
            {
                $group: {
                    _id: { month: { $month: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.month': 1 } }
        ]);

        const formatMonthlyData = (data, field) => {
            const result = Array(12).fill(0);
            data.forEach(item => {
                result[item._id.month - 1] = item[field];
            });
            return result;
        };

        responseReturn(res, 200, {
            totalOrder,
            totalSale: totalSele.length > 0 ? totalSele[0].totalAmount : 0,
            totalSeller,
            messages,
            recentOrders,
            totalProduct,
            monthlySales: formatMonthlyData(monthlySales, 'totalAmount'),
            monthlyOrders: formatMonthlyData(monthlyOrders, 'count'),
            monthlySellers: formatMonthlyData(monthlySellers, 'count')
        })

    } catch (error) {
        console.log('get admin dashboard data error ' + error.messages)
    }

}