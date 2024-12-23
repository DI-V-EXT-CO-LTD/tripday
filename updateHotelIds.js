const mongoose = require('mongoose');
const Hotel = require('./models/hotel');

// Replace with your MongoDB connection string
const dbURI = 'mongodb://localhost:27017/tripday';

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

async function updateHotelIds() {
  try {
    const hotels = await Hotel.find({});
    
    for (const hotel of hotels) {
      if (!hotel.id || hotel.id.length !== 16) {
        hotel.id = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
        await hotel.save();
        console.log(`Updated hotel ${hotel.title} with new ID: ${hotel.id}`);
      }
    }

    console.log('All hotel IDs have been updated successfully.');
  } catch (error) {
    console.error('Error updating hotel IDs:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateHotelIds();