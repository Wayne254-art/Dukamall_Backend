
const mongoose = require('mongoose')

const ReplySchema = new mongoose.Schema({
    name: { type: String, required: true},
    email: {type: String, required: true},
    content: {type: String, required: true},
    createdAt: {type: Date, default: Date.now},
})

const CommentSchema = new mongoose.Schema({
    name: { type: String, required: true},
    email: {type: String, required: true},
    content: {type: String, required: true},
    createdAt: {type: Date, default: Date.now},
    replies: [ReplySchema],
})

module.exports = mongoose.model('Comment', CommentSchema)