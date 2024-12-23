const Invoice = require('../models/inv');

const version = '1.0.0';
const exchangeRates = {
  thbToKrw: '38.5',
  thbToUsd: '0.030'
};

exports.getInvoices = async (req, res) => {
  try {
    // Check if user is logged in and is an admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const invoices = await Invoice.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalInvoices = await Invoice.countDocuments();
    const totalPages = Math.ceil(totalInvoices / limit);

    res.render('admin/invoices', {
      user: req.user,
      invoices,
      currentPage: page,
      totalPages,
      totalInvoices,
      exchangeRates,
      version
    });
  } catch (error) {
    console.error('Error in getInvoices:', error);
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
};

module.exports = exports;