// models/golf.js
const mongoose = require('mongoose');

// 시설 정보 스키마 정의
const facilityInfoSchema = new mongoose.Schema({
  title: String,
  text: [String],
});

// 시설 항목 스키마 정의
const listItemSchema = new mongoose.Schema({
  facilityDesc: { type: String, required: true },
  chargeType: { type: Number, required: true },
  extraInfo: {
    openTime: String,
    openTimes: [String],
  },
  facilityInfo: [facilityInfoSchema],
});

// 시설 스키마 정의
const facilitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  list: [listItemSchema],
});

// 사진 그룹 스키마 정의
const pictureGroupSchema = new mongoose.Schema({
  picGroupName: String,
  picGroupList: [
    {
      smallImgUrl: String,
      bigImgUrl: String,
    },
  ],
});

// 골프장 등급 정보 스키마 정의
const ratingInfoSchema = new mongoose.Schema({
  level: { type: Number, required: true },
  type: { type: String, required: true },
});

// 홀 정보 스키마 정의
const holeInfoSchema = new mongoose.Schema({
  weekdayMorning: { type: Number, required: true },
  weekdayAfternoon: { type: Number, required: true },
  weekendMorning: { type: Number, required: true },
  weekendAfternoon: { type: Number, required: true },
  caddieFee: { type: Number, required: true },
  cartFee: { type: Number, required: true },
});

// 골프 상품 스키마 정의
const golfSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: false },
  nameEn: { type: String },
  image_id: { type: String, required: true },
  banner_image_id: { type: String, required: true },
  location_id: { type: String, required: false },
  address: { type: String, required: false },
  map_lat: { type: Number, required: false },
  map_lng: { type: Number, required: false },
  is_featured: { type: Boolean, default: false },
  gallery: [String],
  video: { type: String },
  policy: { type: String },
  rating: { type: Number, required: false },
  ratingInfo: ratingInfoSchema,
  price: { type: Number, required: true },
  tee_time: { type: String, required: true, default: "05:30~11:30" },
  allow_full_day: { type: Boolean, default: false },
  sale_price: { type: Number , default: 0},
  status: { type: String, required: true },
  create_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  update_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deleted_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  review_score: { type: Number },
  ical_import_url: { type: String },
  enable_extra_price: { type: Boolean, default: false },
  extra_price: { type: Number },
  enable_service_fee: { type: Boolean, default: false },
  service_fee: { type: Number },
  surrounding: { type: String },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  min_day_before_booking: { type: Number },
  isPromotion: Boolean,
  promotionType: String,
  promotionStartDate: Date,
  promotionEndDate: Date,
  voucherAmount: Number,
  location: String,

  facilityTags: [String],
  topAwardInfo: {
    listSubTitle: String,
    listUrl: String,
    rankId: String,
    golfRank: Number,
  },
  countryName: String,
  provinceName: String,
  cityName: String,
  openYear: String,

  golfPositionInfo: {
    address: String,
    trafficInfo: {
      trafficDesc: String,
      trafficType: Number,
    },
    placeInfo: {
      poiDesc: String,
      poiList: [
        {
          desc: String,
          type: String,
          distance: String,
          icon: String,
        },
      ],
    },
  },
  
  golfFacilityPop: {
    general: [String],
    facilities: [facilitySchema],
  },

  golfDescriptionInfo: {
    sectionList: [
      {
        title: String,
        desc: String,
      },
    ],
    needTranslate: { type: Boolean, default: false },
    videoUrl: String,
    image: String,
  },

  golfTopImage: {
    total: Number,
    imgUrlList: [String],
  },

  golfFacilityPopV2: {
    golfPopularFacility: {
      title: String,
      list: [
        {
          facilityDesc: String,
          showTitle: String,
        },
      ],
    },
    golfFacility: [
      {
        title: String,
        categoryList: [
          {
            facilityDesc: String,
            showTitle: String,
            facilityInfo: [facilityInfoSchema],
          },
        ],
      },
    ],
    pictureGroups: [pictureGroupSchema],
  },

  // 골프장 특화 필드
  course_info: {
    holes: { type: Number, required: true, default: 18 },
    par: { type: Number, required: true, default: 72 },
  },
  holes: [holeInfoSchema],
  rental_equipment: [String],
  caddie_service: { type: Boolean, default: false },
  pro_shop: { type: Boolean, default: false },
  driving_range: { type: Boolean, default: false },
  golf_cart: { type: Boolean, default: false },
  clubhouse: { type: Boolean, default: false },
  restaurant: { type: Boolean, default: false },
  locker_room: { type: Boolean, default: false },

  location_category: { type: String },
});

// 16자리 ID 생성을 위한 pre-save 미들웨어 추가
golfSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
  }
  next();
});

module.exports = mongoose.model('Golf', golfSchema);