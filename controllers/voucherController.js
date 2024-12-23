const Voucher = require('../models/voucher');
const APIS = require('../models/APIS');
const Booking = require('../models/Booking');

exports.getVouchers = async (req, res) => {
  console.log("getVouchers function called");
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 20;
    const skip = (page - 1) * perPage;
    const vouchers = await Voucher.find({ userId: req.user.email }).skip(skip).limit(perPage);
    const totalVouchers = await Voucher.countDocuments({ userId: req.user.email });
    const totalPages = Math.ceil(totalVouchers / perPage);

    if (req.xhr) {
      // AJAX 요청인 경우 부분적인 HTML을 반환
      res.render('partials/voucherList', {
        vouchers,
        currentPage: page,
        totalPages,
        layout: false
      });
    } else {
      // 일반 요청인 경우 전체 페이지를 렌더링
      res.render('vouchers', {
        vouchers,
        user: { email: req.user.email },
        currentPage: page,
        totalPages
      });
    }
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ success: false, message: 'Error fetching vouchers' });
  }
};

exports.submitVoucher = async (req, res) => {
    console.log('submit Voucher function called');

    try {
        const {
            userId,
            hotelName,
            voucherCode,
            remainingQuantity,
            roomCount,
            startDate,
            endDate,
            totalUsage,
            guestInfo
        } = req.body;

        console.log("userId: ",userId); 
        console.log("hotelName: ",hotelName);
        console.log("voucherCode: ",voucherCode);
        console.log("remainingQuantity: ",remainingQuantity);
        console.log("roomCount: ",roomCount);
        console.log("startDate: ",startDate);
        console.log("endDate: ",endDate);
        console.log("totalUsage: ",totalUsage);
        console.log("guestInfo: ",guestInfo);

        // 여기에서 바우처 사용 로직을 구현합니다.
        // 예: 바우처 수량 업데이트, 사용 내역 저장 등
        // 임시 로직: 바우처 수량 감소
        let FindVoucher = await Voucher.findOne({ voucherCode: voucherCode });
        if(FindVoucher){
            
            if(FindVoucher.quantity >= totalUsage){
                FindVoucher.quantity -= totalUsage;
                await FindVoucher.save();

                let newAPIS = new APIS({
                    userId: userId,
                    Hotel: hotelName,
                    Amount: totalUsage,
                    useDate_Start: new Date(startDate),
                    useDate_End: new Date(endDate),
                    createAt: new Date(),
                    CustomerInfo: guestInfo
                });
                await newAPIS.save();

                let newBooking = new Booking({
                    userId: userId,
                    Hotel: hotelName,
                    Amount: totalUsage,
                    useDate: new Date(startDate),
                    createAt: new Date(),
                    CustomerInfo: guestInfo
                });
                console.log("newBooking: ",newBooking);
                await newBooking.save();
            } 
          }


       
        // 실제로는 데이터베이스 업데이트 로직이 여기에 들어가야 합니다.
        // 예: await Voucher.findOneAndUpdate({ voucherCode: voucherCode }, { quantity: updatedQuantity });
        console.log("Updated At: ",new Date());

        res.status(200).json({
            success: true,
            message: "Voucher submitted successfully",
        });
    } catch (error) {
        console.error('Error in submitVoucher:', error);
        res.status(500).json({ success: false, message: "Error submitting voucher", error: error.message });
    }
};

exports.renderVouchersPage = async (req, res) => {
    try {
        console.log("renderVouchersPage function called");
        const page = parseInt(req.query.page) || 1;
        const perPage = 20;
        const skip = (page - 1) * perPage;
        
        const vouchers = await Voucher.find({ userId: req.user.email }).skip(skip).limit(perPage);
        const totalVouchers = await Voucher.countDocuments({ userId: req.user.email });
        const totalPages = Math.ceil(totalVouchers / perPage);
        
        res.render('vouchers', { 
            vouchers: vouchers,
            user: {
                email: req.user.email,
            },
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error rendering vouchers page:', error);
        res.status(500).send('Error rendering vouchers page');
    }
};