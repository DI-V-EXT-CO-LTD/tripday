// models/hotel.js
const mongoose = require('mongoose');

// 시설 정보 스키마 정의
const facilityInfoSchema = new mongoose.Schema({
  title: String,
  text: [String],
});

// 시설 항목 스키마 정의
const listItemSchema = new mongoose.Schema({
  facilityDesc: { type: String, required: true }, // 시설 설명
  chargeType: { type: Number, required: true }, // 요금 유형 (예: 무료, 유료)
  extraInfo: {
    openTime: String, // 오픈 시간
    openTimes: [String], // 오픈 시간 목록
  },
  facilityInfo: [facilityInfoSchema], // 추가 정보
});

// 시설 스키마 정의
const facilitySchema = new mongoose.Schema({
  title: { type: String, required: true }, // 시설 제목
  list: [listItemSchema], // 시설 목록
});

// 사진 그룹 스키마 정의
const pictureGroupSchema = new mongoose.Schema({
  picGroupName: String, // 사진 그룹 이름
  picGroupList: [
    {
      smallImgUrl: String, // 작은 이미지 URL
      bigImgUrl: String, // 큰 이미지 URL
    },
  ],
});

// 호텔 별 정보 스키마 정의
const starInfoSchema = new mongoose.Schema({
  level: { type: Number, required: true }, // 별 등급
  type: { type: String, required: true }, // 별 등급 유형 (예: star)
});

// 호텔 스키마 정의
const hotelSchema = new mongoose.Schema({
  id: { type: String, unique: true }, // Changed to String type
  title: { type: String, required: true }, // 호텔 이름
  slug: { type: String, required: true, unique: true }, // 호텔 URL 슬러그 (고유)
  content: { type: String, required: false }, // 호텔 설명
  nameEn: { type: String }, // 호텔 영문 이름
  image_id: { type: String, required: true }, // 이미지 ID
  banner_image_id: { type: String, required: true }, // 배너 이미지 ID
  location_id: { type: String, required: true }, // 위치 ID
  address: { type: String, required: false }, // 호텔 주소
  map_lat: { type: Number, required: false }, // 지도 위도
  map_lng: { type: Number, required: false }, // 지도 경도
  map_zoom: { type: Number, required: true }, // 지도 줌 레벨
  is_featured: { type: Boolean, default: false }, // 추천 호텔 여부
  gallery: [String], // 갤러리 이미지 목록
  video: { type: String }, // 비디오 URL
  policy: { type: String }, // 호텔 정책
  star_rate: { type: Number, required: false }, // 호텔 별점
  starInfo: starInfoSchema, // 호텔 별 정보
  price: { type: Number, required: true }, // 기본 가격
  check_in_time: { type: String, required: true }, // 체크인 시간
  check_out_time: { type: String, required: true }, // 체크아웃 시간
  allow_full_day: { type: Boolean, default: false }, // 하루 종일 예약 가능 여부
  sale_price: { type: Number }, // 할인가
  status: { type: String, required: true }, // 호텔 상태 (예: 운영 중, 예약 불가)
  create_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 생성자
  update_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 수정자
  deleted_at: { type: Date }, // 삭제된 날짜
  created_at: { type: Date, default: Date.now }, // 생성 날짜
  updated_at: { type: Date, default: Date.now }, // 수정 날짜
  review_score: { type: Number }, // 리뷰 점수
  ical_import_url: { type: String }, // iCal 가져오기 URL
  enable_extra_price: { type: Boolean, default: false }, // 추가 요금 활성화 여부
  extra_price: { type: Number }, // 추가 요금
  enable_service_fee: { type: Boolean, default: false }, // 서비스 요금 활성화 여부
  service_fee: { type: Number }, // 서비스 요금
  surrounding: { type: String }, // 주변 정보
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // 작성자
  min_day_before_booking: { type: Number }, // 최소 예약 가능일
  min_day_stays: { type: Number }, // 최소 숙박 일수,
  location: String,
  isPromotion: Boolean,
  promotionType: String,
  promotionStartDate: Date,
  promotionEndDate: Date,
  voucherAmount: Number,

  // 추가된 필드들
  facilityTags: [String], // 시설 태그
  topAwardInfo: {
    listSubTitle: String, // 상위 수상 서브 타이틀
    listUrl: String, // 상위 수상 URL
    rankId: String, // 랭크 ID
    hotelRank: Number, // 호텔 순위
  },
  countryName: String, // 국가 이름
  provinceName: String, // 주 이름
  cityName: String, // 도시 이름
  openYear: String, // 개장 연도

  // 위치 정보
  hotelPositionInfo: {
    address: String, // 호텔 주소
    trafficInfo: {
      trafficDesc: String, // 교통 설명
      trafficType: Number, // 교통 유형 (예: 거리, 시간)
    },
    placeInfo: {
      poiDesc: String, // 주변 명소 설명
      poiList: [
        {
          desc: String, // 명소 설명
          type: String, // 명소 유형 (예: 공항, 관광지)
          distance: String, // 거리
          icon: String, // 아이콘
        },
      ],
    },
  },
  
  // 호텔 시설 정보
  hotelFacilityPop: {
    general: [String], // 일반 정보
    facilities: [facilitySchema], // 시설 정보
  },

  // 호텔 설명 정보
  hotelDescriptionInfo: {
    sectionList: [
      {
        title: String, // 섹션 제목
        desc: String, // 섹션 설명
      },
    ],
    needTranslate: { type: Boolean, default: false }, // 번역 필요 여부
    videoUrl: String, // 비디오 URL
    image: String, // 대표 이미지
  },

  // 호텔 이미지 정보
  hotelTopImage: {
    total: Number, // 총 이미지 수
    imgUrlList: [String], // 이미지 URL 리스트
  },

  // 호텔 시설 정보 V2
  hotelFacilityPopV2: {
    hotelPopularFacility: {
      title: String, // 인기 시설 제목
      list: [
        {
          facilityDesc: String, // 인기 시설 설명
          showTitle: String, // 추가 정보 제목
        },
      ],
    },
    hotelFacility: [
      {
        title: String, // 시설 제목
        categoryList: [
          {
            facilityDesc: String, // 시설 설명
            showTitle: String, // 추가 정보 제목
            facilityInfo: [facilityInfoSchema], // 추가 정보
          },
        ],
      },
    ],
    pictureGroups: [pictureGroupSchema], // 사진 그룹 정보
  },

  // Add the rooms field
  rooms: [],
  location_category: { type: String }, // 위치 카테고리
});

// Add a pre-save middleware to generate the 16-digit ID
hotelSchema.pre('save', function(next) {
  if (!this.id) {
    // Generate a 16-digit ID
    this.id = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
  }
  next();
});

module.exports = mongoose.model('Hotel', hotelSchema);
