const { Schema, model } = require('mongoose');

const installmentProductsSchema = new Schema(
    {
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "customers",
            required: true
        },
        sellerId: {
            type: Schema.Types.ObjectId,
            ref: "sellers",
            required: true
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: "products",
            required: true
        },
        fullName: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        totalPrice: {
            type: Number,
            required: true
        },
        status: {
            type: String, 
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },
    },
    { timestamps: true }
);

installmentProductsSchema.index(
    { fullName: 'text', phone: 'text' },
    { weights: { fullName: 5, phone: 4 } }
);

installmentProductsSchema.statics.getPopulatedInstallments = function () {
    return this.find()
        .populate('customerId')
        .populate('sellerId')
        .populate('productId');
};

module.exports = model("InstallmentProducts", installmentProductsSchema);
