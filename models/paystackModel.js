
const { Schema, model } = require('mongoose');

const paystackSchema = new Schema(
  {
    sellerId: {
      type: Schema.ObjectId,
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    businessName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    percentageCharge: {
      type: Number,
      required: true,
    },
    settlementBank: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    bank: {
      type: Number,
      required: true,
    },
    integration: {
      type: Number,
      required: true,
    },
    domain: {
      type: String,
      required: true,
    },
    product: {
      type: String,
      required: true,
    },
    managedByIntegration: {
      type: Number,
      required: true,
    },
    subaccountCode: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      required: true,
    },
    settlementSchedule: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
    },
    migrate: {
      type: Boolean,
      required: true,
    },
    paystackOriginalId: {
      type: Number,
      required: true,
    },
    paystackRecipientCode: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = model('paystacks', paystackSchema);
