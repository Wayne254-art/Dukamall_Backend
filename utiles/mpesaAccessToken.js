const axios = require("axios");

async function getAccessToken() {
  const consumer_key = ""; // REPLACE IT WITH YOUR CONSUMER KEY
  const consumer_secret = ""; // REPLACE IT WITH YOUR CONSUMER SECRET
  const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const auth = "Basic " + Buffer.from(consumer_key + ":" + consumer_secret).toString("base64");

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: auth,
      },
    });

    return response.data.access_token;
  } catch (error) {
    throw error;
  }
}

module.exports = { getAccessToken };
