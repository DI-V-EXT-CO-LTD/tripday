const Message = require('../models/message');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELGRAM_BOT_TOKEN, {polling: false});


exports.getCustomerServicePage = (req, res) => {
    res.render('customerService', { title: 'Customer Service', user: req.user });
};

exports.sendMessage = async (req, res) => {
    console.log(req.body)
    try {
        const { content, email } = req.body;
        console.log("Received Message: ", content, email)
        const newMessage = new Message({
            content,
            email: req.user.email,
            recipient: 'customer_service',
            isCustomerServiceMessage: true,
            sender: req.user.email,
            isIndividualMesssage: false
        });
        await newMessage.save();
        bot.sendMessage(process.env.TELGRAM_CHAT_ID, `${email} 고객으로부터 고객센터 메시지가 도착했습니다. \n=================================\n\n내용: ${content}\n\n=================================`);
        res.status(200).json({ message: 'Message is sent to customer service. We will respond you soon' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending message to customer service. Check your network.' });
    }
};