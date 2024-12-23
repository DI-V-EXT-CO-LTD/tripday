const User = require('../models/user');

exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render('wallet', { balance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wallet' });
  }
};

exports.deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user._id);
    user.walletBalance += parseFloat(amount);
    await user.save();
    res.status(200).json({ message: 'Deposit successful', newBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: 'Error processing deposit' });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findById(req.user._id);
    if (user.walletBalance < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }
    user.walletBalance -= parseFloat(amount);
    await user.save();
    res.status(200).json({ message: 'Withdrawal successful', newBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ message: 'Error processing withdrawal' });
  }
};