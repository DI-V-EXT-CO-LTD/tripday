const Cart = require('../models/cart');
const Room = require('../models/room');
const Hotel = require('../models/hotel');
const Golf = require('../models/golf'); // Import the Golf model
const Package = require('../models/package');
const { PaymentMethod, BankTransfer, CreditCard, Crypto } = require('../models/paymentMethod');
const axios = require('axios');
const userModel = require('../models/user');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELGRAM_BOT_TOKEN, {polling: false});

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id, status: 'active' })
      .populate({
        path: 'items.room',
        select: 'type price images'
      })
      .populate('items.hotel', 'name')
      .populate('items.golf', 'title price sale_price images'); // Populate golf items and include images

    let cartData = {
      items: [],
      subtotal: 0,
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
          subtotal += itemTotal;
          console.log("SUB TOTAL:", subtotal);

          const room = await Room.findById(item.room._id);
          const roomImage = room.images[0];

          return {
            _id: item._id,
            roomImage: roomImage,
            hotelName: item.hotel.name,
            roomType: item.room.type,
            price: item.price,
            checkInDate: item.check_in,
            checkOutDate: item.check_out,
            nights: nights,
            total: itemTotal
          };
        } else if (item.golf) { // Handle golf items
          const itemTotal = item.golf.sale_price || item.golf.price; // Use sale price if available
          subtotal += itemTotal;

          const golf = await Golf.findById(item.golf); // Fetch the golf object by ID
          console.log("GOLF: ", golf);
          const golfImage = golf.images[0]; // Assuming golf.images is an array of image URLs
          console.log("GOLF CHECK IN: ",item.check_in);
          console.log("GOLF CHECK OUT: ",item.check_out);
          return {
            _id: item._id,
            golfTitle: item.golf.title,
            checkInDate: item.check_in,
            checkOutDate: item.check_out,
            golfImage: golfImage, // Include the golf image URL
            price: itemTotal,
            total: itemTotal
          };
        }
      }));

      cartData.subtotal = subtotal;
      cartData.total = subtotal;
    }

    res.render('cart', { cart: cartData });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Error fetching cart' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    console.log("ADD TO CART CALLED");
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { roomId, hotelId, checkIn, checkOut, nights } = req.body;



    const room = await Room.findById(roomId);
    const hotel = await Hotel.findById(hotelId);

    if (!room || !hotel) {
      return res.status(404).json({ success: false, message: 'Room or hotel not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id, status: 'active' });
    let user = await userModel.findById(req.user._id);
    if(!user) {
      console.log("user not found")
    }
    else{
      console.log("user found: ", user)
    }

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    } else {
      //카트안에서 똑같은 호텔&&똑같은 룸의 ID가 있을경우 추가하지 않고 return
      for (let i = 0; i < cart.items.length; i++) {
        if (cart.items[i].room.toString() === roomId && cart.items[i].hotel.toString() === hotelId) {
          return res.status(200).json({ success: true, message: 'Room already in cart' });
        }
      }
    }

    const existingItem = cart.items.find(item =>
      item.room.toString() === roomId &&
      item.hotel.toString() === hotelId &&
      item.check_in.toISOString() === new Date(checkIn).toISOString() &&
      item.check_out.toISOString() === new Date(checkOut).toISOString()
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({
        room: roomId,
        hotel: hotelId,
        quantity: nights,
        price: room.price,
        check_in: checkIn,
        check_out: checkOut,
        nights: nights,
        ProductType: "Hotel"
      });
    }

    const content = {
        room: roomId,
        hotel: hotelId,
        quantity: nights,
        price: room.price,
        check_in: checkIn,
        check_out: checkOut,
        nights: nights,
        ProductType: "Hotel"
    }
    await cart.save();

    bot.sendMessage(process.env.TELGRAM_CHAT_ID, `${user.email} 고객이 카트에 ${nights}의 호텔 상품을 담았습니다. \n=================================\n\n\n\n=================================`);
    res.status(200).json({ success: true, message: 'Room added to cart' });
  } catch (error) {
    console.error('Error adding room to cart:', error);
    res.status(500).json({ success: false, message: 'Error adding room to cart' });
  }
};

// Add golf to cart
exports.addPackageToCart = async (req, res) => {
  try {
    const packageId = req.params.packageId;
    const {packagePrice, checkIn, checkOut, nights, quantity} = req.body;
    const package = await Package.findById(packageId);
    let user = await userModel.findById(req.user._id);
    if(!user) {
      console.log("user not found")
    }
    if (!package) {
      return res.status(404).json({ error: 'package not found' });
    }

    console.log("Package ID: ", packageId);
    console.log("package QUANTITY: ", quantity);

    let cart = await Cart.findOne({ user: req.user._id, status: 'active' });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    cart.items.push({
      nights: nights, // Set a default value for nights
      quantity: quantity, // Set a default value for quantity
      check_in: checkIn,
      check_out: checkOut,
      nights: nights,
      price: package.price, // Set the price from the golf object
      hotel: null, // Set hotel to null as it's not applicable for golf
      room: null, // Set room to null as it's not applicable for golf
      ProductType: "Package",
      package: packageId
    });
    await cart.save();

    bot.sendMessage(process.env.TELGRAM_CHAT_ID, `${user.email} 고객이 카트에 ${nights}의 패키지 상품을 담았습니다. \n=================================\n\n\n\n=================================`);

    res.status(200).json({ message: 'Package added to cart successfully!' });
  } catch (error) {
    console.error('Error adding Package to cart:', error);
    res.status(500).json({ error: 'Failed to add Package to cart.' });
  }
};

// Add golf to cart
exports.addGolfToCart = async (req, res) => {
  try {
    const golfId = req.params.golfId;
    const {quantity, validFrom, validUntil} = req.body;
    const golf = await Golf.findById(golfId);
    let user = await userModel.findById(req.user._id);
    if(!user) {
      console.log("user not found")
    }
    if (!golf) {
      return res.status(404).json({ error: 'Golf course not found' });
    }

    console.log("GOLF QUANTITY: ", quantity);

    let cart = await Cart.findOne({ user: req.user._id, status: 'active' });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    cart.items.push({
      golf: golfId,
      nights: quantity, // Set a default value for nights
      quantity: quantity, // Set a default value for quantity
      check_out: validUntil, // Set a default value for check_out
      check_in: validFrom, // Set a default value for check_in
      price: golf.price, // Set the price from the golf object
      hotel: null, // Set hotel to null as it's not applicable for golf
      room: null, // Set room to null as it's not applicable for golf
      ProductType: "Golf"
    });
    await cart.save();

    bot.sendMessage(process.env.TELGRAM_CHAT_ID, `${user.email} 고객이 카트에 ${quantity}의 골프 상품을 담았습니다. \n=================================\n\n\n\n=================================`);
    res.status(200).json({ message: 'Golf added to cart successfully!' });
  } catch (error) {
    console.error('Error adding golf to cart:', error);
    res.status(500).json({ error: 'Failed to add golf to cart.' });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id, status: 'active' });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();

    res.status(200).json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ success: false, message: 'Error removing item from cart' });
  }
};

exports.updateQuantity = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id, status: 'active' });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.find(item => item._id.toString() === itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({ success: true, message: 'Item quantity updated' });
  } catch (error) {
    console.error('Error updating item quantity:', error);
    res.status(500).json({ success: false, message: 'Error updating item quantity' });
  }
};

exports.renderPaymentPage = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id, status: 'active' })
      .populate({
        path: 'items.room',
        select: 'type price'
      })
      .populate('items.hotel', 'name');

    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const bankTransfer = await BankTransfer.findOne({ isActive: true });
    const creditCard = await CreditCard.findOne({ isActive: true });
    const crypto = await Crypto.findOne({ isActive: true });

    res.render('payment', {
      cart,
      total,
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
    const cart = await Cart.findOne({ user: req.user._id, status: 'active' });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

exports.getCartCount = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id, status: 'active' });
    const itemCount = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
    res.status(200).json({ success: true, itemCount });
  } catch (error) {
    console.error('Error fetching cart count:', error);
    res.status(500).json({ success: false, message: 'Error fetching cart count' });
  }
};

async function getUSDTRate() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd');
    return response.data.tether.usd;
  } catch (error) {
    console.error('Error fetching USDT rate:', error);
    return 1; // Default to 1:1 if unable to fetch
  }
}