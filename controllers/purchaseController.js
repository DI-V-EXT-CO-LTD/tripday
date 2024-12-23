//purchaseController.js
const Purchase = require('../models/purchase');
const Cart = require('../models/cart');
const Hotel = require('../models/hotel');
const Message = require('../models/message');
const User = require('../models/user');
const mailgunConfig = require('../config/mailgun');
const mailgun = require('mailgun-js')(mailgunConfig);
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { client: paypalClient, paypal } = require('../config/paypal');
const omise = require('../config/omise');
const EmailLog = require('../models/emailLog');
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELGRAM_BOT_TOKEN, {polling: false});

console.log('Payment providers initialized');

exports.createPaymentIntent = async (req, res) => {
  console.log('Request received for creating PaymentIntent:', req.body); // 요청 로깅 추가
  try {
    const { paymentMethod } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);

    // 카트 정보 가져오기
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.room',
        model: 'Room'
      })
      .populate({
        path: 'items.hotel',
        model: 'Hotel'
      });

    if (!cart || cart.items.length === 0) {
      console.log('Cart is empty');
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const selectedItems = cart.items.filter(item => item.isSelected);

    if (selectedItems.length === 0) {
      console.log('No items selected for purchase');
      return res.status(400).json({ error: 'No items selected for purchase' });
    }

    // 총 금액 계산
    const amount = selectedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const currency = 'thb'; // 기본 통화를 THB로 설정

    console.log('Creating payment intent with:', { amount, currency, paymentMethod });
    bot.sendMessage(process.env.TELGRAM_CHAT_ID, `${user.email}님으로 부터 (${paymentMethod})으로 ${amount} ${currency} 결제가 진행되었습니다.`)
    switch (paymentMethod) {
      case 'stripe':
        try {
          // Stripe PaymentIntent 생성
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // 금액은 바트 단위
            currency: 'thb',
          });

          if (!paymentIntent.client_secret) {
            console.log('Client secret was not generated:', paymentIntent);
            return res.status(500).json({ error: 'Failed to generate client secret' });
          }
          
          console.log('Stripe payment intent created:', paymentIntent);
          bot.sendMessage(process.env.TELGRAM_CHAT_ID, `Stripe PaymentIntent 생성 완료: ${paymentIntent}`);
          res.status(200).json({ clientSecret: paymentIntent.client_secret });
        } catch (error) {
          console.error('Failed to create Stripe PaymentIntent:', error);
          res.status(500).json({ error: 'Failed to create PaymentIntent', details: error.message });
        }
        break;

      case 'paypal':
        // PayPal 결제 처리
        const request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: currency.toUpperCase(),
              value: (amount / 100).toFixed(2),
            }
          }]
        });
        try {
          const order = await paypalClient.execute(request);
          console.log('PayPal order created:', order);
          res.status(200).json({ orderId: order.result.id });
        } catch (error) {
          console.error('Failed to create PayPal order:', error);
          res.status(500).json({ error: 'Failed to create PayPal order', details: error.message });
        }
        break;

      case 'omise':
        try {
          const charge = await omise.charges.create({
            amount: amount,
            currency: currency,
            capture: true,
            return_uri: 'https://www.trip-day.com',
          });
          console.log('Omise charge created:', charge);
          res.status(200).json({ authorizeUri: charge.authorize_uri });
        } catch (error) {
          console.error('Failed to create Omise charge:', error);
          res.status(500).json({ error: 'Failed to create Omise charge', details: error.message });
        }
        break;

      case 'bank_transfer':
        res.status(200).json({
          type: 'Bank Transfer',
          accountNumber: '1234-5678-9012-3456',
          total: amount / 100,
        });

        try {
          await createPurchaseFromPayment({ id: 'bank_transfer_' + userId }, 'bank_transfer', 'pending', req.user);
          console.log('Cart items removed after bank transfer initiated.');
        } catch (error) {
          console.error('Error removing cart items after bank transfer:', error);
        }
        break;

      case 'crypto':
        res.status(200).json({
          type: 'Cryptocurrency',
          walletAddress: '0x1234567890123456789012345678901234567890',
          usdtRate: 35,
          usdtAmount: (amount / 100 / 35).toFixed(2),
          total: amount / 100,
        });
        try {
          await createPurchaseFromPayment({ id: 'crypto_' + userId }, 'crypto', 'pending', req.user);
          console.log('Cart items removed after cryptocurrency payment initiated.');
        } catch (error) {
          console.error('Error removing cart items after crypto payment:', error);
        }
        break;

      default:
        console.log('Invalid payment method:', paymentMethod);
        res.status(400).json({ error: 'Invalid payment method' });
    }
    
  } catch (error) {
    console.error('Detailed error creating payment intent:', error);
    res.status(500).json({ error: 'An error occurred while processing the payment.', details: error.message });
  }
};


exports.createCardPurchase = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Payment not successful' });
    }

    const purchase = await createPurchaseFromPayment(paymentIntent, 'stripe', 'completed', req.user);
    res.status(200).json({ success: true, message: 'Card purchase created successfully', purchase });
  } catch (error) {
    console.error('Error in createCardPurchase:', error);
    res.status(500).json({ success: false, message: 'Error creating card purchase', error: error.message });
  }
};

exports.createPurchase = async (req, res) => {
  try {
    const { paymentMethod, token, amount } = req.body;

    console.log('서버에서 받은 결제 금액:', amount);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    let paymentData;
    if (paymentMethod === 'omise') {
      console.log('Omise를 사용하여 결제 요청 수행');
      paymentData = await omise.charges.create({
        amount: amount * 100, 
        currency: 'thb',
        card: token,
        description: 'Trip-day.com purchase'
      });
      console.log('Omise로부터 생성된 결제:', paymentData);
    } else {
      console.log('Omise가 아닌 결제 방법을 사용하여 결제 요청 수행');
      paymentData = { id: token };
    }
    console.log("payment created from omise")

    const purchase = await createPurchaseFromPayment(paymentData, paymentMethod, 'completed', req.user);
    
    // 영수증 이메일 발송
    await sendReceiptEmail(req.user.email, purchase);

    res.status(200).json({ success: true, message: 'Purchase created successfully', purchase });
  } catch (error) {
    console.error('Error in createPurchase:', error);
    res.status(500).json({ success: false, message: 'Error creating purchase', error: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  const provider = req.params.provider;
  let event;

  try {
    switch (provider) {
      case 'stripe':
        const sig = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        break;
      case 'paypal':
        const webhookId = process.env.PAYPAL_WEBHOOK_ID;
        const requestBody = req.body;
        const transmissionId = req.headers['paypal-transmission-id'];
        const transmissionTime = req.headers['paypal-transmission-time'];
        const certUrl = req.headers['paypal-cert-url'];
        const authAlgo = req.headers['paypal-auth-algo'];
        const transmissionSig = req.headers['paypal-transmission-sig'];

        const verifyResult = await paypal.notifications.verifyWebhookSignature({
          authAlgo,
          transmissionId,
          transmissionSig,
          transmissionTime,
          certUrl,
          webhookId,
          requestBody,
        });

        if (verifyResult.verification_status !== 'SUCCESS') {
          throw new Error('PayPal webhook signature verification failed');
        }

        event = requestBody;
        break;
      case 'omise':
        const omiseSignature = req.headers['omise-signature'];
        const omiseTimestamp = req.headers['omise-timestamp'];
        const payload = omiseTimestamp + JSON.stringify(req.body);
        const expectedSignature = crypto
          .createHmac('sha256', process.env.OMISE_SECRET_KEY)
          .update(payload)
          .digest('hex');

        if (omiseSignature !== expectedSignature) {
          throw new Error('Omise webhook signature verification failed');
        }

        event = req.body;
        break;
      default:
        return res.status(400).send(`Unsupported payment provider: ${provider}`);
    }

    // Handle the event
    switch (provider) {
      case 'stripe':
        await handleStripeEvent(event);
        break;
      case 'paypal':
        await handlePayPalEvent(event);
        break;
      case 'omise':
        await handleOmiseEvent(event);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`Error processing ${provider} webhook:`, err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

async function handleStripeEvent(event) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Stripe PaymentIntent succeeded:', paymentIntent.id);
      await handleSuccessfulPayment(paymentIntent, 'stripe');
      break;
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      console.log('Stripe PaymentIntent failed:', failedPaymentIntent.id);
      await handleFailedPayment(failedPaymentIntent, 'stripe');
      break;
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }
}

async function handlePayPalEvent(event) {
  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      const payment = event.resource;
      console.log('PayPal payment completed:', payment.id);
      await handleSuccessfulPayment(payment, 'paypal');
      break;
    case 'PAYMENT.CAPTURE.DENIED':
      const failedPayment = event.resource;
      console.log('PayPal payment failed:', failedPayment.id);
      await handleFailedPayment(failedPayment, 'paypal');
      break;
    default:
      console.log(`Unhandled PayPal event type: ${event.event_type}`);
  }
}

async function handleOmiseEvent(event) {
  switch (event.key) {
    case 'charge.complete':
      const charge = event.data;
      console.log('Omise charge completed:', charge.id);
      await handleSuccessfulPayment(charge, 'omise');
      break;
    case 'charge.fail':
      const failedCharge = event.data;
      console.log('Omise charge failed:', failedCharge.id);
      await handleFailedPayment(failedCharge, 'omise');
      break;
    default:
      console.log(`Unhandled Omise event type: ${event.key}`);
  }
}

async function handleSuccessfulPayment(paymentData, provider) {
  try {
    const purchase = await createPurchaseFromPayment(paymentData, provider, 'completed');
    console.log(`Purchase created successfully for ${provider} payment`);
    return purchase;
  } catch (error) {
    console.error(`Error creating purchase for ${provider} payment:`, error);
  }
}

async function handleFailedPayment(paymentData, provider) {
  try {
    const purchase = await createPurchaseFromPayment(paymentData, provider, 'failed');
    console.log(`Failed purchase recorded for ${provider} payment`);
    return purchase;
  } catch (error) {
    console.error(`Error recording failed purchase for ${provider} payment:`, error);
  }
}

async function createPurchaseFromPayment(paymentData, provider, status, user) {
  try {
    
    const userId = user._id;
    console.log('Creating purchase from payment:', { paymentData, provider, status, userId });
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.room',
        model: 'Room'
      })
      .populate({
        path: 'items.hotel',
        model: 'Hotel'
      });

    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    const selectedItems = cart.items.filter(item => item.isSelected);

    if (selectedItems.length === 0) {
      throw new Error('No items selected for purchase');
    }

    const purchases = [];

    for (const item of selectedItems) {
      const hotelName = item.hotel && item.hotel.title ? item.hotel.title : 'Unknown Hotel';

      if (!item.room || !item.room.title || !item.check_in || !item.check_out || !item.price) {
        console.error('Missing required fields for item:', item);
        continue;
      }

      const checkInDate = new Date(item.check_in);
      const checkOutDate = new Date(item.check_out);
      const nights = item.quantity;

      if (isNaN(nights) || nights <= 0) {
        console.error('Invalid check-in or check-out date:', { checkIn: item.check_in, checkOut: item.check_out });
        continue;
      }

      const purchaseId = createNewId();

      const purchase = new Purchase({
        purchaseId: purchaseId,
        user: userId,
        hotelName: hotelName,
        roomName: item.room.title,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights: nights,
        amount: item.price * item.quantity,
        paymentMethod: provider,
        status: status === 'completed' ? 'Paid' : 'Failed',
        processDescription: status === 'completed' ? 'Payment successful' : 'Payment failed',
        purchaseLog: [{ message: status === 'completed' ? 'Purchase completed' : 'Purchase failed' }]
      });

      switch (provider) {
        case 'stripe':
          purchase.stripePaymentIntentId = paymentData.id;
          break;
        case 'paypal':
          purchase.paypalPaymentId = paymentData.id;
          break;
        case 'omise':
          purchase.omiseChargeId = paymentData.id;
          break;
      }

      await purchase.save();
      purchases.push(purchase);
    }

    await Cart.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { isSelected: true } } }
    );

    return purchases;
  } catch (error) {
    console.error('Error in createPurchaseFromPayment:', error);
    throw error;
  }
}

function createNewId() {
  const date = new Date();
  const formattedDate = date.toISOString().slice(2, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `#${formattedDate}${randomChars}`;
}

async function sendReceiptEmail(email, purchase) {
  console.log("Sending Email to ", email)
  console.log("Sending Purchase Infos: ", purchase)
  console.log("Purchase ID: ", purchase.purchaseId)

  const receiptItemsHtml = purchase.map(purchases => {
    return `
    <div style="font-family: Arial, sans-serif; border: 1px solid #ccc; padding: 20px; width: 100%; max-width: 600px; margin: 0 auto;">
    <h2 style="text-align: center; color: #1E4DEF;">Trip-day Purchase Receipt</h2>
    <hr style="border: 0; height: 1px; background-color: #1E4DEF;">
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Purchase ID:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.purchaseId}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Hotel:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.hotelName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Room:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.roomName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Validation From:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.checkIn.toDateString()}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Expired at:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.checkOut.toDateString()}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Quantity:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.nights} nights</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Payment Method:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.paymentMethod}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Status:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">${purchases.status}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;"><strong>Price:</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #ccc;">THB ${purchases.amount}</td>
      </tr>
    </table>
    <hr style="border: 0; height: 1px; background-color: #1E4DEF;">
    <p style="text-align: center;">Thank you for your purchase!</p>
  </div>
  
    `;
  }).join('');

  const receiptHtml = `
    <h1>Trip-day Purchase Receipt</h1>
     <p>Thank you for your purchase!</p>
    ${receiptItemsHtml}
    <p>Please contact us if you have any questions.</p>
  `;
  
  bot.sendMessage(process.env.TELGRAM_CHAT_ID, `결제가 완료되어 영수증이 발행되었습니다. ${receiptItemsHtml}`);
  // const receiptHtml = `
  //   <h1>Trip-day Purchase Receipt</h1>
  //   <p>Thank you for your purchase!</p>
  //   <h2>Purchase Details:</h2>
  //   <ul>
  //     <li>Purchase ID: ${purchase.purchaseId}</li>
  //     <li>Hotel: ${purchase.hotelName}</li>
  //     <li>Room: ${purchase.roomName}</li>
  //     <li>Check-in: ${purchase.checkIn}</li>
  //     <li>Check-out: ${purchase.checkOut}</li>
  //     <li>Validation Days: ${purchase.nights}</li>
  //     <li>Amount: THB ${purchase.amount}</li>
  //     <li>Payment Method: ${purchase.paymentMethod}</li>
  //     <li>Status: ${purchase.status}</li>
  //   </ul>
  //   <p>If you have any questions, please contact our customer support.</p>
  // `;
  console.log("receiptHtml: ", receiptHtml)

  const data = {
    from: 'TRIP-DAY PURCHASE RECEIPT <billing@trip-day.com>',
    to: email,
    subject: 'Trip-day Purchase Receipt',
    html: receiptHtml
  };

  return new Promise((resolve, reject) => {
    mailgun.messages().send(data, (error, body) => {
      if (error) {
        console.error('Error sending receipt email:', error);
        reject(error);
      } else {
        console.log('Receipt email sent successfully:', body);
        resolve(body);
      }
    });
  });
}

module.exports = exports;
