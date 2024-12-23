const User = require('../models/user');
const Wallet = require('../models/wallet');
const Voucher = require('../models/voucher');
const Reservation = require('../models/reservation');
const Purchase = require('../models/purchase');
const Cart = require('../models/cart');
const Room = require('../models/room');
const Hotel = require('../models/hotel');
const Message = require('../models/message');
const Golf = require('../models/golf');
const { PaymentMethod, BankTransfer, CreditCard, Crypto } = require('../models/paymentMethod');
const axios = require('axios');
const crypto = require('crypto');
const Package = require('../models/package');
const stripe = require('stripe')('pk_test_51PuT0tA6p5oChLYbdz5BDBRgVNM9IdVFVm08jtUZ1HbgCjVi8YK8cAPbNp69lV5brOBy9a1ejLlKyqX6Ydhc7fh3004YSIaJpr');

exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const wallet = await Wallet.findOne({ user: req.user.id });
    const vouchers = await Voucher.find({ userId: req.user.email });
    const reservations = await Reservation.find({ user: req.user.id }).populate('hotel');
    const purchases = await Purchase.find({ user: req.user.id }).populate('voucher');
    const unreadMessagesCount = await Message.countDocuments({ recipient: req.user.id, isRead: false });
    const messages = await Message.find({ recipient: req.user.email }).sort({ createdAt: -1 }).limit(10);
    
    let cart = await Cart.findOne({ user: req.user.id, status: 'active' })
      .populate('items.room')
      .populate('items.hotel')


    let cartData = {
      items: [],
      subtotal: 0,
      taxesAndFees: 0,
      total: 0
    };

    if (cart) {
      cart = cart.toObject();
      let subtotal = 0;

      cartData.items = await Promise.all(cart.items.map(async (item) => {
        if (item.room) { // Handle hotel room items

            const checkIn = new Date(item.check_in);
            const checkOut = new Date(item.check_out);
            const nights = item.quantity;

            const itemTotal = item.price * nights;
            subtotal += Number(itemTotal);

            let room, hotel, roomImage;

            if (item.room && item.room._id) {
              room = await Room.findById(item.room._id);
              roomImage = room && room.images && room.images.length > 0 ? "/uploads/" + room.images[0] : "";
            }

            if (item.hotel && item.hotel._id) {
              hotel = await Hotel.findById(item.hotel._id);
            }


            return {
              _id: item._id,
              roomImage: roomImage,
              hotelName: hotel ? hotel.title : 'N/A',
              roomType: room ? room.title : 'N/A',
              price: item.price,
              checkInDate: item.check_in,
              checkOutDate: item.check_out,
              nights: nights,
              total: itemTotal,
              isSelected: item.isSelected,
              ProductType: "Hotel"
            };
        }
        else if (item.golf) { // Handle golf items
     
          const nights = item.quantity;
          const itemTotal =item.price * nights; // Use sale price if available
          subtotal += itemTotal;

          const golf = await Golf.findById(item.golf); // Fetch the golf object by ID

          const golfImage = "/uploads/" +golf.image_id; // Assuming golf.images is an array of image URLs

          return {
            _id: item._id,
            hotelName: golf.title,
            roomImage: golfImage, // Include the golf image URL
            nights: nights,
            price: item.price,
            checkInDate: item.check_in,
            checkOutDate: item.check_out,
            isSelected: true,
            total: itemTotal,
            isSelected: item.isSelected,
            ProductType: "Golf"
          };
        }
        else{
          const nights = item.quantity;
          const itemTotal =item.price * nights; // Use sale price if available
          subtotal += itemTotal;
          console.log(item._id)
          const package = await Package.findById(item.package); // Fetch the golf object by ID

          console.log("PACKAGE INFO: ",package)
          let imageID = package.image_id || "default.jpg";
          const packageImage = "/uploads/" +imageID; // Assuming golf.images is an array of image URLs

          return {
            _id: item._id,
            hotelName: package.title,
            roomImage: packageImage, // Include the golf image URL
            nights: nights,
            price: item.price,
            isSelected: true,
            total: itemTotal,
            ProductType: "Package"
          };
        }
      }));

      cartData.subtotal = subtotal;
      cartData.total = subtotal;
    }


    res.render('dashboard', {
      user,
      wallet,
      vouchers,
      reservations,
      purchases,
      cart: cartData,
      unreadMessagesCount,
      messages,
      
      title: 'Dashboard',
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY // 추가된 부분
    });
  } catch (error) {
    console.error('Error in getDashboard:', error);
    res.status(500).send('An error occurred while loading the dashboard');
  }
};

exports.postCheckout = async (req, res) => {
  try {
    const { items } = req.body;
    const cart = await Cart.findOne({ user: req.user.id, status: 'active' })
      .populate('items.room')
      .populate('items.hotel');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const selectedItems = cart.items.filter(item => items.includes(item._id.toString()));

    const checkoutData = {
      items: selectedItems.map(item => {
        const nights = Math.ceil((new Date(item.check_out) - new Date(item.check_in)) / (1000 * 60 * 60 * 24));
        return {
          _id: item._id,
          key: process.env.STRIPE_PUBLISHABLE_KEY,
          hotelName: item.hotel ? item.hotel.title : 'N/A',
          roomType: item.room ? item.room.title : 'N/A',
          price: item.price,
          checkIn: item.check_in,
          checkOut: item.check_out,
          nights: nights,
          total: item.price * nights
        };
      }),
      subtotal: selectedItems.reduce((sum, item) => {
        const nights = Math.ceil((new Date(item.check_out) - new Date(item.check_in)) / (1000 * 60 * 60 * 24));
        return sum + (item.price * nights);
      }, 0)
    };

    checkoutData.total = checkoutData.subtotal;

    res.json({ success: true, checkout: checkoutData });
  } catch (error) {
    console.error('Error in postCheckout:', error);
    res.status(500).json({ success: false, message: 'An error occurred while loading the checkout data' });
  }
};

exports.renderPaymentPage = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id, status: 'active' })
      .populate({
        path: 'items.room',
        select: 'title price'
      })
      .populate('items.hotel', 'title');

    if (!cart || cart.items.length === 0) {
      return res.redirect('/dashboard');
    }

    const cartData = {
      items: cart.items.filter(item => item.isSelected).map(item => {
        const checkIn = new Date(item.check_in);
        const checkOut = new Date(item.check_out);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const totalPrice = item.price * nights;

        return {
          hotelName: item.hotel ? item.hotel.title : 'N/A',
          roomType: item.room ? item.room.title : 'N/A',
          price: item.price,
          nights: nights,
          checkIn: item.check_in,
          checkOut: item.check_out,
          quantity: item.quantity,
          total: totalPrice
        };
      }),
      total: cart.items.filter(item => item.isSelected).reduce((sum, item) => {
        const nights = Math.ceil((new Date(item.check_out) - new Date(item.check_in)) / (1000 * 60 * 60 * 24));
        return sum + (item.price * nights * item.quantity);
      }, 0)
    };

    const bankTransfer = await BankTransfer.findOne({ isActive: true });
    const creditCard = await CreditCard.findOne({ isActive: true });
    const crypto = await Crypto.findOne({ isActive: true });

    res.render('payment', {
      cart: cartData,
      total: cartData.total,
      bankTransfer,
      creditCard,
      crypto
    });
  } catch (error) {
    console.error('Error rendering payment page:', error);
    res.status(500).json({ success: false, message: 'Error rendering payment page' });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const cart = await Cart.findOne({ user: req.user.id, status: 'active' });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const total = cart.items.filter(item => item.isSelected).reduce((sum, item) => {
      const nights = Math.ceil((new Date(item.check_out) - new Date(item.check_in)) / (1000 * 60 * 60 * 24));
      return sum + (item.price * nights * item.quantity);
    }, 0);

    let paymentDetails;

    switch (paymentMethod) {
      case 'bank_transfer':
        const bankTransfer = await BankTransfer.findOne({ isActive: true });
        paymentDetails = {
          type: 'Bank Transfer',
          accountNumber: bankTransfer.accountNumber,
          total: total
        };
        break;
      case 'credit_card':
        paymentDetails = {
          type: 'Credit Card',
          redirectUrl: '/credit-card-payment' // You would implement this page separately
        };
        break;
      case 'crypto':
        const crypto = await Crypto.findOne({ isActive: true });
        const usdtRate = await getUSDTRate();
        const usdtAmount = (total / usdtRate).toFixed(2);
        paymentDetails = {
          type: 'Cryptocurrency',
          walletAddress: crypto.walletAddress,
          usdtRate: usdtRate,
          usdtAmount: usdtAmount,
          total: total
        };
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    res.json({ success: true, paymentDetails });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, message: 'Error processing payment' });
  }
};

exports.acceptPayment = async (req, res) => {
  console.log("Entering Accept Payment");
  try {
    const cart = await Cart.findOne({ user: req.user.id, status: 'active' })
      .populate('items.room')
      .populate('items.hotel');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const purchaseId = generatePurchaseId();
    const total = cart.items.filter(item => item.isSelected).reduce((sum, item) => {
      const nights = Math.ceil((new Date(item.check_out) - new Date(item.check_in)) / (1000 * 60 * 60 * 24));
      return sum + (item.price * nights * item.quantity);
    }, 0);

    const purchase = new Purchase({
      user: req.user.id,
      purchaseId: purchaseId,
      items: cart.items.filter(item => item.isSelected).map(item => {
        const nights = Math.ceil((new Date(item.check_out) - new Date(item.check_in)) / (1000 * 60 * 60 * 24));
        return {
          hotel: item.hotel ? item.hotel._id : null,
          room: item.room ? item.room._id : null,
          price: item.price,
          quantity: item.quantity,
          checkIn: item.check_in,
          checkOut: item.check_out,
          nights: nights,
          total: item.price * nights * item.quantity
        };
      }),
      total: total,
      status: 'completed'
    });

    await purchase.save();

    // Remove selected items from the cart
    cart.items = cart.items.filter(item => !item.isSelected);
    if (cart.items.length === 0) {
      cart.status = 'completed';
    }
    await cart.save();

    res.json({ success: true, purchaseId: purchaseId });
  } catch (error) {
    console.error('Error accepting payment:', error);
    res.status(500).json({ success: false, message: 'Error accepting payment' });
  }
};

exports.updateSelectedItems = async (req, res) => {
  try {
    const { selectedItems } = req.body;
    const cart = await Cart.findOne({ user: req.user.id, status: 'active' });

    if (!cart) {
      return res.status(400).json({ success: false, message: 'Cart not found' });
    }

    cart.items.forEach(item => {
      item.isSelected = selectedItems.some(selectedItem => selectedItem.id === item._id.toString());
    });

    await cart.save();

    res.json({ success: true, message: 'Selected items updated successfully' });
  } catch (error) {
    console.error('Error updating selected items:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating selected items' });
  }
};

exports.getSelectedItems = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id, status: 'active' })
      .populate('items.room')
      .populate('items.hotel');

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const selectedItems = cart.items
      .filter(item => item.isSelected)
      .map(item => {
        const checkIn = new Date(item.check_in);
        const checkOut = new Date(item.check_out);
        const nights = item.nights;
        return {
          id: item._id,
          hotelName: item.hotel ? item.hotel.title : 'N/A',
          roomType: item.room ? item.room.title : 'N/A',
          checkIn: item.check_in,
          checkOut: item.check_out,
          nights: nights,
          price: item.price,
          total: item.price * nights
        };
      });
      console.log(selectedItems)

    res.json({ success: true, selectedItems });
  } catch (error) {
    console.error('Error fetching selected items:', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching selected items' });
  }
};

exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user.id })
      .populate('hotel')
      .populate('room')
      .sort({ createdAt: -1 });

    const formattedPurchases = purchases.map(purchase => ({
      _id: purchase._id,
      hotelName: purchase.hotel ? purchase.hotel.title : 'N/A',
      roomName: purchase.room ? purchase.room.title : 'N/A',
      checkIn: purchase.checkIn,
      checkOut: purchase.checkOut,
      nights: purchase.nights,
      amount: purchase.amount,
      paymentMethod: purchase.paymentMethod,
      status: purchase.status,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
      processDescription: purchase.processDescription,
      purchaseLog: purchase.purchaseLog
    }));

    res.render('purchases', { purchases: formattedPurchases, title: 'Purchases' });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).send('An error occurred while fetching purchases');
  }
};

function generatePurchaseId() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

async function getUSDTRate() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd');
    return response.data.tether.usd;
  } catch (error) {
    console.error('Error fetching USDT rate:', error);
    return 1; // Default to 1:1 if unable to fetch
  }
}