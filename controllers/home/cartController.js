const cartModel = require('../../models/cartModel')
const wishlistModel = require('../../models/wishlistModel')
const { responseReturn } = require('../../utiles/response')
const { ObjectId } = require('mongodb')

class cartController {

    add_to_cart = async (req, res) => {
        const { userId, productId, quantity } = req.body
        try {
            const existingProduct = await cartModel.findOne({
                $and: [{
                    productId: {
                        $eq: productId
                    }
                },
                {
                    userId: {
                        $eq: userId
                    }
                }
                ]
            })
            if (existingProduct) {
                responseReturn(res, 404, {
                    error: 'Product exists in cart'
                })
            } else {
                const newCartItem = await cartModel.create({
                    userId,
                    productId,
                    quantity
                })
                responseReturn(res, 201, {
                    message: 'Added to cart successfully',
                    product: newCartItem,
                })
            }
        } catch (error) {
            console.log('An Error Occurred:', error.message)
            return res.status(500).json({ error: 'Server Error!' })
        }
    }

    get_cart_products = async (req, res) => {
        const co = 5;
        const { userId } = req.params
        const userObjectId = new ObjectId(userId)
        try {
            const cart_products = await cartModel.aggregate([{
                $match: {
                    userId: userObjectId
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: "_id",
                    as: 'products'
                }
            }
            ])

            let buy_product_item = 0
            let calculatePrice = 0;
            let cart_product_count = 0;

            const outOfStockProduct = cart_products.filter(p => p.products.length > 0 && p.products[0].stock < p.quantity)
            for (let i = 0; i < outOfStockProduct.length; i++) {
                cart_product_count += outOfStockProduct[i].quantity
            }

            const stockProduct = cart_products.filter(p => p.products.length > 0 && p.products[0].stock >= p.quantity)
            for (let i = 0; i < stockProduct.length; i++) {
                const { quantity } = stockProduct[i]
                // const product = stockProduct[i].products[0]

                cart_product_count += quantity
                buy_product_item += quantity

                const { price, discount } = stockProduct[i].products[0]
                if (discount !== 0) {
                    calculatePrice += quantity * (price - Math.floor((price * discount) / 100))
                } else {
                    calculatePrice += quantity * price
                }
            }

            let p = []
            let uniqueSellers = [...new Set(stockProduct.map(p => p.products[0].sellerId.toString()))]
            for (let i = 0; i < uniqueSellers.length; i++) {
                let price = 0;

                for (let j = 0; j < stockProduct.length; j++) {
                    const tempProduct = stockProduct[j].products[0]

                    if (uniqueSellers[i] === tempProduct.sellerId.toString()) {
                        let pri = 0;

                        if (tempProduct.discount !== 0) {
                            pri = tempProduct.price - Math.floor((tempProduct.price * tempProduct.discount) / 100)
                        } else {
                            pri = tempProduct.price
                        }
                        pri = pri - Math.floor((pri * co) / 100)
                        price += pri * stockProduct[j].quantity
                        p[i] = {
                            sellerId: uniqueSellers[i],
                            shopName: tempProduct.shopName,
                            price,
                            products: p[i] ? [
                                ...p[i].products,
                                {
                                    _id: stockProduct[j]._id,
                                    quantity: stockProduct[j].quantity,
                                    productInfo: tempProduct
                                }
                            ] : [{
                                _id: stockProduct[j]._id,
                                quantity: stockProduct[j].quantity,
                                productInfo: tempProduct

                            }]
                        }
                    }

                }
            }
            responseReturn(res, 200, {
                cart_products: p,
                price: calculatePrice,
                cart_product_count,
                shipping_fee: 85 + (25 * buy_product_item),
                outOfStockProduct,
                buy_product_item
            })

        } catch (error) {
            console.log(error.message)
        }
    }

    delete_cart_product = async (req, res) => {
        const { cart_id } = req.params
        try {
            await cartModel.findByIdAndDelete(cart_id)
            responseReturn(res, 200, { message: 'success' })
        } catch (error) {
            console.log(error.message)
        }
    }

    quantity_inc = async (req, res) => {
        const { cart_id } = req.params

        try {
            const product = await cartModel.findById(cart_id)
            // const { quantity } = product

            const updatedProduct = await cartModel.findByIdAndUpdate(
                cart_id,
                { quantity: product.quantity + 1 },
                { new: true }
            )

            responseReturn(res, 200,
                {
                    message: '+1 success',
                    product: updatedProduct,
                })

        } catch (error) {
            console.log(error.message)
            return res.status(500).json({ error: 'Server Error' })
        }
    }

    quantity_dec = async (req, res) => {
        const { cart_id } = req.params

        try {
            const product = await cartModel.findById(cart_id)

            if (product.quantity <= 1) {
                return res.status(400).json({error: 'Quantity must have a value'})
            }

            const updatedProduct = await cartModel.findByIdAndUpdate(
                cart_id,
                { quantity: product.quantity -1 },
                { new: true }
            )

            responseReturn(res, 200, {
                message: '-1 success',
                product: updatedProduct,
            })
        } catch (error) {
            console.log(error.message)
            return res.status(500).json({ error: 'Server Error' })
        }
    }

    add_wishlist = async (req, res) => {
        const { slug, userId } = req.body

        try {

            const existingProduct = await wishlistModel.findOne({ slug, userId })

            if (existingProduct) {
                responseReturn(res, 400, { error: 'Product exists in wishlist' })
            } else {

                const newWishlistItem = await wishlistModel.create(req.body)
                responseReturn(res, 201, {
                    message: 'added to wishlist successfully',
                    wishlistItem: newWishlistItem,
                })
            }
        } catch (error) {
            console.log(error.message)
            return res.status(500).json({ error: 'Server Error' })
        }
    }

    get_wishlist = async (req, res) => {
        const { userId } = req.params;

        try {
            const wishlists = await wishlistModel.find({
                userId
            })
            responseReturn(res, 200, {
                wishlistCount: wishlists.length,
                wishlists,
            })
        } catch (error) {
            console.log(error.message)
            return res.status(500).json({ error: 'Server Error' })
        }
    }

    delete_wishlist = async (req, res) => {
        const {
            wishlistId
        } = req.params
        try {
            const wishlist = await wishlistModel.findByIdAndDelete(wishlistId)
            responseReturn(res, 200, {
                message: 'success',
                wishlistId
            })
        } catch (error) {
            console.log(error.message)
        }
    }
}

module.exports = new cartController()