
const Comment = require('../models/commentModels');

// Post a comment
exports.postComment = async (req, res) => {
  try {
    const { name, email, content } = req.body;

    // Validate required fields
    if (!name || !email || !content) {
      return res.status(400).json({ success: false, message: 'Name, email, and content are required.' });
    }

    // Create a new comment
    const comment = new Comment({
      name,
      email,
      content,
    });

    // Save the comment to the database
    await comment.save();

    res.status(201).json({ success: true, message: 'Comment posted successfully.', comment });
  } catch (error) {
    console.error('Error posting comment:', error.message);
    res.status(500).json({ success: false, message: 'Failed to post comment.', error: error.message });
  }
};

// Reply to a comment
exports.replyToComment = async (req, res) => {
    try {
      const { commentId, reply } = req.body;
  
      if (!reply || !reply.name || !reply.email || !reply.content) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
      }
  
      // Find the parent comment
      const parentComment = await Comment.findById(commentId);
  
      if (!parentComment) {
        return res.status(404).json({ success: false, message: "Comment not found." });
      }
  
      // Create the reply object
      const newReply = {
        name: reply.name,
        email: reply.email,
        content: reply.content,
        createdAt: new Date(),
      };
  
      // Push the reply to the replies array
      parentComment.replies.push(newReply);
  
      // Save the updated comment
      await parentComment.save();
  
      res.status(201).json({ success: true, message: "Reply posted successfully.", reply: newReply });
    } catch (error) {
      console.error("Error replying to comment:", error.message);
      res.status(500).json({ success: false, message: "Failed to reply to comment.", error: error.message });
    }
  };  

exports.getComments = async (req, res) => {
    try {
      // Fetch all comments with their replies
      const comments = await Comment.find().sort({ createdAt: -1 });
  
      res.status(200).json({ success: true, comments });
    } catch (error) {
      console.error('Error fetching comments:', error.message);
      res.status(500).json({ success: false, message: 'Failed to fetch comments.', error: error.message });
    }
  };
  
  // Fetch a single comment by ID
  exports.getCommentById = async (req, res) => {
    try {
      const { commentId } = req.params;
  
      const comment = await Comment.findById(commentId);
  
      if (!comment) {
        return res.status(404).json({ success: false, message: 'Comment not found.' });
      }
  
      res.status(200).json({ success: true, comment });
    } catch (error) {
      console.error('Error fetching comment:', error.message);
      res.status(500).json({ success: false, message: 'Failed to fetch comment.', error: error.message });
    }
  };