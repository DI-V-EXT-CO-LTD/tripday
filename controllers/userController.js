const bcrypt = require('bcrypt');
const crypto = require('crypto');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const mailgunConfig = require('../config/mailgun');
const mailgun = require('mailgun-js')(mailgunConfig);
const User = require('../models/user');
const Wallet = require('../models/wallet');
const EmailLog = require('../models/emailLog');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELGRAM_BOT_TOKEN, {polling: false});
const TeleSignSDK = require('telesignenterprisesdk');



// Telesign API 설정
const customerId = process.env.TELESIGN_CUSTOMER_ID || "10EE9F41-2A3F-45D7-A02E-97A2C1BB4DFD";
const apiKey = process.env.TELESIGN_API_KEY || 'M1DHr37Dvpo5hN+rpmWDpgSBJY+Cz2pliUzjPQ6Ek2tRRo9nU9e8ChM4C2VLnFgW4cwqVdw4Uvh2BpPBmeYDCg==';


// 회원가입 페이지 렌더링
exports.renderRegisterPage = (req, res) => {
  res.render('auth/register');
};

// 회원가입 처리
exports.registerUser = async (req, res) => {
  const { email } = req.body;

  try {


    // 중복 체크
    const existingUser = await User.findOne({ email : email });
    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const browserName = parser.getBrowser().name;
    const deviceType = parser.getDevice().type || 'Computer';

    const geo = geoip.lookup(req.ip);
    const country = geo ? geo.country : 'Unknown';

    if (existingUser) {
      console.log(`Existing User ${email} is trying to register ID from ${req.ip} from ${country}`);
      return res.status(400).json({ message: 'Email is already registered.' });
    }

  
    

    const newUser = new User({
      email:email,
      verificationToken: crypto.randomBytes(32).toString('hex'),
      status: 'Pending',
      registrationIP: req.ip,
      registrationCountry: country,
      registrationBrowser: browserName,
      registrationDevice: deviceType,
      isEmailVerified: false
    });

    await newUser.save();

    bot.sendMessage(process.env.TELGRAM_CHAT_ID, `신규 계정(${email}) 이 생성되었습니다. . \n=================================\n\n이메일: ${newUser.email}\n가입아이피: ${newUser.registrationIP}\n가입국가: ${newUser.registrationCountry}\n가입디바이스:${newUser.registrationBrowser}\n\n=================================`);

    // Create a wallet for the new user
    const newWallet = new Wallet({
      user: newUser._id,
      thbBalance: 0,
      usdtBalance: 0
    });

    await newWallet.save();

    const data = {
      from: 'TRIP-DAY EMAIL VERIFICATION <contact@trip-day.com>',
      to: email,
      subject: 'Email Verification',
      text: `Click the link to verify your email: http://trip-day.com/auth/verify-email?token=${newUser.verificationToken}`
    };

    mailgun.messages().send(data, (error, body) => {
      if (error) {
        return res.status(500).send('Error sending verification email');
      }
      res.status(201).json({ message: 'Verification email sent. Please check your inbox.' });
    });
    const newEmailLog = new EmailLog({
      from: data.from,
      to: data.to,
      subject: data.subject,
      text: data.text,
    });
    await newEmailLog.save();

  } catch (error) {
    console.error('Error in registerUser:', error);
    res.status(500).send('Server error');
  }
};

// 이메일 인증 처리
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).send('Invalid token');
    }

    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const browserName = parser.getBrowser().name;
    const deviceType = parser.getDevice().type || 'Computer';

    const geo = geoip.lookup(req.ip);
    const country = geo ? geo.country : 'Unknown';

    user.status = 'Active';
    user.verificationToken = undefined;
    user.isEmailVerified = true;
    user.emailVerificationDate = new Date();
    user.emailVerificationIP = req.ip;
    user.emailVerificationCountry = country;
    user.emailVerificationBrowser = browserName;
    user.emailVerificationDevice = deviceType;
    user.smsVerificationCode = Math.floor(100000 + Math.random() * 900000);
    user.userLevel = 0;
    user.userReceiveEmail = user.email;
    user.userPaybackRate = 0;
    user.companyName = "";
    user.contactPerson = "";
    user.contactNumber = "";
    user.businessNumber = "";
    user.companyAddress = "";
    
    await user.save();

    // 비밀번호 설정 페이지로 리다이렉트
    res.redirect(`/auth/set-password?email=${encodeURIComponent(user.email)}`);
  } catch (error) {
    res.status(500).send('Server error');
  }
};

exports.sendSms = async (req, res) => {
  try {
    const phoneNumber = req.body.phoneNumber || "66624346909"; // 전화번호를 요청으로부터 받음
    const verifyCode = Math.floor(10000 + Math.random() * 90000).toString(); // 5자리 인증 코드 생성
    const params = {
      verify_code: verifyCode,
      sender_id: "undefined"
    };

    const client = new TeleSignSDK(customerId, apiKey);

    // SMS 전송 콜백 함수
    function smsVerifyCallback(error, responseBody) {
      if (error === null) {
        console.log("\nResponse body:\n" + JSON.stringify(responseBody));
        res.status(200).send({
          message: "인증 코드가 발송되었습니다.",
          verifyCode: verifyCode // 테스트 목적
        });
      } else {
        console.error("Unable to send message. " + error);
        res.status(500).send("SMS 발송 중 오류 발생");
      }
    }

    // SMS 전송
    client.verify.sms(smsVerifyCallback, phoneNumber, params);
  } catch (error) {
    console.error("Error in sending SMS: ", error);
    res.status(500).send("서버 오류 발생");
  }
};
// 사용자가 입력한 인증 코드를 검증하는 함수
exports.verifyCode = (req, res) => {
  const { inputCode, actualCode } = req.body; // 사용자가 입력한 코드와 실제 코드 받기

  if (inputCode === actualCode) {
    res.status(200).send("인증 성공");
  } else {
    res.status(400).send("인증 실패");
  }
};

// 로그인 페이지 렌더링
exports.renderLoginPage = (req, res) => {
  res.render('auth/login', { error: req.flash('error') });
};

// 로그인 처리
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const hasInvalidChars = /[^a-zA-Z0-9@]/.test(email);

    if (hasInvalidChars) {
      return res.status(400).json({ message: 'LGERR: Email contains invalid characters' });
    }            

    const user = await User.findOne({ email });

    if (!user || !user.validPassword(password)) {
      return res.status(401).send('Invalid username or password');
    }

    if (!user.isApproved) {
      return res.status(403).send('Your account has not been approved by an admin.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    else{
      user.lastLogin = new Date();
      await user.save();
      console.log("Password Match");
    }
    const userAgent = req.headers['user-agent'];
    const parser = new UAParser(userAgent);
    const browserName = parser.getBrowser().name;
    const deviceType = parser.getDevice().type || 'Computer';

    const geo = geoip.lookup(req.ip);
    const country = geo ? geo.country : 'Unknown';
    bot.sendMessage(process.env.TELGRAM_CHAT_ID, `${user.email}님이 로그인 하셨습니다. IP:${req.ip} 국가:${country} 브라우저:${browserName} 디바이스:${deviceType}`);
    req.login(user, (err) => {
      if (err) {
        return res.status(500).send('Server error');
      }
      
      res.redirect('/');
    });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

// 관리자 승인 처리
exports.approveUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found.');
    }

    user.isApproved = true;
    await user.save();

    res.send('User approved successfully.');
  } catch (error) {
    res.status(500).send('Server error.');
  }
};

// 비밀번호 설정 페이지 렌더링
exports.renderSetPasswordPage = (req, res) => {
  const { email } = req.query;
  res.render('auth/set-password', { email : email });
};

// 비밀번호 설정 처리
exports.setPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email : email });

    if (!user) {
      return res.status(400).send('Invalid email');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.send('Password has been set successfully. You can now log in.');
  } catch (error) {
    console.error('Error setting password:', error);
    res.status(500).send('Server error');
  }
};

// 이메일 중복 확인 처리
exports.checkEmail = async (req, res) => {
  const { email } = req.query;

  try {
 

    const existingUser = await User.findOne({ email  : email});
    if (existingUser) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
};
