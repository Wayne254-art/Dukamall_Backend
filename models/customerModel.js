const { Schema, model } = require('mongoose')

const customerSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    resetOTP: {
        type: Number,
        default: null,
    },
    resetOTPExpires: {
        type: Date,
        default: null,
    },
    method: {
        type: String,
        required: true,
    }
}, { timestamps: true })

module.exports = model('customers', customerSchema)