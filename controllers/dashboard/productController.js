const formidable = require('formidable')
const cloudinary = require('cloudinary').v2
const productModel = require('../../models/productModel');
const { responseReturn } = require('../../utiles/response');
const mongoose = require('mongoose');
class productController {

    add_product = async (req, res) => {
        const { id } = req;
        const form = formidable({ multiples: true })

        form.parse(req, async (err, field, files) => {
            let { name, category, description, stock, color, size, price, discount, shopName, brand } = field;
            const { images } = files;
            name = name.trim()
            const slug = name.split(' ').join('-')

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true
            })

            try {

                if (typeof color === "string") {
                    color = color ? [{ name: color.trim() }] : [];
                } else if (Array.isArray(color)) {
                    color = color.map(c => ({ name: c.trim() }));
                } else {
                    color = [];
                }
                
                if (typeof size === "string") {
                    size = size ? size.split(",").map(s => ({ value: s.trim() })) : [];
                } else if (Array.isArray(size)) {
                    size = size.map(s => ({ value: s.trim() }));
                } else {
                    size = [];
                }
    
                console.log("Parsed Color:", color);
                console.log("Parsed Size:", size);
                let allImageUrl = [];

                for (let i = 0; i < images.length; i++) {
                    const result = await cloudinary.uploader.upload(images[i].filepath, { folder: 'products', secure: true })
                    allImageUrl = [...allImageUrl, result.url]
                }

                await productModel.create({
                    sellerId: id,
                    name,
                    slug,
                    shopName,
                    category: category.trim(),
                    description: description.trim(),
                    stock: parseInt(stock),
                    price: parseInt(price),
                    discount: parseInt(discount),
                    color,
                    size,
                    images: allImageUrl,
                    brand: brand.trim()

                })
                responseReturn(res, 201, { message: "product added successfully" })
            } catch (error) {
                responseReturn(res, 500, { error: error.message })
            }

        })
    }

    products_get = async (req, res) => {
        const { page, searchValue, parPage } = req.query
        const { id } = req;

        const skipPage = parseInt(parPage) * (parseInt(page) - 1);

        try {
            if (searchValue) {
                const products = await productModel.find({
                    $text: { $search: searchValue },
                    sellerId: id
                }).skip(skipPage).limit(parPage).sort({ createdAt: -1 })
                const totalProduct = await productModel.find({
                    $text: { $search: searchValue },
                    sellerId: id
                }).countDocuments()
                responseReturn(res, 200, { totalProduct, products })
            } else {
                const products = await productModel.find({ sellerId: id }).skip(skipPage).limit(parPage).sort({ createdAt: -1 })
                const totalProduct = await productModel.find({ sellerId: id }).countDocuments()
                responseReturn(res, 200, { totalProduct, products })
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    product_get = async (req, res) => {
        const { productId } = req.params;
        try {
            const product = await productModel.findById(productId)
            responseReturn(res, 200, { product })
        } catch (error) {
            console.log(error.message)
        }
    }

    product_update = async (req, res) => {
        let { name, description, discount, price, brand, productId, stock } = req.body;
        name = name.trim()
        const slug = name.split(' ').join('-')
        try {
            await productModel.findByIdAndUpdate(productId, {
                name, description, discount, price, brand, productId, stock, slug
            })
            const product = await productModel.findById(productId)
            responseReturn(res, 200, { product, message: 'product updated successfully' })
        } catch (error) {
            responseReturn(res, 500, { error: error.message })
        }
    }

    product_image_update = async (req, res) => {
        const form = formidable({ multiples: true })

        form.parse(req, async (err, field, files) => {
            const { productId, oldImage } = field;
            const { newImage } = files

            if (err) {
                responseReturn(res, 404, { error: err.message })
            } else {
                try {
                    cloudinary.config({
                        cloud_name: process.env.cloud_name,
                        api_key: process.env.api_key,
                        api_secret: process.env.api_secret,
                        secure: true
                    })
                    const result = await cloudinary.uploader.upload(newImage.filepath, { folder: 'products', secure: true })

                    if (result) {
                        let { images } = await productModel.findById(productId)
                        const index = images.findIndex(img => img === oldImage)
                        images[index] = result.url;

                        await productModel.findByIdAndUpdate(productId, {
                            images
                        })

                        const product = await productModel.findById(productId)
                        responseReturn(res, 200, { product, message: 'product image updated successfully' })
                    } else {
                        responseReturn(res, 404, { error: 'image upload failed' })
                    }
                } catch (error) {
                    responseReturn(res, 404, { error: error.message })
                }
            }
        })
    }

    get_seller_discounted_products = async (req, res) => {
        try {
            const { sellerId } = req.params;

            if (!sellerId) {
                return res.status(400).json({
                    success: false,
                    message: 'Seller ID is required'
                });
            }

            if (!mongoose.Types.ObjectId.isValid(sellerId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Seller ID format'
                });
            }

            const discountedProducts = await productModel.find({
                sellerId: sellerId,
                discount: { $gt: 0 }
            });

            res.status(200).json({
                success: true,
                data: discountedProducts
            });
        } catch (error) {
            console.error('Error fetching discounted products for seller:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch discounted products for seller',
                error: error.message
            });
        }
    };

    get_all_products = async (req, res) => {
        try {
            const products = await productModel.find();
            res.status(200).json(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    }

    delete_product = async (req, res) => {
        try {
            const { productId } = req.params;

            const product = await productModel.findByIdAndDelete(productId);

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.status(200).json({ message: 'Product deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Server error, please try again later' });
        }
    };

    get_random_discounted_products = async (req, res) => {
        try {
            const discountedProducts = await productModel.aggregate([
                { $match: { discount: { $gt: 0 } } },
                { $sample: { size: 1 } },
            ]);

            res.status(200).json({
                success: true,
                data: discountedProducts,
            });
        } catch (err) {
            console.error("Error fetching products:", err);

            res.status(500).json({
                success: false,
                message: "An error occurred while fetching products.",
            });
        }
    };

    product_status_update = async (req, res) => {
        const { productId, isActive } = req.body;

        const isActiveBoolean = isActive === 'true';

        try {
            // console.log('Updating product with ID:', productId, 'to isActive:', isActiveBoolean);

            const updatedProduct = await productModel.findByIdAndUpdate(
                productId,
                { isActive: isActiveBoolean },
                { new: true, runValidators: true }
            );

            if (!updatedProduct) {
                return responseReturn(res, 404, { message: 'Product not found.' });
            }

            responseReturn(res, 200, {
                product: updatedProduct,
                message: 'Product status updated successfully',
            });
        } catch (error) {
            console.error('Error updating product:', error.message);
            responseReturn(res, 500, { error: error.message });
        }
    };



}

module.exports = new productController()