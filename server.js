//server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const paypal = require('@paypal/checkout-server-sdk');
const omise = require('omise')({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
});
const app = express();

const port = process.env.PORT || 80;
const sslPort = process.env.SSL_PORT || 443;
const useHttps = true;
const TelegramBot = require('node-telegram-bot-api');

const invoiceRouter = require('./routes/invoice');
const vouchersRouter = require('./routes/voucherRoutes');
const authRoutes = require('./routes/authRoutes');
const indexRouter = require('./routes/index');
const adminRoutes = require('./routes/adminRoutes');
const cartRoutes = require('./routes/cartRoutes');
const profileRoutes = require('./routes/profileRoutes');
const walletRoutes = require('./routes/walletRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const messageRoutes = require('./routes/message');
const getConnection = require('./config/db');
const hotelDetailsRouter = require('./routes/hotelDetails');
const adminInvoiceRouter = require('./routes/adminInvoice');
const dashboardRoutes = require('./routes/dashboard');
const testRoutes = require('./routes/testRoutes');
const injectScripts = require('./middleware/injectScripts');
const splitInvoiceRoutes = require('./routes/splitInvoiceRoutes');
const golfRoutes = require('./routes/golfRoutes');
const promotionsRoutes = require('./routes/promotionsRoutes');
const imageRoutes = require('./routes/imageRoutes');
const packageRoutes = require('./routes/packageRoutes');
const aboutRoutes = require('./routes/about');
const customerServiceRoutes = require('./routes/customerService');

const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');


var bodyParser = require('body-parser');
var urlencodeParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodeParser);
require('./models/hotel');
require ('./models/locationCategories')

// MongoDB connection setup
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/invoices', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connection successful'))
  .catch(err => console.error('MongoDB connection failed:', err));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'trip-day-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: useHttps }
}));
const bot = new TelegramBot(process.env.TELGRAM_BOT_TOKEN, {polling: true});
app.use(flash());
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(cookieParser());

// Template engine setup
app.set('view engine', 'ejs');

app.use(passport.initialize());
app.use(passport.session());

require('./config/passport');

// HTTPS 리다이렉션 미들웨어
if (useHttps) {
  app.use((req, res, next) => {
    if (req.secure) {
      next();
    } else {
      res.redirect(`https://${req.headers.host}${req.url}`);
    }
  });
}

// Make current user information available to all views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use((req, res, next) => {
  req.getConnection = getConnection;
  next();
});

app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

// Add the injectScripts middleware
app.use(injectScripts);

// Make Stripe publishable key available to all views
app.use((req, res, next) => {
  res.locals.stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  next();
});

// Initialize PayPal
const paypalClient = new paypal.core.PayPalHttpClient(
  new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  )
);

// Make PayPal client available in the request object
app.use((req, res, next) => {
  req.paypalClient = paypalClient;
  next();
});

// Make Omise available in the request object
app.use((req, res, next) => {
  req.omise = omise;
  next();
});

const http = require("http");
const https = require("https");
const fs = require('fs');

// Routes
app.use('/invoice', invoiceRouter);
app.use('/vouchers', vouchersRouter);
app.use('/api/vouchers', vouchersRouter);
app.use('/auth', authRoutes);
app.use('/hotelDetails', hotelDetailsRouter);
app.use('/admin', adminRoutes);
app.use('/admin/invoice', adminInvoiceRouter);
app.use('/cart', cartRoutes);
app.use('/profile', profileRoutes);
app.use('/wallet', walletRoutes);
app.use('/bookings', bookingRoutes);
app.use('/purchases', purchaseRoutes);
app.use('/messages', messageRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/test', testRoutes);
app.use('/split-invoice', splitInvoiceRoutes);
app.use('/golf', golfRoutes);
app.use('/images', imageRoutes);
app.use('/promotions', promotionsRoutes);
app.use('/package', packageRoutes);
app.use('/about', aboutRoutes);
app.use('/customer-service', customerServiceRoutes);
app.use('/', indexRouter);

// Webhook routes
app.post('/webhook/stripe', purchaseRoutes);
app.post('/webhook/paypal', purchaseRoutes);
app.post('/webhook/omise', purchaseRoutes);

// New route for API_Sample.xlsx
app.get('/resources/API_Sample.xlsx', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'resources', 'API_Sample.xlsx');
  res.download(filePath, 'API_Sample.xlsx', (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(404).send('File not found');
    }
  });
});

// HTTP 서버 생성 및 실행
const httpServer = http.createServer(app);
httpServer.listen(port, () => console.log(`HTTP Server running on port ${port}`));

// HTTPS 서버 생성 및 실행 (주석 처리)
console.log("useHTTPS:",useHttps);
if (useHttps) {
  const httpsOptions = {
    key: fs.readFileSync('/Users/simjinmyeong/Desktop/root/trip-day.key'), // 개인 키 파일
    cert: fs.readFileSync('/Users/simjinmyeong/Desktop/root/ssl/trip-day.crt'), // 인증서 파일
    ca: fs.readFileSync('/Users/simjinmyeong/Desktop/root/ssl/gd_bundle-g2-g1.crt') // 체인 인증서
  };
  const httpsServer = https.createServer(httpsOptions, app);
  httpsServer.listen(sslPort, () => {
    console.log(`HTTPS Server running on port ${sslPort}`);

    // 텔레그램 봇으로 서버 시작 알림 메시지 전송
  });
}


function loginFailed(req, res) {
  res.status(401).render('login', { error: 'Invalid username or password' });
}
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log(chatId);
  console.log(msg.chat.type)

  // '/status' 명령이 오면 서버 상태 정보 전송
  const requestType = msg.text.toLowerCase();
  let botMsg = "학습중입니다. 느긋하게 커피한잔하면서 기다려주세요.";
  switch (requestType) {
    case '/status':
      botMsg = "안갈켜줌 ㅋㅋㅋㅋ";
      break;
    case '/name':
      botMsg = "저는 트립데이봇이에요.";
      break;
    
    
    default:
      botMsg = '학습중입니다. 느긋하게 커피한잔하면서 기다려주세요.';
  }

  bot.sendMessage(chatId, botMsg);

  
});