const ConsolidatedInvoice = require('../models/consolidatedInvoice');
const Purchase = require('../models/purchase');
const Invoice = require('../models/inv');

exports.showSplitInvoice = async (req, res) => {
    try {
        const invoiceId = req.params.invoiceId;
        const consolidatedInvoice = await ConsolidatedInvoice.findById(invoiceId).populate('purchases').populate('splitInvoices');

        if (!consolidatedInvoice) {
            return res.status(404).send('Invoice not found');
        }

        let splitInvoices = consolidatedInvoice.splitInvoices;

        if (splitInvoices.length === 0) {
            // If split invoices don't exist, create and save them
            const totalAmount = consolidatedInvoice.totalAmount;
            const minAmount = 1000000; // 분할 최소 금액
            const maxAmount = 1450000; // 분할 최대 금액

            // Calculate the total number of split invoices
            const totalTransactions = Math.ceil(totalAmount / maxAmount);

            let remainingAmount = totalAmount;
            let splitNumber = 1;

            while (splitNumber <= totalTransactions) {
                let currentAmount;

                if (splitNumber === totalTransactions) {
                    // Last invoice gets the remaining amount
                    currentAmount = remainingAmount;
                } else if (remainingAmount > maxAmount) {
                    currentAmount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
                } else {
                    currentAmount = remainingAmount;
                }

                const newInvoice = new Invoice({
                    bookingCode: consolidatedInvoice.purchases[0].purchaseId, // Assuming first purchase for booking code
                    invoiceId: `${consolidatedInvoice.invoiceNumber}-${splitNumber}`,
                    total: currentAmount,
                    hotelName: consolidatedInvoice.purchases[0].hotelName, // Assuming first purchase for hotel name
                    roomNames: consolidatedInvoice.purchases.map(p => p.roomName),
                    transactionNo: splitNumber,
                    totalTransactions: totalTransactions,
                    invoiceNumber: `${consolidatedInvoice.invoiceNumber}-${splitNumber}`,
                    status: 'Pending',
                    remittanceNumber: "", // 추가된 필드
                    ImageUrl: "" // 추가된 필드
                });

                await newInvoice.save();
                splitInvoices.push(newInvoice);

                remainingAmount -= currentAmount;
                splitNumber++;
            }

            // Update the consolidated invoice with the new split invoices
            consolidatedInvoice.splitInvoices = splitInvoices.map(invoice => invoice._id);
            await consolidatedInvoice.save();
        }

        // Render the view with split invoices
        res.render('splitInvoice', {
            consolidatedInvoice: {
                invoiceNumber: consolidatedInvoice.invoiceNumber,
                totalAmount: consolidatedInvoice.totalAmount,
                status: consolidatedInvoice.status
            },
            splitInvoices: splitInvoices,
            bookings: consolidatedInvoice.purchases
        });
    } catch (error) {
        console.error('Error in showSplitInvoice:', error);
        res.status(500).send('An error occurred while processing the split invoice');
    }
};

// Add any other necessary functions for split invoice handling