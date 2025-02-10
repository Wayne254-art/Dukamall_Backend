
const paystackModel = require("../../models/paystackModel");
const sellerModel = require("../../models/sellerModel");
const sellerWallet = require("../../models/sellerWallet");
// const myShopWallet = require("../../models/myShopWallet");
const withdrawalRequest = require("../../models/withdrawalRequest");
const { responseReturn } = require("../../utiles/response");
const {
  mongo: { ObjectId },
} = require("mongoose");
// const { v4: uuidv4 } = require("uuid");

const axios = require("axios");
const { error } = require("console");
const nodemailer = require('nodemailer');
// const paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

class paymentController {

  create_paystack_subaccount = async (req, res) => {
    const { id } = req;

    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        message: "Server configuration error",
        error: "Paystack secret key is missing",
      });
    }

    try {
      const existingSubAccount = await paystackModel.findOne({ sellerId: id });

      if (existingSubAccount) {
        return responseReturn(res, 200, {
          message: "Account exists",
          subAccount: existingSubAccount,
        });
      }

      const seller = await sellerModel.findById(id);
      if (!seller)
        return res
          .status(404)
          .json({ message: "invalid seller", error: error.message });

      // Subaccount payload
      const params = {
        business_name: seller.shopInfo.shopName,
        settlement_bank: seller.paymentInfo.settlement_bank,
        account_number: seller.paymentInfo.account_no,
        percentage_charge: 20,
      };
      // console.log("params", params);
      let result;

      try {
        // Make API request to Paystack
        const response = await axios.post(
          "https://api.paystack.co/subaccount",
          params,
          {
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
        result = response.data;
        // console.log(result);
      } catch (error) {
        console.error(
          "Paystack API error:",
          error.response?.data || error.message
        );
        if (error.response) {
          // Return Paystack error response
          return res.status(error.response.status).json({
            message: "Paystack API error",
            error: error.response.data,
          });
        }
        // Handle no response scenario
        return res.status(500).json({
          message: "No response from Paystack",
          error: error.message,
        });
      }

      // const bankCode = seller.paymentInfo.settlement_bank;

      // Handle Paystack response
      if (result && result.status) {
        // Save subaccount details to DB
        await paystackModel.create({
          sellerId: id,
          paystackId: result.data.id,
          status: result.status,
          message: result.message,
          businessName: result.data.business_name,
          accountNumber: result.data.account_number,
          percentageCharge: result.data.percentage_charge,
          settlementBank: result.data.settlement_bank,
          currency: result.data.currency,
          bank: result.data.bank,
          // bankCode: bankCode,
          integration: result.data.integration,
          domain: result.data.domain,
          product: result.data.product,
          managedByIntegration: result.data.managed_by_integration,
          subaccountCode: result.data.subaccount_code,
          isVerified: result.data.is_verified,
          settlementSchedule: result.data.settlement_schedule,
          active: result.data.active,
          migrate: result.data.migrate,
          paystackOriginalId: result.data.id,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
        });

        const updatedSeller = await sellerModel.findByIdAndUpdate(id, {
          $set: { payment: "active" }
        }, { new: true })
        // console.log("Updated Seller:", updatedSeller)

        return res.status(201).json({
          message: "Subaccount created successfully",
          subaccount: result.data,
        });
      } else {
        return res.status(400).json({
          message: "Failed to create subaccount",
          error: result.message,
        });
      }
    } catch (error) {
      // console.error("Server error:", error.message);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  };

  activate_paystack_subaccount = async (req, res) => {
    const { activeCode } = req.params;
    const { id } = req;

    try {
      const userPaystackInfo = await paystackModel.findOne({
        code: activeCode,
      });

      if (userPaystackInfo) {
        await sellerModel.findByIdAndUpdate(id, { payment: "active" });
        responseReturn(res, 200, { message: "Payment activated successfully" });
      } else {
        responseReturn(res, 404, {
          message: "Payment activation failed. Invalid code.",
        });
      }
    } catch (error) {
      console.error("Error activating Paystack subaccount:", error.message);
      responseReturn(res, 500, { message: "Internal server error" });
    }
  };

  get_seller_payment_details = async (req, res) => {
    const { sellerId } = req.params;
    const sumAmount = (data) => {
      return data.reduce((sum, transaction) => sum + transaction.amount, 0);
    };

    try {
      const payments = await sellerWallet.find({ sellerId });

      const pendingWithdrawals = await withdrawalRequest.find({
        sellerId,
        status: 'pending'
      });

      const successfulWithdrawals = await withdrawalRequest.find({
        sellerId,
        status: 'success'
      });

      const pendingAmount = sumAmount(pendingWithdrawals);
      const withdrawnAmount = sumAmount(successfulWithdrawals);
      const totalAmount = sumAmount(payments);

      let availableAmount = 0;
      if (totalAmount > 0) {
        availableAmount = totalAmount - (pendingAmount + withdrawnAmount);
      }

      responseReturn(res, 200, {
        totalAmount,
        pendingAmount,
        withdrawnAmount,
        availableAmount,
        successfulWithdrawals,
        pendingWithdrawals
      });

    } catch (error) {
      console.error('Error fetching seller payment details:', error.message);
      responseReturn(res, 500, { message: 'Internal server error' });
    }
  };

  withdrawal_request = async (req, res) => {
    const { amount, sellerId } = req.body;

    try {
      if (!amount || amount <= 0) {
        return responseReturn(res, 400, { message: 'Invalid withdrawal amount' });
      }

      const seller = await sellerModel.findOne({ _id: sellerId });
      if (!seller) {
        return responseReturn(res, 404, { message: "Seller not found" });
      }

      const sellerSubaccount = await paystackModel.findOne({ sellerId });

      if (!sellerSubaccount) {
        return responseReturn(res, 404, { message: 'Invalid Seller subAccount' });
      }

      const withdrawal = await withdrawalRequest.create({
        sellerId,
        amount: parseInt(amount),
        status: 'pending',
      });

      const wmailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Withdrawal Request Confirmation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f8f9fa;
            margin: 0;
            padding: 0;
          }
          .card {
            background-color: #ffffff;
            width: 90%;
            max-width: 500px;
            margin: 20px auto;
            border:2px black solid;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 20px;
            box-sizing: border-box;
          }
          .card h2 {
            font-size: 1.5rem;
            margin: 0;
            color: #333;
          }
          .card p {
            font-size: 1rem;
            line-height: 1.6;
            color: #555;
            margin: 10px 0;
          }
          .card-footer {
            margin-top: 20px;
            text-align: right;
          }
          .card-footer span {
            font-size: 0.9rem;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Withdrawal Request Successful</h2>
          <p>
            Dear <strong>${seller.name}</strong>,<br><br>
            Your withdrawal request of <strong>KES.${amount}</strong> has been received successfully. It is currently under review and will be processed within 24hrs.<br><br>
            Thank you,<br>
            Wayne Marwa
          </p>
          <div class="card-footer">
            <span>Powered by Duka Mall</span>
          </div>
        </div>
      </body>
      </html>
    `;

      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: '"Duka Mall" waynegiyabe6@gmail.com',
        to: seller.email,
        subject: "Withdrawal Request Confirmation",
        html: wmailHTML,
      };

      await transporter.sendMail(mailOptions);

      responseReturn(res, 200, {
        withdrawal,
        message: 'Withdrawal request submitted successfully'
      });

    } catch (error) {
      console.error('Error in withdrawal request:', error.message);
      responseReturn(res, 500, { message: 'Internal server error' });
    }
  };

  get_payment_request = async (req, res) => {
    try {
      const pendingWithdrawalRequests = await withdrawalRequest.find({ status: 'pending' });

      responseReturn(res, 200, { pendingWithdrawalRequests });
    } catch (error) {
      console.error('Error fetching pending withdrawal requests:', error.message);
      responseReturn(res, 500, { message: 'Internal server error' });
    }
  };

  // payment_request_confirm = async (req, res) => {
  //   const { paymentId } = req.body;

  //   try {
  //     const payment = await withdrawalRequest.findById(paymentId);
  //     if (!payment) {
  //       return responseReturn(res, 404, { message: 'Payment request not found' })
  //     }

  //     let sellerAccount = await paystackModel.findOne({ sellerId: payment.sellerId })
  //     if (!sellerAccount) {
  //       return responseReturn(res, 404, { message: 'Seller account not found' })
  //     }

  //     const seller = await sellerModel.findById(payment.sellerId)
  //     if (!seller) {
  //       return responseReturn(res, 404, { message: 'Seller not found' })
  //     }
  //     const bankCode = seller.paymentInfo.settlement_bank

  //     // Create recipient if not exists
  //     if (!sellerAccount.paystackRecipientCode) {
  //       const recipientResponse = await axios.post(
  //         'https://api.paystack.co/transferrecipient',
  //         {
  //           type: 'nuban',
  //           name: sellerAccount.businessName,
  //           account_number: sellerAccount.accountNumber,
  //           bank_code: bankCode,
  //           currency: 'KES'
  //         },
  //         {
  //           headers: {
  //             Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  //             'Content-Type': 'application/json'
  //           }
  //         }
  //       );

  //       // console.log('Recipient response:', recipientResponse.data);

  //       const recipientCode = recipientResponse.data.data.recipient_code;

  //       // console.log(recipientCode)

  //       // Update seller account
  //       sellerAccount = await paystackModel.findOneAndUpdate(
  //         { sellerId: payment.sellerId },
  //         { $set: { paystackRecipientCode: recipientCode } },
  //         { new: true }
  //       );
  //     }

  //     // Initiate transfer
  //     const transfer = await axios.post(
  //       'https://api.paystack.co/transfer',
  //       {
  //         source: 'balance',
  //         reason: `Payment for ${paymentId}`,
  //         amount: payment.amount * 100,
  //         recipient: sellerAccount.paystackRecipientCode
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  //           'Content-Type': 'application/json'
  //         }
  //       }
  //     );

  //     await withdrawalRequest.findByIdAndUpdate(paymentId, { status: 'success' });

  //     responseReturn(res, 200, {
  //       payment,
  //       transfer: transfer.data.data,
  //       message: 'Payment request confirmed successfully'
  //     });
  //   } catch (error) {
  //     console.error('Error confirming payment request:', error.response ? error.response.data : error.message);
  //     responseReturn(res, 500, { message: 'Internal server error' });
  //   }
  // };

    payment_request_confirm = async (req, res) => {
      const { paymentId } = req.body;

      try {
        const payment = await withdrawalRequest.findById(paymentId);
        if (!payment) {
          return responseReturn(res, 404, { message: 'Payment request not found' });
        }

        if (payment.status !== 'pending') {
          return responseReturn(res, 400, { message: 'Payment request is already completed' });
        }

        let sellerDetails = {};
        if (payment.sellerId) {
          const seller = await sellerModel.findById(payment.sellerId);
          if (seller) {
            sellerDetails = {
              name: seller.name || 'N/A',
              email: seller.email || 'N/A',
              phone: seller.shopInfo.phoneNumber || 'N/A',
            };
            payment.sellerEmail = seller.email;
          }
        }

        payment.status = 'success';
        await payment.save();

        const receipt = {
          receiptId: payment._id,
          sellerDetails: {
            name: sellerDetails.name,
            email: sellerDetails.email,
            phone: sellerDetails.phone,
          },
          paymentDetails: {
            amount: `KES ${payment.amount.toFixed(2)}`,
            status: payment.status,
            date: new Date(payment.updatedAt).toLocaleString(),
          },
          message: 'Thank you for using our platform!',
        };

        const receiptHTML = `
    <div style="max-width:700px; margin:50px auto; background-color:#fff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); padding:40px; border:1px solid #e5e7eb; font-family:'Arial', sans-serif; color:#4a4a4a;">
      <div style="text-align:center; margin-bottom:30px;">
        <div style="width:70px; height:70px; background-color:#4caf50; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; box-shadow:0 4px 8px rgba(0,0,0,0.2);">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width:40px; height:40px;">
            <path fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h1 style="font-size:2.5rem; color:#4caf50; margin:0;">Payment Successful</h1>
        <p style="color:#6b7280; font-size:1.1rem; margin-top:5px;">Thank you for Choosing <span style="font-weight:bold;">DukaMall</span>!</p>
      </div>

      <div>
        <div style="border-bottom:1px solid #e5e7eb; padding:20px 0;">
          <h2 style="font-size:1.2rem; color:#374151;">Receipt ID</h2>
          <p>${receipt.receiptId}</p>
        </div>
        <div style="border-bottom:1px solid #e5e7eb; padding:20px 0;">
          <h2 style="font-size:1.2rem; color:#374151;">Seller Details</h2>
          <p><strong>Name:</strong> ${sellerDetails.name}</p>
          <p><strong>Email:</strong> ${sellerDetails.email}</p>
          <p><strong>Phone:</strong> ${sellerDetails.phone}</p>
        </div>
        <div style="border-bottom:1px solid #e5e7eb; padding:20px 0;">
          <h2 style="font-size:1.2rem; color:#374151;">Payment Details</h2>
          <p><strong>Amount:</strong> ${receipt.paymentDetails.amount}</p>
          <p><strong>Status:</strong> <span style="color:#4caf50; font-weight:bold;">${receipt.paymentDetails.status}</span></p>
          <p><strong>Date:</strong> ${receipt.paymentDetails.date}</p>
        </div>
      </div>

      <div style="text-align:center; color:#6b7280; font-size:0.95rem; margin-top:30px;">
        <p>${receipt.message}</p>
      </div>

      <div style="height:4px; background-color:#4caf50; border-radius:12px; margin:40px auto 0; width:50%;"></div>
    </div>
  `;

        // console.log('Payment Receipt:', receipt);

        const sendEmailNotification = async () => {
          const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          const mailOptions = {
            from: `"Duka Mall" ${process.env.EMAIL_USER}`,
            to: `${payment.sellerEmail}, ${process.env.SHOP_EMAIL}`,
            subject: 'Payment Request Completed',
            html: receiptHTML,
          };

          try {
            await transporter.sendMail(mailOptions);
            // console.log('Email notifications sent successfully.');
          } catch (error) {
            console.error('Failed to send email notification:', error.message);
          }
        };

        await sendEmailNotification(payment);

        // Respond with receipt
        responseReturn(res, 200, {
          payment,
          message: 'Payment request initiated successfully!',
        });
      } catch (error) {
        console.error('Error confirming payment request:', error.message);
        responseReturn(res, 500, { message: 'Internal server error' });
      }
    };

  get_seller_bank_account_details = async (req, res) => {
    try {
      const { sellerId } = req.params;

      if (!sellerId) {
        return res.status(400).json({ message: "Seller ID is required" });
      }

      const seller = await sellerModel.findById(sellerId);

      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }

      const paymentDetails = {
        name: seller.name,
        email: seller.email,
        phone: seller.shopInfo?.phoneNumber || "N/A",
        shopInfo: seller.shopInfo,
        paymentInfo: seller.paymentInfo,
      };

      return res.status(200).json({ success: true, seller: paymentDetails });
    } catch (error) {
      console.error("Error fetching seller payment details:", error);
      return res.status(500).json({ message: "Server error" });
    }
  };

}

module.exports = new paymentController();
