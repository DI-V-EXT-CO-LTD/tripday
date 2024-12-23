// models/room.js
const mongoose = require('mongoose');
const SMTPConnection = require('nodemailer/lib/smtp-connection');
const { Accessibility } = require('puppeteer');

const roomSchema = new mongoose.Schema({
  id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  images: { type: [String], required: true },
  price: { type: Number, required: true },
  hotel: { type: String, required: true },//변경
  number: { type: Number, required: true },
  beds: { type: Number, required: true },
  size: { type: Number, required: true, default: 100 },
  adults: { type: Number, required: true },
  children: { type: Number, required: true },
  status: { 
    type: String, 
    required: false, 
    enum: [
      'active', 
      'inactive', 
      'deleted', 
      'pending', 
      'rejected', 
      'sold', 
      'reserved', 
      'booked', 
      'completed', 
      'cancelled', 
      'refunded',
      'verified',
      'approved',
    ],
    default: 'active' 
},
  create_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  update_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deleted_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  ical_import_url: { type: String },
  min_day_stays: { type: Number },
  amenities: [String],
  bed_type: { type: String },
 
  room_details: {
    Room_Amenities:{
      Clothes_rack: { type: Boolean, default: false },
      Drying_rack_for_clothing: { type: Boolean, default: false },
      Trash_cans: { type: Boolean, default: false },
      Socket_near_the_bed: { type: Boolean, default: false },
      Non_feather_pillow: { type: Boolean, default: false },
      Feather_pillow: { type: Boolean, default: false },
      Hypoallergenic_pillow: { type: Boolean, default: false },
      Adapter: { type: Boolean, default: false },
      Feather_bed: { type: Boolean, default: false },
      Hypoallergenic_bedding: { type: Boolean, default: false },
      Sofa_bed: { type: Boolean, default: false },
      Fold_up_bed: { type: Boolean, default: false },
      Clothes_drying_rack: { type: Boolean, default: false },
      Sofa: { type: Boolean, default: false },
      Carpeted: { type: Boolean, default: false },
      Tile_Marble_floor: { type: Boolean, default: false },
      Private_entrance: { type: Boolean, default: false },
      Interconnecting_room: { type: Boolean, default: false },
      Desk: { type: Boolean, default: false },
      Seating_Area: { type: Boolean, default: false },
      Dining_area: { type: Boolean, default: false },
      Outdoor_furniture: { type: Boolean, default: false },
      Patio: { type: Boolean, default: false },
      Balcony: { type: Boolean, default: false },
      Terrace: { type: Boolean, default: false },
      Garden: { type: Boolean, default: false },

    },
    Toiletries:{
      Toothbrush: { type: Boolean, default: false },
      BodyWash: { type: Boolean, default: false },
      HairConditioner: { type: Boolean, default: false },
      ShowerCap: { type: Boolean, default: false },
      Shaver: { type: Boolean, default: false },
      ToothPaste: { type: Boolean, default: false },
      Shampoo: { type: Boolean, default: false },
      Soap: { type: Boolean, default: false },
      Comb: { type: Boolean, default: false },
    },
    Accessibility:{
      Stair_free_property_entrance: { type: Boolean, default: false },
      Toilet_with_armrests: { type: Boolean, default: false },
      Lever_door_handles: { type: Boolean, default: false },
      Visual_Fire_Alarm: { type: Boolean, default: false },
    },
    Cleaning_Services:{
      Kitchen: { type: Boolean, default: false },
      Refrigerator: { type: Boolean, default: false },
      Microwave: { type: Boolean, default: false },
    },
    Media_Technology:{
      TV: { type: Boolean, default: false },
      Telephone: { type: Boolean, default: false },
      Satellite_channels: { type: Boolean, default: false },
    },
    Food_Drink:{
      Tea_Coffee_maker: { type: Boolean, default: false },
      Minibar: { type: Boolean, default: false },
    },
    Internet:{
      Free_Wifi: { type: Boolean, default: false },
    },
    Parking:{
      Free_Parking: { type: Boolean, default: false },
    },
    Services:{
      Room_service: { type: Boolean, default: false },
      Wake_up_service: { type: Boolean, default: false },
    },
    General:{
      smoking: { type: Boolean ,default: false },
      free_wifi: { type: Boolean, default: true },
      bathtub: { type: Boolean, default: false },
      Air_conditioning: { type: Boolean, default: true },
      private_bathroom: { type: Boolean, default: true },
      Air_conditioning: { type: Boolean, default: false },
      Heating: { type: Boolean, default: false },
      Safe: { type: Boolean, default: false },
      Iron: { type: Boolean, default: false },
      Ironing_facilities: { type: Boolean, default: false },
      Laptop_safe: { type: Boolean, default: false },
      Soundproof: { type: Boolean, default: false },
      Wardrobe: { type: Boolean, default: false },
      Hypoallergenic: { type: Boolean, default: false },
      
    }
  },
  max_occupancy: { type: Number },
  is_breakfast_included: { type: Boolean, default: false },
  is_refundable: { type: Boolean, default: false },
  cancellation_policy: { type: String },
  available_dates: [{
    date: Date,
    is_available: Boolean,
    price: Number
  }],
  original_price: { type: Number },
  sales_price: { type: Number },
  rebate: { type: Number },
  profitRate: { type: Number },
});

module.exports = mongoose.model('Room', roomSchema);
