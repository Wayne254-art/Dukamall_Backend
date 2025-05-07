const express = require('express')
const Installment = require('../../models/installmentProducts');
const { responseReturn } = require('../../utiles/response');

const router = express.Router();

class InstallmentProductControllers {

    apply_for_installment = async (req, res) => {
        try {
            const installment = new Installment(req.body);
            await installment.save();
            responseReturn(res, 201, { message: "Installment application submitted successfully" });
        } catch (error) {
            responseReturn (res, 500, { error: error.message });
        }
    }

    

    get_customer_installments = async (req, res) => {
        try {
            const { customerId } = req.params
    
            const installmentProducts = await Installment.find({ customerId }).populate("productId");
    
            res.status(200).json({ success: true, installmentProducts });
        } catch (error) {
            res.status(500).json({ success: false, message: "Server Error", error: error.message });
        }
    }

    get_seller_customer_installments = async (req, res) => {
        try {
            const installments = await Installment.find({ sellerId: req.params.sellerId }).populate('customerId productId');
            res.status(200).json(installments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    get_all_installments_for_admin = async (req, res) => {
        try {
            const installments = await Installment.find().populate('customerId sellerId productId');
            res.status(200).json(installments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

}

module.exports = new InstallmentProductControllers()
