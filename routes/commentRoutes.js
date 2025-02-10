
const express = require('express');
const { postComment, replyToComment, getComments, getCommentById } = require('../controllers/commentControllers')

const router = express.Router()

router.post('/comment/post-comment', postComment)
router.post('/comment/reply-comment', replyToComment)
router.get('/comment', getComments)
router.get('/comment/:commentId', getCommentById)

module.exports = router