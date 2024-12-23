const express = require("express");
const router = express.Router();
const Hotel = require('../models/hotel'); // 추가
const Golf = require('../models/golf'); // 추가
const nodeCron = require('node-cron'); // 추가
const PromotionCategory = require('../models/promotionCategory'); // 추가
const he = require('he');

router.get("/:type", async (req, res) => {
  const {type} = req.params;

  console.log("TYPE:::IJIJ"+type);
  const FindHotels = await Hotel.find({}).limit(12); // 추가
  const golfs = []; // 추가

  // Decode HTML entities and remove HTML tags from content
  const hotels = FindHotels.map(hotel => {
    if (hotel.content) {
        hotel.content = he.decode(hotel.content).replace(/<[^>]*>/g, '');
    }
    return hotel;
});


  res.render("promotions/Promotions", { promotions: req.app.locals.promotions, hotels, golfs }); // 추가
});

router.get("/promotions/:type", async (req, res) => {
  const type = req.params.type;
  const hotels = await Hotel.find({promotionType:type}).limit(12); // 추가
  console.log("TYPE:::"+type);

  res.render("promotions/Promotions", { promotions: req.app.locals.promotions, hotels }); // 추가
});

// 매일 밤 12시에 실행되는 cron job
// nodeCron.schedule('0 0 * * *', async () => {
//   try {
//     // 랜덤하게 프로모션 상품 선택 로직
//     const randomPromotions = await getRandomPromotions();
//     // 선택된 상품을 req.app.locals.promotions에 업데이트
//     req.app.locals.promotions = randomPromotions;
//     console.log('프로모션 상품이 랜덤하게 업데이트되었습니다.');
//   } catch (error) {
//     console.error('프로모션 상품 업데이트 중 오류 발생:', error);
//   }
// });

async function getRandomPromotions() {
  const promotionCategories = await PromotionCategory.find({});
  const randomPromotions = [];
  for (const category of promotionCategories) {
    const promotionsInCategory = await Golf.find({ promotionType: category.name });
    if (promotionsInCategory.length > 0) {
      const randomIndex = Math.floor(Math.random() * promotionsInCategory.length);
      randomPromotions.push(promotionsInCategory[randomIndex]);
    }
  }
  return randomPromotions;
}

module.exports = router;