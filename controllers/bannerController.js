const formidable = require('formidable')
const productModel = require('../models/productModel')
const cloudinary = require('cloudinary').v2
const { responseReturn } = require('../utiles/response')
const bannerModel = require('../models/bannerModel')
const { mongo: { ObjectId } } = require('mongoose')

class bannerController {

    add_banner = async (req, res) => {
        const form = formidable({ multiples: true })
        form.parse(req, async (err, field, files) => {
            const { productId } = field
            const { image } = files

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true
            })

            try {
                const { slug } = await productModel.findById(productId)
                const result = await cloudinary.uploader.upload(image.filepath, { folder: 'banners' })
                const banner = await bannerModel.create({
                    productId,
                    banner: result.url,
                    link: slug
                })
                responseReturn(res, 201, { banner, message: "banner added successfully" })
            } catch (error) {
                // console.log(error)
                responseReturn(res, 500, { message: error.message })
            }
        })
    }

    get_banner = async (req, res) => {
        const { productId } = req.params

        try {
            const banner = await bannerModel.findOne({ productId: new ObjectId(productId) });
            responseReturn(res, 200, { banner })
        } catch (error) {
            // console.log(error)
            responseReturn(res, 500, { message: error.message })
        }
    }

    get_banners = async (req, res) => {

        try {
            const banners = await bannerModel.aggregate([
                { $match: {} },
                { $sample: { size: 10 } }
            ])
            responseReturn(res, 200, { banners })
        } catch (error) {
            console.log(error)
            responseReturn(res, 500, { message: error.message })
        }
    }

    update_banner = async (req, res) => {
        const { bannerId } = req.params
        const form = formidable({})

        form.parse(req, async (err, _, files) => {
            const { image } = files

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true
            })

            try {
                let banner = await bannerModel.findById(bannerId)
                let temp = banner.banner.split('/')
                temp = temp[temp.length - 1]
                const imageName = temp.split('.')[0]
                await cloudinary.uploader.destroy(imageName)

                const { url } = await cloudinary.uploader.upload(image.filepath, { folder: 'banners' })

                await bannerModel.findByIdAndUpdate(bannerId, {
                    banner: url
                })

                banner = await bannerModel.findById(bannerId)

                responseReturn(res, 200, { banner, message: "banner updated successfully" })

            } catch (error) {
                // console.log(error)
                responseReturn(res, 500, { message: error.message })
            }
        })
    }

    // Admin Controllers
    add_banner_image = async (req, res) => {
        const form = new formidable.IncomingForm({ multiples: false, keepExtensions: true });
    
        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error("Formidable error:", err);
                return res.status(400).json({
                    success: false,
                    message: "Error parsing form data",
                });
            }
    
            // const { image } = files;

            const image = files.image?.[0] || files.image; 
    
            if (!image || !image.filepath) {
                return res.status(400).json({
                    success: false,
                    message: "No image file uploaded",
                });
            }
    
            try {
                cloudinary.config({
                    cloud_name: process.env.cloud_name,
                    api_key: process.env.api_key,
                    api_secret: process.env.api_secret,
                    secure: true,
                });
    
                const result = await cloudinary.uploader.upload(image.filepath, {
                    folder: 'banners',
                });
    
                const bannerImage = await bannerModel.create({
                    // banner: result.url,
                    banner: result.secure_url,
                });
    
                return res.status(201).json({
                    success: true,
                    data: bannerImage,
                    message: "banner uploaded successfully"
                });
            } catch (error) {
                console.error("Cloudinary or database error:", error);
                return res.status(500).json({
                    success: false,
                    message: "Server error while uploading the image",
                });
            }
        });
    };

    delete_banner = async (req, res) => {
        const { bannerId } = req.params;
    
        try {
            const deletedBanner = await bannerModel.findByIdAndDelete(bannerId);
    
            if (!deletedBanner) {
                return res.status(404).json({ error: 'Banner not found' });
            }
    
            res.status(200).json({ message: 'Banner deleted successfully', banner: deletedBanner });
        } catch (error) {
            console.error('Error deleting banner:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };

}

module.exports = new bannerController()