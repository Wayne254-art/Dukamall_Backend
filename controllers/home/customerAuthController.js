const customerModel = require('../../models/customerModel')
const { responseReturn } = require('../../utiles/response')
const { createToken } = require('../../utiles/tokenCreate')
const sellerCustomerModel = require('../../models/chat/sellerCustomerModel')
const bcrypt = require('bcrypt')

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
}

module.exports = new customerAuthController()