const Hotel = require('../models/hotel');
const he = require('he');

exports.searchHotels = async (req, res) => {
    try {
        const { query = '', page = 1, limit = 9 } = req.query;
        const pageNumber = Math.max(1, parseInt(page));
        const pageSize = parseInt(limit);

        let filter = {};
        if (query && query.trim() !== '' && query !== 'All Hotels') {
            const searchTerms = query.trim().split(/\\s+/);
            const searchRegexes = searchTerms.map(term => new RegExp(term, 'i'));
            
            filter = {
                $and: searchRegexes.map(regex => ({
                    $or: [
                        { title: regex },
                        { name: regex },
                        { description: regex },
                        { location: regex }
                    ]
                }))
            };
        }

        const totalHotels = await Hotel.countDocuments(filter);
        const totalPages = Math.max(1, Math.ceil(totalHotels / pageSize));

        // Ensure the requested page number is not greater than the total number of pages
        const validPageNumber = Math.min(pageNumber, totalPages);

        let hotels = await Hotel.find(filter)
            .populate('rooms')
            .skip((validPageNumber - 1) * pageSize)
            .limit(pageSize);

        // Sort hotels in memory based on relevance
        hotels.sort((a, b) => {
            const aRelevance = calculateRelevance(a, query);
            const bRelevance = calculateRelevance(b, query);
            return bRelevance - aRelevance;
        });

        // Decode HTML entities and remove HTML tags from content
        const processedHotels = hotels.map(hotel => {
            if (hotel.content) {
                hotel.content = he.decode(hotel.content).replace(/<[^>]*>/g, '');
            }
            return hotel;
        });

        res.render('partials/searchResults', {
            hotels: processedHotels,
            query: query || 'All Hotels',
            currentPage: validPageNumber,
            totalPages: totalPages,
            he
        });
    } catch (error) {
        console.error('Error searching hotels:', error);
        res.status(500).send('Error searching hotels');
    }
};

function calculateRelevance(hotel, query) {
    const searchTerms = query.toLowerCase().split(/\\s+/);
    let relevance = 0;

    searchTerms.forEach(term => {
        if (hotel.title && hotel.title.toLowerCase().includes(term)) relevance += 3;
        if (hotel.name && hotel.name.toLowerCase().includes(term)) relevance += 3;
        if (hotel.description && hotel.description.toLowerCase().includes(term)) relevance += 2;
        if (hotel.location && hotel.location.toLowerCase().includes(term)) relevance += 1;
    });

    return relevance;
}

exports.registerHotel = async (req, res) => {
    try {
        const hotelData = req.body;
        
        // Validate required fields
        const requiredFields = [
            'title', 'slug', 'content', 'image_id', 'banner_image_id',
            'location_id', 'address', 'map_lat', 'map_lng', 'map_zoom',
            'star_rate', 'price', 'check_in_time', 'check_out_time', 'status'
        ];

        const missingFields = requiredFields.filter(field => !hotelData[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields: missingFields
            });
        }

        // Create a new hotel instance
        const newHotel = new Hotel(hotelData);

        // Save the hotel to the database
        await newHotel.save();

        res.status(201).json({
            success: true,
            message: 'Hotel registered successfully',
            data: newHotel
        });
    } catch (error) {
        console.error('Error registering hotel:', error);
        res.status(400).json({
            success: false,
            message: 'Error registering hotel',
            error: error.message
        });
    }
};

exports.getPromotions = async (req, res) => {
    try {
        const { type } = req.query;
        let hotels = [];
        let message = '';
        console.log("TYPE: ",type)
        if (type === 'FireSales' || type === 'EarlyBird' || type === 'Best Sellers') {
            hotels = await Hotel.find({ promotionType: type })
                .select('id title image_id star_rate facilityTags price slug promotionType content')
                .populate('rooms');
        } else if (type === 'Promotions') {
            message = '프로모션 준비중입니다';
        } else {
            // Default case: show all promotional hotels
            hotels = await Hotel.find({ promotionType: { $in: ['FireSales', 'EarlyBird', 'BestSellers'] } })
                .select('id title image_id star_rate facilityTags price slug promotionType content')
                .populate('rooms');
        }

        res.render('promotions/promotions', { 
            user: req.user, 
            hotels,
            promotionType: type,
            message
        });
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).send('Error fetching promotions');
    }
};