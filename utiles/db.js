const mongoose = require('mongoose');

module.exports.dbConnect = async () => {
    try {
        await mongoose.connect(`mongodb+srv://waynegiyabe6:BF0f9otBzyZRip4Y@mern.u7k9o.mongodb.net/multivendor`)
        console.log("database connect....")
    } catch (error) {
        console.log(error.message)
    }
}