const Invoice = require('../models/inv');
const userModel = require('../models/user');

const getInvoice = async (req, res) => {
    try {
        console.log('인보이스 ID:', req.params.id);
        const invoice = await Invoice.findById(req.params.id);
        console.log('찾은 인보이스:', invoice);
        const user = await userModel.findOne({ email: invoice.userId });

        if (!invoice) {
            console.log('인보이스를 찾을 수 없음');
            req.flash('error', '인보이스를 찾을 수 없습니다');
            return res.redirect('/admin/invoices');
        }

        const booking = {
            code: invoice.bookingCode,
            Hotel_Info: {
                hotelName: invoice.hotelName,
                RoomName: invoice.roomNames
            },
            total: invoice.total,
            userId: invoice.userId,
            userAddress: user.companyAddress,
            userBusinessNumber: user.businessNumber,
            userCompanyName: user.companyName,
            createAt: invoice.createAt
        };

        const extraPrices = []; // Invoice 모델에 extraPrices 필드가 없으므로 빈 배열로 설정
        const extraPricesTotal = 0; // extraPrices가 없으므로 0으로 설정
        res.render('invoice', { 
            bookings: [booking], // 단일 booking을 배열로 감싸서 전달
            extraPrices: extraPrices,
            extraPricesTotal: extraPricesTotal
        });
    } catch (error) {
        console.error('인보이스 불러오기 오류:', error);
        req.flash('error', 'Error loading invoice');
        res.redirect('/admin/dashboard');
    }
};

module.exports = {
    getInvoice
};