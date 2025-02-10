const { Schema, model } = require('mongoose')

const bannerSchema = new Schema({
    productId: {
        type: Schema.ObjectId,
        required: false,
        default: "67594b91471002df622b66ab",
    },
    banner: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: false,
        default: "shop-zone-banner",
    }

}, { timestamps: true })

module.exports = model('banners', bannerSchema)