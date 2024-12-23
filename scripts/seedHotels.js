const mongoose = require('mongoose');
const Hotel = require('../models/hotel');
const Room = require('../models/room');

// MongoDB connection string (update with your actual connection string)
const mongoURI = 'mongodb://localhost:27017/invoices';

// Function to seed hotels and rooms
async function seedHotelsAndRooms() {
  try {
    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    // Delete existing hotels and rooms
    await Hotel.deleteMany({});
    await Room.deleteMany({});
    console.log('Existing hotels and rooms deleted');

    const sampleHotels = [
      {
        title: 'Luxury Palace Hotel',
        slug: 'luxury-palace-hotel',
        content: 'Experience unparalleled luxury in the heart of the city.',
        nameEn: 'Luxury Palace Hotel',
        image_id: 'luxury_palace_main.jpg',
        banner_image_id: 'luxury_palace_banner.jpg',
        location_id: 'city-center',
        address: '123 Main St, Metropolis',
        map_lat: 37.7749,
        map_lng: -122.4194,
        map_zoom: 15,
        is_featured: true,
        gallery: ['luxury_palace_1.jpg', 'luxury_palace_2.jpg', 'luxury_palace_3.jpg'],
        video: 'https://example.com/luxury_palace_video.mp4',
        policy: 'Cancellation policy: Free cancellation up to 24 hours before check-in.',
        star_rate: 5,
        starInfo: { level: 5, type: 'star' },
        price: 500,
        check_in_time: '15:00',
        check_out_time: '11:00',
        allow_full_day: true,
        sale_price: 450,
        status: 'active',
        review_score: 4.8,
        facilityTags: ['Swimming Pool', 'Spa', 'Fitness Center', 'Restaurant'],
        countryName: 'United States',
        provinceName: 'California',
        cityName: 'San Francisco',
        openYear: '1990'
      },
      {
        title: 'Seaside Resort',
        slug: 'seaside-resort',
        content: 'Relax and unwind in our beautiful beachfront resort.',
        nameEn: 'Seaside Resort',
        image_id: 'seaside_resort_main.jpg',
        banner_image_id: 'seaside_resort_banner.jpg',
        location_id: 'beach-front',
        address: '456 Ocean Drive, Beachville',
        map_lat: 25.7617,
        map_lng: -80.1918,
        map_zoom: 14,
        is_featured: true,
        gallery: ['seaside_resort_1.jpg', 'seaside_resort_2.jpg', 'seaside_resort_3.jpg'],
        video: 'https://example.com/seaside_resort_video.mp4',
        policy: 'Cancellation policy: Free cancellation up to 48 hours before check-in.',
        star_rate: 4,
        starInfo: { level: 4, type: 'star' },
        price: 300,
        check_in_time: '16:00',
        check_out_time: '10:00',
        allow_full_day: false,
        sale_price: 270,
        status: 'active',
        review_score: 4.5,
        facilityTags: ['Private Beach', 'Water Sports', 'Beachfront Restaurant', 'Kids Club'],
        countryName: 'United States',
        provinceName: 'Florida',
        cityName: 'Miami Beach',
        openYear: '2005'
      },
      {
        title: 'Mountain View Lodge',
        slug: 'mountain-view-lodge',
        content: 'Escape to nature in our cozy mountain retreat.',
        nameEn: 'Mountain View Lodge',
        image_id: 'mountain_lodge_main.jpg',
        banner_image_id: 'mountain_lodge_banner.jpg',
        location_id: 'mountain-area',
        address: '789 Pine Road, Highlands',
        map_lat: 39.7392,
        map_lng: -104.9903,
        map_zoom: 13,
        is_featured: true,
        gallery: ['mountain_lodge_1.jpg', 'mountain_lodge_2.jpg', 'mountain_lodge_3.jpg'],
        video: 'https://example.com/mountain_lodge_video.mp4',
        policy: 'Cancellation policy: 50% refund up to 7 days before check-in.',
        star_rate: 3,
        starInfo: { level: 3, type: 'star' },
        price: 200,
        check_in_time: '14:00',
        check_out_time: '11:00',
        allow_full_day: true,
        sale_price: null,
        status: 'active',
        review_score: 4.2,
        facilityTags: ['Hiking Trails', 'Fireplace', 'Scenic Views', 'Ski Storage'],
        countryName: 'United States',
        provinceName: 'Colorado',
        cityName: 'Denver',
        openYear: '2010'
      },
      {
        title: 'City Center Suites',
        slug: 'city-center-suites',
        content: 'Modern comfort in the bustling heart of downtown.',
        nameEn: 'City Center Suites',
        image_id: 'city_suites_main.jpg',
        banner_image_id: 'city_suites_banner.jpg',
        location_id: 'downtown',
        address: '101 Business Ave, Metropolis',
        map_lat: 40.7128,
        map_lng: -74.0060,
        map_zoom: 15,
        is_featured: false,
        gallery: ['city_suites_1.jpg', 'city_suites_2.jpg', 'city_suites_3.jpg'],
        video: 'https://example.com/city_suites_video.mp4',
        policy: 'Cancellation policy: Free cancellation up to 24 hours before check-in.',
        star_rate: 4,
        starInfo: { level: 4, type: 'star' },
        price: 350,
        check_in_time: '15:00',
        check_out_time: '12:00',
        allow_full_day: false,
        sale_price: 315,
        status: 'active',
        review_score: 4.6,
        facilityTags: ['Business Center', 'Rooftop Bar', 'Gym', 'Room Service'],
        countryName: 'United States',
        provinceName: 'New York',
        cityName: 'New York City',
        openYear: '2015'
      },
      {
        title: 'Historic Boutique Inn',
        slug: 'historic-boutique-inn',
        content: 'Experience charm and elegance in our restored 19th-century inn.',
        nameEn: 'Historic Boutique Inn',
        image_id: 'boutique_inn_main.jpg',
        banner_image_id: 'boutique_inn_banner.jpg',
        location_id: 'old-town',
        address: '222 Heritage St, Oldtown',
        map_lat: 42.3601,
        map_lng: -71.0589,
        map_zoom: 14,
        is_featured: false,
        gallery: ['boutique_inn_1.jpg', 'boutique_inn_2.jpg', 'boutique_inn_3.jpg'],
        video: 'https://example.com/boutique_inn_video.mp4',
        policy: 'Cancellation policy: Full refund up to 14 days before check-in.',
        star_rate: 4,
        starInfo: { level: 4, type: 'star' },
        price: 280,
        check_in_time: '14:00',
        check_out_time: '11:00',
        allow_full_day: true,
        sale_price: null,
        status: 'active',
        review_score: 4.7,
        facilityTags: ['Antique Furnishings', 'Garden', 'Library', 'Afternoon Tea'],
        countryName: 'United States',
        provinceName: 'Massachusetts',
        cityName: 'Boston',
        openYear: '1890'
      }
    ];

    // Insert sample hotels
    const insertedHotels = await Hotel.insertMany(sampleHotels);
    console.log('5 sample hotels have been added to the database');

    // Create rooms for each hotel
    for (const hotel of insertedHotels) {
      const rooms = [
        {
          hotel: hotel._id,
          title: 'Standard Room',
          content: 'Comfortable room with all basic amenities.',
          price: hotel.price * 0.8,
          number: 10,
          beds: 1,
          size: 25,
          adults: 2,
          children: 1,
          status: 'active'
        },
        {
          hotel: hotel._id,
          title: 'Deluxe Room',
          content: 'Spacious room with premium amenities and city view.',
          price: hotel.price,
          number: 8,
          beds: 2,
          size: 35,
          adults: 2,
          children: 2,
          status: 'active'
        },
        {
          hotel: hotel._id,
          title: 'Suite',
          content: 'Luxurious suite with separate living area and panoramic views.',
          price: hotel.price * 1.5,
          number: 5,
          beds: 2,
          size: 50,
          adults: 4,
          children: 2,
          status: 'active'
        }
      ];

      await Room.insertMany(rooms);
    }

    console.log('Rooms have been added for each hotel');

  } catch (error) {
    console.error('Error seeding hotels and rooms:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedHotelsAndRooms();