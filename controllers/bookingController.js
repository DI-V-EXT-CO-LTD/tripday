const Booking = require('../models/Booking');
const Purchase = require('../models/purchase');
const Cart = require('../models/cart');

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('hotel');
    res.render('bookings', { bookings });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
};

exports.getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('hotel');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.render('bookingDetails', { booking });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking details' });
  }
};

exports.createPurchase = async (req, res) => {
  console.log('createPurchase function called');
  console.log('Request body:', req.body);

  try {
    const { paymentMethod } = req.body;

    if (!req.user) {
      console.error('User not found in request');
      return res.json({ success: false, message: 'User not authenticated' });
    }

    // Fetch the user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.room');
    if (!cart || cart.items.length === 0) {
      console.error('Cart is empty');
      return res.json({ success: false, message: 'Cart is empty' });
    }

    // Create purchases for each item in the cart
    const purchases = [];
    for (const item of cart.items) {
      const purchase = new Purchase({
        user: req.user._id,
        hotelName: item.room.hotel.name,
        roomName: item.room.name,
        checkIn: item.checkIn,
        checkOut: item.checkOut,
        nights: Math.ceil((new Date(item.checkOut) - new Date(item.checkIn)) / (1000 * 60 * 60 * 24)),
        amount: item.price * item.quantity,
        paymentMethod: paymentMethod,
        status: 'Pending',
        purchaseLog: [{
          message: 'Purchase initiated'
        }]
      });

      console.log('Purchase object created:', purchase);

      await purchase.save();
      console.log('Purchase saved successfully');
      purchases.push(purchase);
    }

    // Clear the user's cart
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } }
    );
    console.log('Cart cleared');

    res.json({ 
      success: true, 
      message: 'Purchases created successfully', 
      purchaseIds: purchases.map(p => p._id)
    });
  } catch (error) {
    console.error('Error in createPurchase:', error);
    res.json({ 
      success: false, 
      message: 'Error creating purchases',
      error: error.message
    });
  }
};