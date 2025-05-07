const customerModel = require('../../models/customerModel')
const { responseReturn } = require('../../utiles/response')
const { createToken } = require('../../utiles/tokenCreate')
const sellerCustomerModel = require('../../models/chat/sellerCustomerModel')
const bcrypt = require('bcrypt')
const { send_OTP_email } = require('../../utiles/mailService')
const cron = require("node-cron")

class customerAuthController {
    customer_register = async (req, res) => {
        const { name, email, password } = req.body

        try {
            const customer = await customerModel.findOne({ email })
            if (customer) {
                responseReturn(res, 404, { error: 'User Exist!please Login' })
            } else {
                const createCustomer = await customerModel.create({
                    name: name.trim(),
                    email: email.trim(),
                    password: await bcrypt.hash(password, 10),
                    method: 'manualy'
                })
                await sellerCustomerModel.create({
                    myId: createCustomer.id
                })
                const token = await createToken({
                    id: createCustomer.id,
                    name: createCustomer.name,
                    email: createCustomer.email,
                    method: createCustomer.method
                })
                res.cookie('customerToken', token, {
                    httpOnly: true,
                    // secure: process.env.NODE_ENV === 'production',
                    secure: true,
                    sameSite: 'None',
                    path: '/',
                    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                })
                responseReturn(res, 201, { message: 'Registration successful', token })
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    customer_login = async (req, res) => {
        const { email, password } = req.body
        try {
            const customer = await customerModel.findOne({ email }).select('+password')
            if (customer) {
                const match = await bcrypt.compare(password, customer.password)
                if (match) {
                    const token = await createToken({
                        id: customer.id,
                        name: customer.name,
                        email: customer.email,
                        method: customer.method
                    })
                    res.cookie('customerToken', token, {
                        httpOnly: true,
                        // secure: process.env.NODE_ENV === 'production',
                        secure: true,
                        sameSite: 'None',
                        path: '/',
                        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    })
                    responseReturn(res, 201, { message: 'Login successful', token })
                } else {
                    responseReturn(res, 404, { error: "Invalid Credentials" })
                }
            } else {
                responseReturn(res, 404, { error: 'Invalid Credentials' })
            }
        } catch (error) {
            console.log(error.message)
        }
    }

    customer_logout = async (req, res) => {
        res.cookie('customerToken', "", {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production',
            secure: true,
            sameSite: 'None',
            path: '/',
            expires: new Date(Date.now())
        })
        responseReturn(res, 200, { message: 'Logout successful' })
    }

    request_password_reset = async (req, res) => {
        const { email } = req.body;

        try {
            const user = await customerModel.findOne({ email });
            if (!user) {
                return responseReturn(res, 404, { message: 'Invalid user' })
            }

            const otp = Math.floor(100000 + Math.random() * 900000)
            user.resetOTP = otp;
            user.resetOTPExpires = Date.now() + 10 * 60 * 1000

            await user.save()
            await send_OTP_email(email, otp)

            responseReturn(res, 200, { message: 'OTP sent to email' })
        } catch (error) {
            console.error("Error in request_password_reset:", error)
            res.status(500).json({ message: "Internal server error" })
        }
    }

    verify_OTP = async (req, res) => {
        const { email, otp } = req.body;
        try {
            const user = await customerModel.findOne({ email });
            if (!user || user.resetOTP !== parseInt(otp) || user.resetOTPExpires < Date.now()) {
                return res.status(400).json({ message: "Invalid or expired OTP" });
            }
            res.json({ message: "OTP verified successfully" });
        } catch (error) {
            res.status(500).json({ message: "Internal server error" });
        }
    }

    reset_password = async (req, res) => {
        const { email, newPassword } = req.body;
        try {
            const user = await customerModel.findOne({ email });
            if (!user) return res.status(404).json({ message: "User not found" });

            user.password = await bcrypt.hash(newPassword, 10);
            user.resetOTP = null;
            user.resetOTPExpires = null;
            await user.save();

            res.json({ message: "Password reset successfully" });
        } catch (error) {
            console.log('error:', error)
            res.status(500).json({ message: "Internal server error" });
        }
    }

}

// 🔄 **Cron Job: Clear expired OTPs every 5 minutes**
cron.schedule("*/5 * * * *", async () => {
    try {
        const expiredOTPs = await customerModel.find({ resetOTPExpires: { $lt: Date.now() } });

        if (expiredOTPs.length > 0) {
            await customerModel.updateMany(
                { resetOTPExpires: { $lt: Date.now() } },
                { $set: { resetOTP: null, resetOTPExpires: null } }
            );
            console.log(`✅ Cleared ${expiredOTPs.length} expired OTPs.`);
        }
    } catch (error) {
        console.error("❌ Error clearing expired OTPs:", error);
    }
});

module.exports = new customerAuthController()