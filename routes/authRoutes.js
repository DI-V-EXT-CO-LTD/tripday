// routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const userController = require('../controllers/userController');
const user = require('../models/user'); 
const router = express.Router();
const moment = require('moment-timezone');
const KRTime = moment().tz('Asia/Seoul')
const UAParser = require('ua-parser-js');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELGRAM_BOT_TOKEN, {polling: false});
const geoip = require('geoip-lite');


// 회원가입 페이지 렌더링
router.get('/register', userController.renderRegisterPage);

// 회원가입 처리
router.post('/register', userController.registerUser);

// 이메일 인증 처리
router.get('/verify-email', userController.verifyEmail);

// 로그인 페이지 렌더링
router.get('/login', userController.renderLoginPage);

// 로그인 처리
router.post('/login', (req, res, next) => {
  console.log('Login attempt:', req.body);
  const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const browserName = parser.getBrowser().name;
    const deviceType = parser.getDevice().type || 'Computer';

    const geo = geoip.lookup(req.ip);
    const country = geo ? geo.country : 'Unknown';
    
  passport.authenticate('local', (err, user, info) => {
    //console.log('Passport authenticate result:', { err, user, info });
    if (err) {
      console.error('Authentication error:', err);
      return next(err);
    }
    if (!user) {
      console.log('Authentication failed:', info.message);
      return res.status(401).json({ error: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return next(err);
      }
      checkUser(req.body.email);
      bot.sendMessage(process.env.TELGRAM_CHAT_ID, `${req.body.email}님이 로그인 하셨습니다. \nIP:${req.ip} \n국가:${country} \n브라우저:${browserName} \n디바이스:${deviceType}`);
      return res.json({ success: true, message: 'Login successful' });
    });
  })(req, res, next);
});

async function checkUser(findEmail) {
  let FindUser = await user.findOne({email: findEmail});
  if(FindUser){
    const lastLogin = new Date();
      FindUser.lastLogin = lastLogin;
      await FindUser.save();
  }
}

// 로그아웃 처리
router.get('/logout', (req, res) => {
  console.log('Logout request received');
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return next(err);
    }
   
    res.redirect('/');
  });
});

// 관리자 승인 처리
router.post('/approve/:userId', userController.approveUser);

// 비밀번호 설정 페이지 렌더링
router.get('/set-password', userController.renderSetPasswordPage);

// 비밀번호 설정 처리
router.post('/set-password', userController.setPassword);

// 이메일 중복 확인 처리 (비밀번호 입력 필드 표시용)
router.get('/check-email', userController.checkEmail);

router.get('/user/testsms', userController.sendSms);

module.exports = router;
