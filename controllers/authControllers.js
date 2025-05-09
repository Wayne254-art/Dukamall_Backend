const adminModel = require('../models/adminModel')
const sellerModel = require('../models/sellerModel')
const sellerCustomerModel = require('../models/chat/sellerCustomerModel')
const bcrpty = require('bcrypt')
const formidable = require('formidable')
const cloudinary = require('cloudinary').v2
const { responseReturn } = require('../utiles/response')
const { createToken } = require('../utiles/tokenCreate')
const { send_OTP_email } = require('../utiles/mailService')
const bcrypt = require('bcrypt')
const cron = require("node-cron")

class authControllers {

    admin_login = async (req, res) => {
        const { email, password } = req.body
        try {
            const admin = await adminModel.findOne({ email }).select('+password')
            if (admin) {
                const match = await bcrpty.compare(password, admin.password)
                if (match) {
                    const token = await createToken({
                        id: admin.id,
                        role: admin.role
                    })
                    res.cookie('accessToken', token, {
                        httpOnly: true,
                        // secure: process.env.NODE_ENV === 'production',
                        secure: true,
                        sameSite: 'None',
                        path: '/',
                        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    })
                    responseReturn(res, 200, { token, message: 'Login successful' })
                } else {
                    responseReturn(res, 404, { error: "Invalid Credentials" })
                }
            } else {
                responseReturn(res, 404, { error: "Invalid Credentials" })
            }
        } catch (error) {
            responseReturn(res, 500, { error: error.message })
        }
    }

    seller_login = async (req, res) => {
        const { email, password } = req.body
        try {
            const seller = await sellerModel.findOne({ email }).select('+password')
            if (seller) {
                const match = await bcrpty.compare(password, seller.password)
                if (match) {
                    const token = await createToken({
                        id: seller.id,
                        role: seller.role
                    })
                    res.cookie('accessToken', token, {
                        httpOnly: true,
                        secure: true,
                        sameSite: 'None',
                        path: '/',
                        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    })
                    responseReturn(res, 200, { token, message: 'Login successful' })
                } else {
                    responseReturn(res, 404, { error: "Invalid Credentials" })
                }
            } else {
                responseReturn(res, 404, { error: "Invalid Credentials" })
            }
        } catch (error) {
            responseReturn(res, 500, { error: error.message })
        }
    }

    seller_register = async (req, res) => {
        const { email, name, password } = req.body
        try {
            const getUser = await sellerModel.findOne({ email })
            if (getUser) {
                responseReturn(res, 404, { error: 'User already exists' })
            } else {
                const seller = await sellerModel.create({
                    name,
                    email,
                    password: await bcrpty.hash(password, 10),
                    method: 'manualy',
                    shopInfo: {},
                    paymentInfo: {}
                })
                await sellerCustomerModel.create({
                    myId: seller.id
                })
                const token = await createToken({ id: seller.id, role: seller.role })
                res.cookie('accessToken', token, {
                    httpOnly: true,
                    // secure: process.env.NODE_ENV === 'production',
                    secure: true,
                    sameSite: 'None',
                    path: '/',
                    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                })
                responseReturn(res, 201, { token, message: 'registration successful' })
            }
        } catch (error) {
            responseReturn(res, 500, { error: 'Internal server error' })
        }
    }

    request_password_reset = async (req, res) => {
        const { email } = req.body;

        try {
            const user = await sellerModel.findOne({ email });
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
            const user = await sellerModel.findOne({ email });
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
            const user = await sellerModel.findOne({ email });
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

    getUser = async (req, res) => {
        const { id, role } = req;

        try {
            if (role === 'admin') {
                const user = await adminModel.findById(id)
                responseReturn(res, 200, { userInfo: user })
            } else {
                const seller = await sellerModel.findById(id)
                responseReturn(res, 200, { userInfo: seller })
            }
        } catch (error) {
            responseReturn(res, 500, { error: 'Internal server error' })
        }
    }

    profile_image_upload = async (req, res) => {
        const { id } = req;

        if (!id) {
            return responseReturn(res, 400, { error: "User ID is required" });
        }

        const form = new formidable.IncomingForm({ multiples: false, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return responseReturn(res, 400, { error: "Error parsing form data" });
            }

            const image = files.image?.[0] || files.image;

            if (!image || !image.filepath) {
                return responseReturn(res, 400, { error: "No image file uploaded" });
            }

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true
            });

            try {
                console.log("Uploading image to Cloudinary:", image.filepath);

                const result = await cloudinary.uploader.upload(image.filepath, { folder: 'profile' });

                if (!result?.secure_url) {
                    return responseReturn(res, 400, { error: "Image upload failed" });
                }

                await sellerModel.findByIdAndUpdate(id, { image: result.secure_url });

                const userInfo = await sellerModel.findById(id);

                return responseReturn(res, 201, { message: "Image upload success", userInfo });

            } catch (error) {
                console.error("Image Upload Error:", error);
                return responseReturn(res, 500, { error: "Internal server error" });
            }
        });
    };

    profile_info_add = async (req, res) => {
        const { county, constituency, ward, street_no, shopName, phoneNumber, building_name } = req.body;
        const { id } = req;

        try {
            await sellerModel.findByIdAndUpdate(id, {
                shopInfo: {
                    shopName,
                    phoneNumber,
                    county,
                    constituency,
                    ward,
                    street_no,
                    building_name,
                }
            })
            const userInfo = await sellerModel.findById(id)
            responseReturn(res, 201, { message: 'Profile info added successfully', userInfo })
        } catch (error) {
            responseReturn(res, 500, { error: error.message })
        }
    }

    payment_info_add = async (req, res) => {
        const { account_no, settlement_bank, till_no } = req.body;
        const { id } = req;

        try {
            await sellerModel.findByIdAndUpdate(id, {
                paymentInfo: {
                    account_no,
                    settlement_bank,
                    till_no,
                }
            })
            const userInfo = await sellerModel.findById(id)
            responseReturn(res, 201, { message: 'Payment info added successfully', userInfo })
        } catch (error) {
            responseReturn(res, 500, { error: error.message })
        }
    }

    logout = async (req, res) => {
        try {
            res.cookie('accessToken', null, {
                httpOnly: true,
                // secure: process.env.NODE_ENV === 'production',
                secure: true,
                sameSite: 'None',
                path: '/',
                expires: new Date(Date.now()),
            })
            responseReturn(res, 200, { message: 'logout successful' })
        } catch (error) {
            responseReturn(res, 500, { error: error.message })
        }
    }

}

// 🔄 **Cron Job: Clear expired OTPs every 5 minutes**
cron.schedule("*/5 * * * *", async () => {
    try {
        const expiredOTPs = await sellerModel.find({ resetOTPExpires: { $lt: Date.now() } });

        if (expiredOTPs.length > 0) {
            await sellerModel.updateMany(
                { resetOTPExpires: { $lt: Date.now() } },
                { $set: { resetOTP: null, resetOTPExpires: null } }
            );
            console.log(`✅ Cleared ${expiredOTPs.length} expired OTPs.`);
        }
    } catch (error) {
        console.error("❌ Error clearing expired OTPs:", error);
    }
})

module.exports = new authControllers()