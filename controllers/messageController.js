const Message = require('../models/message');
const User = require('../models/user');


exports.sendMessage = async (req, res) => {
  try {
    const { recipient, content } = req.body;

    // Only allow system to send messages
    if (req.user.role !== 'System') {
      return res.status(403).json({ message: 'Only system can send messages.' });
    }

    const newMessage = new Message({
      content,
      recipient
    });

    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'An error occurred while sending the message.' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    let messages;

    if (req.user.role === 'superAdmin') {
      // Fetch all messages for superAdmin users
      messages = await Message.find().sort({ createdAt: -1 });
    } else {
      // Fetch only user's messages for non-superAdmin users
      messages = await Message.find({ recipient: req.user.email }).sort({ createdAt: -1 });
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'An error occurred while fetching messages.' });
  }
};

exports.markMessageAsRead = async (req, res) => {
  try {
    const messageId = req.params.id;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (req.user.role !== 'superAdmin' && message.recipient !== req.user.email) {
      return res.status(403).json({ message: 'You do not have permission to mark this message as read.' });
    }

    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    res.status(200).json({ message: 'Message marked as read.' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'An error occurred while marking the message as read.' });
  }
};