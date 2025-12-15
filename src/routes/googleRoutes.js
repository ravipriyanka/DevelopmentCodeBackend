const express = require('express');
const axios = require('axios');
const config = require('../config/config');
const { experimentalSetDeliveryMetricsExportedToBigQueryEnabled } = require('firebase/messaging/sw');

const router = express.Router();

// Google API base URL and key
const GOOGLE_BASE_URL = config.google.baseUrl;
const API_KEY = config.google.apiKey;

// Check if using mock data
const USE_MOCK = !API_KEY || API_KEY === 'your-google-api-key';

// Mock data for testing
const mockData = {
    hotels: [
        { 
            place_id: 'mock_1', 
            name: 'Grand Hyatt Dubai', 
            formatted_address: 'Dubai Creek, Dubai, UAE', 
            rating: 4.5, 
            user_ratings_total: 2500, 
            price_level: 4,
            geometry: { location: { lat: 25.2285, lng: 55.3273 } },
            types: ['lodging', 'hotel'],
            photos: [{ photo_reference: 'photo_1' }]
        },
        { 
            place_id: 'mock_2', 
            name: 'Burj Al Arab Jumeirah', 
            formatted_address: 'Jumeirah Beach Road, Dubai, UAE', 
            rating: 4.8, 
            user_ratings_total: 5000,
            price_level: 5,
            geometry: { location: { lat: 25.1412, lng: 55.1853 } },
            types: ['lodging', 'hotel'],
            photos: [{ photo_reference: 'photo_2' }]
        },
        { 
            place_id: 'mock_3', 
            name: 'Atlantis The Palm', 
            formatted_address: 'Palm Jumeirah, Dubai, UAE', 
            rating: 4.6, 
            user_ratings_total: 8000,
            price_level: 4,
            geometry: { location: { lat: 25.1304, lng: 55.1171 } },
            types: ['lodging', 'resort'],
            photos: [{ photo_reference: 'photo_3' }]
        },
        { 
            place_id: 'mock_4', 
            name: 'JW Marriott Marquis', 
            formatted_address: 'Business Bay, Dubai, UAE', 
            rating: 4.4, 
            user_ratings_total: 3200,
            price_level: 3,
            geometry: { location: { lat: 25.1891, lng: 55.2637 } },
            types: ['lodging', 'hotel'],
            photos: [{ photo_reference: 'photo_4' }]
        },
        { 
            place_id: 'mock_5', 
            name: 'Holiday Inn Express', 
            formatted_address: 'Internet City, Dubai, UAE', 
            rating: 4.0, 
            user_ratings_total: 1500,
            price_level: 2,
            geometry: { location: { lat: 25.0957, lng: 55.1541 } },
            types: ['lodging', 'hotel'],
            photos: [{ photo_reference: 'photo_5' }]
        }
    ],
    suggestions: [
        { place_id: 'city_1', description: 'Dubai, United Arab Emirates' },
        { place_id: 'city_2', description: 'Dubai Marina, Dubai, UAE' },
        { place_id: 'city_3', description: 'Dubai Mall, Dubai, UAE' },
        { place_id: 'city_4', description: 'Dublin, Ireland' },
        { place_id: 'city_5', description: 'Durban, South Africa' }
    ],
    offers: [
        { id: 1, title: '20% Off on First Booking', code: 'FIRST20', discount: 20, validUntil: '2024-12-31' },
        { id: 2, title: 'Weekend Special', code: 'WEEKEND15', discount: 15, validUntil: '2024-06-30' },
        { id: 3, title: 'Summer Sale', code: 'SUMMER25', discount: 25, validUntil: '2024-08-31' }
    ]
};


// ==================== HOME DASHBOARD ====================
// GET /api/google/home - Quick search data, suggestions, offers
router.get('/home', async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Home dashboard data',
            data: {
                popularDestinations: [
                    { name: 'Dubai', country: 'UAE', image: 'https://via.placeholder.com/300x200' },
                    { name: 'Paris', country: 'France', image: 'https://via.placeholder.com/300x200' },
                    { name: 'London', country: 'UK', image: 'https://via.placeholder.com/300x200' },
                    { name: 'New York', country: 'USA', image: 'https://via.placeholder.com/300x200' },
                    { name: 'Singapore', country: 'Singapore', image: 'https://via.placeholder.com/300x200' }
                ],
                offers: mockData.offers,
                quickLinks: [
                    { name: 'Last Minute Deals', icon: 'clock' },
                    { name: 'Top Rated Hotels', icon: 'star' },
                    { name: 'Budget Friendly', icon: 'dollar' },
                    { name: 'Luxury Stays', icon: 'crown' }
                ]
            }
        });
    } catch (error) {
        console.log('Error in home:', error.message);
        res.status(500).json({ success: false, message: 'Failed to get home data', error: error.message });
    }
});


// ==================== SEARCH WITH FILTERS ====================
// GET /api/google/search?query=hotels&minRating=4&maxPrice=3&amenities=wifi,pool
router.get('/search', async (req, res) => {
    try {
        const { query, minRating, maxPrice, amenities, type } = req.query;

        if (!query) {
            return res.status(400).json({ success: false, message: 'Query is required' });
        }

        // Mock data with filters
        if (USE_MOCK) {
            let hotels = [...mockData.hotels];

            // Apply filters
            if (minRating) {
                hotels = hotels.filter(h => h.rating >= parseFloat(minRating));
            }
            if (maxPrice) {
                hotels = hotels.filter(h => h.price_level <= parseInt(maxPrice));
            }

            return res.json({
                success: true,
                message: 'Hotels found (MOCK DATA)',
                mock: true,
                filters: { minRating, maxPrice, amenities, type },
                count: hotels.length,
                data: hotels
            });
        }

        const response = await axios.get(`${GOOGLE_BASE_URL}/textsearch/json`, {
            params: {
                query: query,
                type: type || 'lodging',
                key: API_KEY
            }
        });

        let hotels = response.data.results || [];

        // Apply filters
        if (minRating) {
            hotels = hotels.filter(h => h.rating >= parseFloat(minRating));
        }
        if (maxPrice) {
            hotels = hotels.filter(h => (h.price_level || 3) <= parseInt(maxPrice));
        }

        res.json({
            success: true,
            message: 'Hotels found',
            filters: { minRating, maxPrice, amenities, type },
            count: hotels.length,
            data: hotels
        });

    } catch (error) {
        console.log('Error in search:', error.message);
        res.status(500).json({ success: false, message: 'Failed to search', error: error.message });
    }
});


// ==================== AUTOCOMPLETE / SUGGESTIONS ====================
// GET /api/google/autocomplete?input=dub
router.get('/autocomplete', async (req, res) => {
    try {
        const { input } = req.query;

        if (!input) {
            return res.status(400).json({ success: false, message: 'Input is required' });
        }

        if (USE_MOCK) {
            const filtered = mockData.suggestions.filter(s => 
                s.description.toLowerCase().includes(input.toLowerCase())
            );
            return res.json({
                success: true,
                message: 'Suggestions found (MOCK DATA)',
                mock: true,
                data: filtered
            });
        }

        const response = await axios.get(`${GOOGLE_BASE_URL}/autocomplete/json`, {
            params: {
                input: input,
                types: '(cities)',
                key: API_KEY
            }
        });

        const suggestions = response.data.predictions.map(item => ({
            placeId: item.place_id,
            description: item.description
        }));

        res.json({
            success: true,
            message: 'Suggestions found',
            data: suggestions
        });

    } catch (error) {
        console.log('Error in autocomplete:', error.message);
        res.status(500).json({ success: false, message: 'Failed to get suggestions', error: error.message });
    }
});


// ==================== HOTEL DETAILS PAGE ====================
// GET /api/google/details/:placeId - Photos, amenities, policies, map, reviews
router.get('/details/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;

        if (USE_MOCK) {
            const hotel = mockData.hotels.find(h => h.place_id === placeId) || mockData.hotels[0];
            return res.json({
                success: true,
                message: 'Hotel details (MOCK DATA)',
                mock: true,
                data: {
                    placeId: hotel.place_id,
                    name: hotel.name,
                    address: hotel.formatted_address,
                    rating: hotel.rating,
                    totalReviews: hotel.user_ratings_total,
                    priceLevel: hotel.price_level,
                    location: hotel.geometry.location,
                    
                    // Photos
                    photos: [
                        { url: 'https://via.placeholder.com/800x600', caption: 'Hotel Exterior' },
                        { url: 'https://via.placeholder.com/800x600', caption: 'Lobby' },
                        { url: 'https://via.placeholder.com/800x600', caption: 'Room' },
                        { url: 'https://via.placeholder.com/800x600', caption: 'Pool' },
                        { url: 'https://via.placeholder.com/800x600', caption: 'Restaurant' }
                    ],
                    
                    // Amenities
                    amenities: [
                        { name: 'Free WiFi', icon: 'wifi', available: true },
                        { name: 'Swimming Pool', icon: 'pool', available: true },
                        { name: 'Gym', icon: 'fitness', available: true },
                        { name: 'Spa', icon: 'spa', available: true },
                        { name: 'Restaurant', icon: 'restaurant', available: true },
                        { name: 'Bar', icon: 'bar', available: true },
                        { name: 'Room Service', icon: 'room_service', available: true },
                        { name: 'Parking', icon: 'parking', available: true },
                        { name: 'Airport Shuttle', icon: 'shuttle', available: false },
                        { name: 'Pet Friendly', icon: 'pets', available: false }
                    ],
                    
                    // Policies
                    policies: {
                        checkIn: '3:00 PM',
                        checkOut: '12:00 PM',
                        cancellation: 'Free cancellation up to 24 hours before check-in',
                        payment: 'Pay at property or prepay online',
                        children: 'Children of all ages are welcome',
                        pets: 'Pets are not allowed',
                        smoking: 'Non-smoking rooms available'
                    },
                    
                    // Map
                    map: {
                        latitude: hotel.geometry.location.lat,
                        longitude: hotel.geometry.location.lng,
                        nearbyPlaces: [
                            { name: 'Dubai Mall', distance: '2.5 km' },
                            { name: 'Burj Khalifa', distance: '3 km' },
                            { name: 'Dubai Airport', distance: '15 km' }
                        ]
                    },
                    
                    // Reviews
                    reviews: [
                        { author: 'John D.', rating: 5, text: 'Amazing hotel! Great service and beautiful rooms.', date: '2024-01-15' },
                        { author: 'Sarah M.', rating: 4, text: 'Very clean and comfortable. Would recommend.', date: '2024-01-10' },
                        { author: 'Mike R.', rating: 5, text: 'Best hotel I\'ve ever stayed at!', date: '2024-01-05' }
                    ],
                    
                    contact: {
                        phone: '+971 4 123 4567',
                        email: 'info@hotel.com',
                        website: 'https://www.hotel.com'
                    }
                }
            });
        }

        const response = await axios.get(`${GOOGLE_BASE_URL}/details/json`, {
            params: {
                place_id: placeId,
                fields: 'name,formatted_address,geometry,rating,user_ratings_total,photos,reviews,website,formatted_phone_number,opening_hours,price_level,types',
                key: API_KEY
            }
        });

        const place = response.data.result;

        res.json({
            success: true,
            message: 'Hotel details found',
            data: {
                placeId: placeId,
                name: place.name,
                address: place.formatted_address,
                rating: place.rating,
                totalReviews: place.user_ratings_total,
                priceLevel: place.price_level,
                location: place.geometry?.location,
                photos: place.photos?.map(p => ({
                    reference: p.photo_reference,
                    url: `${GOOGLE_BASE_URL}/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${API_KEY}`
                })),
                reviews: place.reviews?.map(r => ({
                    author: r.author_name,
                    rating: r.rating,
                    text: r.text,
                    date: r.relative_time_description
                })),
                contact: {
                    phone: place.formatted_phone_number,
                    website: place.website
                },
                openingHours: place.opening_hours?.weekday_text
            }
        });

    } catch (error) {
        console.log('Error in details:', error.message);
        res.status(500).json({ success: false, message: 'Failed to get details', error: error.message });
    }
});


// ==================== NEARBY HOTELS ====================
// GET /api/google/nearby?lat=25.2048&lng=55.2708&radius=5000
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
        }

        if (USE_MOCK) {
            return res.json({
                success: true,
                message: 'Nearby hotels (MOCK DATA)',
                mock: true,
                count: mockData.hotels.length,
                data: mockData.hotels.map(h => ({
                    placeId: h.place_id,
                    name: h.name,
                    address: h.formatted_address,
                    rating: h.rating,
                    totalRatings: h.user_ratings_total,
                    priceLevel: h.price_level,
                    location: h.geometry.location
                }))
            });
        }

        const response = await axios.get(`${GOOGLE_BASE_URL}/nearbysearch/json`, {
            params: {
                location: `${lat},${lng}`,
                radius: radius,
                type: 'lodging',
                key: API_KEY
            }
        });

        const hotels = response.data.results.map(hotel => ({
            placeId: hotel.place_id,
            name: hotel.name,
            address: hotel.vicinity,
            rating: hotel.rating,
            totalRatings: hotel.user_ratings_total,
            priceLevel: hotel.price_level,
            location: hotel.geometry.location,
            isOpen: hotel.opening_hours?.open_now
        }));

        res.json({
            success: true,
            message: 'Nearby hotels found',
            count: hotels.length,
            data: hotels
        });

    } catch (error) {
        console.log('Error in nearby:', error.message);
        res.status(500).json({ success: false, message: 'Failed to find nearby hotels', error: error.message });
    }
});


// ==================== GET PHOTO ====================
// GET /api/google/photo?reference=xxx&maxwidth=400
router.get('/photo', async (req, res) => {
    try {
        const { reference, maxwidth = 400 } = req.query;

        if (!reference) {
            return res.status(400).json({ success: false, message: 'Photo reference is required' });
        }

        const photoUrl = `${GOOGLE_BASE_URL}/photo?maxwidth=${maxwidth}&photo_reference=${reference}&key=${API_KEY}`;

        res.json({
            success: true,
            message: 'Photo URL generated',
            data: { url: photoUrl }
        });

    } catch (error) {
        console.log('Error in photo:', error.message);
        res.status(500).json({ success: false, message: 'Failed to get photo', error: error.message });
    }
});


// ==================== GET OFFERS ====================
// GET /api/google/offers
router.get('/offers', (req, res) => {
    res.json({
        success: true,
        message: 'Current offers',
        data: mockData.offers
    });
});


module.exports = router;



