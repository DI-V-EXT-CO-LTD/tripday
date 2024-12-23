const mongoose = require('mongoose');

const consolidatedInvoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true,
        unique: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Cancelled'],
        default: 'Pending'
    },
    purchases: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Purchase'
    }],
    splitInvoices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ConsolidatedInvoice', consolidatedInvoiceSchema);