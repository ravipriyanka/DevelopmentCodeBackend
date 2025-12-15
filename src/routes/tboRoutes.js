const express = require('express');
const axios = require('axios');
const config = require('../config/config');

const router = express.Router();

// TBO API config
const TBO_URL = config.tbo.apiUrl;
const TBO_USERNAME = config.tbo.username;
const TBO_PASSWORD = config.tbo.password;
const TBO_CLIENT_ID = config.tbo.clientId;

// Check if using mock data
const USE_MOCK = !TBO_USERNAME || TBO_USERNAME === 'your-tbo-username';

// TBO credentials
const getCredentials = () => ({
    UserName: TBO_USERNAME,
    Password: TBO_PASSWORD,
    ClientId: TBO_CLIENT_ID
});

// Mock data for testing
const mockTboData = {
    hotels: [
        { 
            hotelCode: 'TBO001', 
            name: 'Hilton Dubai Creek', 
            starRating: 5, 
            address: 'Baniyas Road, Deira', 
            city: 'Dubai', 
            country: 'UAE', 
            price: 250, 
            currency: 'USD', 
            image: 'https://via.placeholder.com/300x200',
            amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant'],
            rating: 4.5,
            reviewCount: 2500
        },
        { 
            hotelCode: 'TBO002', 
            name: 'Ritz Carlton Dubai', 
            starRating: 5, 
            address: 'JBR Walk', 
            city: 'Dubai', 
            country: 'UAE', 
            price: 450, 
            currency: 'USD', 
            image: 'https://via.placeholder.com/300x200',
            amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'beach'],
            rating: 4.8,
            reviewCount: 3200
        },
        { 
            hotelCode: 'TBO003', 
            name: 'Marriott Al Jaddaf', 
            starRating: 4, 
            address: 'Al Jaddaf', 
            city: 'Dubai', 
            country: 'UAE', 
            price: 180, 
            currency: 'USD', 
            image: 'https://via.placeholder.com/300x200',
            amenities: ['wifi', 'pool', 'gym', 'restaurant'],
            rating: 4.3,
            reviewCount: 1800
        },
        { 
            hotelCode: 'TBO004', 
            name: 'Sheraton Grand Dubai', 
            starRating: 5, 
            address: 'Sheikh Zayed Road', 
            city: 'Dubai', 
            country: 'UAE', 
            price: 320, 
            currency: 'USD', 
            image: 'https://via.placeholder.com/300x200',
            amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar'],
            rating: 4.6,
            reviewCount: 2100
        },
        { 
            hotelCode: 'TBO005', 
            name: 'Holiday Inn Express', 
            starRating: 3, 
            address: 'Internet City', 
            city: 'Dubai', 
            country: 'UAE', 
            price: 120, 
            currency: 'USD', 
            image: 'https://via.placeholder.com/300x200',
            amenities: ['wifi', 'gym', 'restaurant'],
            rating: 4.0,
            reviewCount: 950
        }
    ],
    rooms: [
        { 
            roomIndex: 1, 
            roomCode: 'STD', 
            roomType: 'Standard Room', 
            mealType: 'Room Only', 
            bedType: 'King', 
            maxOccupancy: 2,
            roomSize: '30 sqm',
            price: 150, 
            taxAmount: 15,
            totalPrice: 165,
            currency: 'USD', 
            isRefundable: true,
            cancellationPolicy: 'Free cancellation until 24 hours before check-in',
            amenities: ['wifi', 'tv', 'minibar', 'safe'],
            images: ['https://via.placeholder.com/400x300'],
            addOns: [
                { name: 'Breakfast', price: 25 },
                { name: 'Airport Transfer', price: 50 },
                { name: 'Late Checkout', price: 30 }
            ]
        },
        { 
            roomIndex: 2, 
            roomCode: 'DLX', 
            roomType: 'Deluxe Room', 
            mealType: 'Breakfast Included', 
            bedType: 'King', 
            maxOccupancy: 2,
            roomSize: '40 sqm',
            price: 220, 
            taxAmount: 22,
            totalPrice: 242,
            currency: 'USD', 
            isRefundable: true,
            cancellationPolicy: 'Free cancellation until 48 hours before check-in',
            amenities: ['wifi', 'tv', 'minibar', 'safe', 'bathtub', 'balcony'],
            images: ['https://via.placeholder.com/400x300'],
            addOns: [
                { name: 'Airport Transfer', price: 50 },
                { name: 'Late Checkout', price: 30 },
                { name: 'Spa Access', price: 40 }
            ]
        },
        { 
            roomIndex: 3, 
            roomCode: 'SUI', 
            roomType: 'Executive Suite', 
            mealType: 'Half Board', 
            bedType: 'King', 
            maxOccupancy: 4,
            roomSize: '65 sqm',
            price: 380, 
            taxAmount: 38,
            totalPrice: 418,
            currency: 'USD', 
            isRefundable: false,
            cancellationPolicy: 'Non-refundable',
            amenities: ['wifi', 'tv', 'minibar', 'safe', 'bathtub', 'balcony', 'living_room', 'kitchenette'],
            images: ['https://via.placeholder.com/400x300'],
            addOns: [
                { name: 'Airport Transfer', price: 50 },
                { name: 'Butler Service', price: 100 }
            ]
        }
    ],
    cities: {
        AE: [
            { code: 'DXB', name: 'Dubai' },
            { code: 'AUH', name: 'Abu Dhabi' },
            { code: 'SHJ', name: 'Sharjah' }
        ],
        IN: [
            { code: 'DEL', name: 'New Delhi' },
            { code: 'BOM', name: 'Mumbai' },
            { code: 'BLR', name: 'Bangalore' }
        ]
    }
};


// ==================== SEARCH HOTELS WITH FILTERS ====================
// POST /api/tbo/search
router.post('/search', async (req, res) => {
    try {
        const { 
            cityCode, 
            checkIn, 
            checkOut, 
            rooms, 
            nationality = 'IN',
            // Filters
            minPrice,
            maxPrice,
            minRating,
            starRating,
            amenities,
            roomType
        } = req.body;

        if (!cityCode || !checkIn || !checkOut || !rooms) {
            return res.status(400).json({
                success: false,
                message: 'cityCode, checkIn, checkOut and rooms are required'
            });
        }

        if (USE_MOCK) {
            let hotels = [...mockTboData.hotels];

            // Apply filters
            if (minPrice) hotels = hotels.filter(h => h.price >= minPrice);
            if (maxPrice) hotels = hotels.filter(h => h.price <= maxPrice);
            if (minRating) hotels = hotels.filter(h => h.rating >= minRating);
            if (starRating) hotels = hotels.filter(h => h.starRating >= starRating);
            if (amenities) {
                const requiredAmenities = amenities.split(',');
                hotels = hotels.filter(h => 
                    requiredAmenities.every(a => h.amenities.includes(a.trim()))
                );
            }

            return res.json({
                success: true,
                message: 'Hotels found (MOCK DATA)',
                mock: true,
                searchId: 'MOCK_SEARCH_' + Date.now(),
                filters: { minPrice, maxPrice, minRating, starRating, amenities, roomType },
                count: hotels.length,
                data: hotels
            });
        }

        const requestBody = {
            Credentials: getCredentials(),
            CityCode: cityCode,
            CheckInDate: checkIn,
            CheckOutDate: checkOut,
            GuestNationality: nationality,
            PaxRooms: rooms.map(room => ({
                Adults: room.adults,
                Children: room.children || 0,
                ChildrenAges: room.childrenAges || []
            })),
            ResponseTime: 30,
            IsDetailedResponse: true,
            Filters: {
                MinPrice: minPrice,
                MaxPrice: maxPrice,
                MinHotelRating: minRating,
                StarRating: starRating
            }
        };

        const response = await axios.post(`${TBO_URL}/HotelSearch`, requestBody);

        let hotels = (response.data.Hotels || []).map(hotel => ({
            hotelCode: hotel.HotelCode,
            name: hotel.HotelName,
            starRating: hotel.StarRating,
            address: hotel.HotelAddress,
            city: hotel.CityName,
            country: hotel.CountryName,
            price: hotel.MinPrice,
            currency: hotel.Currency,
            image: hotel.MainImage,
            amenities: hotel.Facilities || [],
            rating: hotel.TripAdvisorRating,
            reviewCount: hotel.TripAdvisorReviewCount
        }));

        res.json({
            success: true,
            message: 'Hotels found',
            searchId: response.data.SearchId,
            filters: { minPrice, maxPrice, minRating, starRating, amenities, roomType },
            count: hotels.length,
            data: hotels
        });

    } catch (error) {
        console.log('Error in hotel search:', error.message);
        res.status(500).json({ success: false, message: 'Failed to search hotels', error: error.message });
    }
});


// ==================== HOTEL DETAILS - Photos, Amenities, Policies, Map, Reviews ====================
// POST /api/tbo/details
router.post('/details', async (req, res) => {
    try {
        const { hotelCode, searchId } = req.body;

        if (!hotelCode) {
            return res.status(400).json({ success: false, message: 'hotelCode is required' });
        }

        if (USE_MOCK) {
            const hotel = mockTboData.hotels.find(h => h.hotelCode === hotelCode) || mockTboData.hotels[0];
            return res.json({
                success: true,
                message: 'Hotel details (MOCK DATA)',
                mock: true,
                data: {
                    hotelCode: hotel.hotelCode,
                    name: hotel.name,
                    starRating: hotel.starRating,
                    address: hotel.address,
                    city: hotel.city,
                    country: hotel.country,
                    description: 'A luxurious hotel offering world-class amenities and exceptional service in the heart of the city.',
                    
                    // Photos
                    photos: [
                        { url: 'https://via.placeholder.com/800x600', type: 'exterior', caption: 'Hotel Exterior' },
                        { url: 'https://via.placeholder.com/800x600', type: 'lobby', caption: 'Grand Lobby' },
                        { url: 'https://via.placeholder.com/800x600', type: 'room', caption: 'Deluxe Room' },
                        { url: 'https://via.placeholder.com/800x600', type: 'pool', caption: 'Swimming Pool' },
                        { url: 'https://via.placeholder.com/800x600', type: 'restaurant', caption: 'Restaurant' }
                    ],
                    
                    // Amenities
                    amenities: [
                        { code: 'wifi', name: 'Free WiFi', category: 'general' },
                        { code: 'pool', name: 'Swimming Pool', category: 'recreation' },
                        { code: 'gym', name: 'Fitness Center', category: 'recreation' },
                        { code: 'spa', name: 'Spa & Wellness', category: 'recreation' },
                        { code: 'restaurant', name: 'Restaurant', category: 'dining' },
                        { code: 'bar', name: 'Bar/Lounge', category: 'dining' },
                        { code: 'room_service', name: '24/7 Room Service', category: 'service' },
                        { code: 'concierge', name: 'Concierge', category: 'service' },
                        { code: 'parking', name: 'Valet Parking', category: 'transport' },
                        { code: 'shuttle', name: 'Airport Shuttle', category: 'transport' }
                    ],
                    
                    // Policies
                    policies: {
                        checkIn: { time: '3:00 PM', earlyCheckIn: 'Subject to availability, extra charges may apply' },
                        checkOut: { time: '12:00 PM', lateCheckOut: 'Subject to availability, extra charges may apply' },
                        cancellation: {
                            freeCancellation: true,
                            deadline: '24 hours before check-in',
                            penalty: 'First night charge for late cancellation'
                        },
                        payment: {
                            methods: ['Credit Card', 'Debit Card', 'PayPal'],
                            prepayment: 'Required at booking',
                            deposit: 'No deposit required'
                        },
                        children: {
                            allowed: true,
                            policy: 'Children of all ages are welcome',
                            extraBed: 'Available on request ($30/night)'
                        },
                        pets: { allowed: false, policy: 'Pets are not allowed' },
                        smoking: { allowed: false, policy: 'Non-smoking property' }
                    },
                    
                    // Map/Location
                    location: {
                        latitude: 25.2285,
                        longitude: 55.3273,
                        nearbyAttractions: [
                            { name: 'Dubai Mall', distance: '2.5 km', duration: '10 min' },
                            { name: 'Burj Khalifa', distance: '3 km', duration: '12 min' },
                            { name: 'Dubai Creek', distance: '0.5 km', duration: '5 min' }
                        ],
                        airports: [
                            { name: 'Dubai International Airport (DXB)', distance: '12 km', duration: '20 min' },
                            { name: 'Al Maktoum Airport (DWC)', distance: '45 km', duration: '40 min' }
                        ]
                    },
                    
                    // Reviews
                    reviews: {
                        averageRating: hotel.rating,
                        totalReviews: hotel.reviewCount,
                        breakdown: {
                            cleanliness: 4.7,
                            service: 4.6,
                            location: 4.8,
                            value: 4.3,
                            comfort: 4.5
                        },
                        recentReviews: [
                            { author: 'John D.', rating: 5, title: 'Excellent Stay!', comment: 'Amazing service and beautiful rooms.', date: '2024-01-15' },
                            { author: 'Sarah M.', rating: 4, title: 'Great Location', comment: 'Perfect location, very clean.', date: '2024-01-10' },
                            { author: 'Ahmed K.', rating: 5, title: 'Highly Recommend', comment: 'Best hotel experience ever!', date: '2024-01-05' }
                        ]
                    },
                    
                    contact: {
                        phone: '+971 4 123 4567',
                        email: 'reservations@hotel.com',
                        website: 'https://www.hotel.com'
                    }
                }
            });
        }

        const requestBody = {
            Credentials: getCredentials(),
            HotelCode: hotelCode,
            SearchId: searchId
        };

        const response = await axios.post(`${TBO_URL}/HotelDetails`, requestBody);

        res.json({
            success: true,
            message: 'Hotel details found',
            data: response.data.HotelDetails
        });

    } catch (error) {
        console.log('Error in hotel details:', error.message);
        res.status(500).json({ success: false, message: 'Failed to get hotel details', error: error.message });
    }
});


// ==================== ROOM SELECTION - Availability, Price Breakdown, Add-ons ====================
// POST /api/tbo/rooms
router.post('/rooms', async (req, res) => {
    try {
        const { hotelCode, searchId, checkIn, checkOut, rooms, nationality = 'IN' } = req.body;

        if (!hotelCode || !checkIn || !checkOut || !rooms) {
            return res.status(400).json({
                success: false,
                message: 'hotelCode, checkIn, checkOut and rooms are required'
            });
        }

        // Calculate nights
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

        if (USE_MOCK) {
            const roomsWithPricing = mockTboData.rooms.map(room => ({
                ...room,
                nights: nights,
                priceBreakdown: {
                    basePrice: room.price,
                    taxAmount: room.taxAmount,
                    totalPerNight: room.totalPrice,
                    totalStay: room.totalPrice * nights,
                    currency: room.currency
                },
                availability: {
                    available: true,
                    roomsLeft: Math.floor(Math.random() * 5) + 1
                }
            }));

            return res.json({
                success: true,
                message: 'Room rates (MOCK DATA)',
                mock: true,
                hotelCode: hotelCode,
                checkIn: checkIn,
                checkOut: checkOut,
                nights: nights,
                count: roomsWithPricing.length,
                data: roomsWithPricing
            });
        }

        const requestBody = {
            Credentials: getCredentials(),
            HotelCode: hotelCode,
            SearchId: searchId,
            CheckInDate: checkIn,
            CheckOutDate: checkOut,
            GuestNationality: nationality,
            PaxRooms: rooms.map(room => ({
                Adults: room.adults,
                Children: room.children || 0,
                ChildrenAges: room.childrenAges || []
            }))
        };

        const response = await axios.post(`${TBO_URL}/RoomRates`, requestBody);

        const roomsList = (response.data.Rooms || []).map(room => ({
            roomIndex: room.RoomIndex,
            roomCode: room.RoomCode,
            roomType: room.RoomTypeName,
            mealType: room.MealType,
            bedType: room.BedType,
            maxOccupancy: room.MaxOccupancy,
            priceBreakdown: {
                basePrice: room.BasePrice,
                taxAmount: room.TaxAmount,
                totalPerNight: room.TotalPrice / nights,
                totalStay: room.TotalPrice,
                currency: room.Currency
            },
            isRefundable: room.IsRefundable,
            cancellationPolicy: room.CancellationPolicy,
            amenities: room.RoomFacilities,
            availability: {
                available: room.IsAvailable,
                roomsLeft: room.AvailableRooms
            }
        }));

        res.json({
            success: true,
            message: 'Room rates found',
            hotelCode: hotelCode,
            checkIn: checkIn,
            checkOut: checkOut,
            nights: nights,
            count: roomsList.length,
            data: roomsList
        });

    } catch (error) {
        console.log('Error in room rates:', error.message);
        res.status(500).json({ success: false, message: 'Failed to get room rates', error: error.message });
    }
});


// ==================== PRE-BOOK ====================
// POST /api/tbo/prebook
router.post('/prebook', async (req, res) => {
    try {
        const { searchId, hotelCode, roomIndex, ratePlanCode } = req.body;

        if (!searchId || !hotelCode || !roomIndex || !ratePlanCode) {
            return res.status(400).json({
                success: false,
                message: 'searchId, hotelCode, roomIndex and ratePlanCode are required'
            });
        }

        if (USE_MOCK) {
            const room = mockTboData.rooms.find(r => r.roomIndex === roomIndex) || mockTboData.rooms[0];
            return res.json({
                success: true,
                message: 'Pre-booking successful (MOCK DATA)',
                mock: true,
                data: {
                    preBookId: 'PREBOOK_' + Date.now(),
                    hotelCode: hotelCode,
                    roomType: room.roomType,
                    mealType: room.mealType,
                    priceBreakdown: {
                        basePrice: room.price,
                        taxAmount: room.taxAmount,
                        totalPrice: room.totalPrice,
                        currency: room.currency
                    },
                    cancellationPolicy: {
                        isRefundable: room.isRefundable,
                        policy: room.cancellationPolicy,
                        deadline: '2024-03-01 15:00:00'
                    },
                    deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
                }
            });
        }

        const requestBody = {
            Credentials: getCredentials(),
            SearchId: searchId,
            HotelCode: hotelCode,
            RoomIndex: roomIndex,
            RatePlanCode: ratePlanCode
        };

        const response = await axios.post(`${TBO_URL}/PreBook`, requestBody);

        res.json({
            success: true,
            message: 'Pre-booking successful',
            data: {
                preBookId: response.data.PreBookId,
                totalPrice: response.data.TotalPrice,
                currency: response.data.Currency,
                cancellationPolicy: response.data.CancellationPolicy,
                deadline: response.data.Deadline
            }
        });

    } catch (error) {
        console.log('Error in prebook:', error.message);
        res.status(500).json({ success: false, message: 'Failed to pre-book', error: error.message });
    }
});


// ==================== BOOKING FLOW - Guest Details, Payment Summary, Cancellation ====================
// POST /api/tbo/book
router.post('/book', async (req, res) => {
    try {
        const { preBookId, guests, specialRequest, paymentMethod } = req.body;

        if (!preBookId || !guests || guests.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'preBookId and guests are required'
            });
        }

        if (USE_MOCK) {
            const bookingId = 'BK' + Date.now();
            const room = mockTboData.rooms[0];
            
            return res.json({
                success: true,
                message: 'Booking confirmed (MOCK DATA)',
                mock: true,
                data: {
                    bookingId: bookingId,
                    confirmationNumber: 'CNF' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                    status: 'CONFIRMED',
                    
                    // Guest Details
                    guestDetails: {
                        leadGuest: guests[0],
                        additionalGuests: guests.slice(1),
                        totalGuests: guests.length
                    },
                    
                    // Booking Summary
                    bookingSummary: {
                        hotelName: 'Hilton Dubai Creek',
                        roomType: room.roomType,
                        mealType: room.mealType,
                        checkIn: '2024-03-01',
                        checkOut: '2024-03-05',
                        nights: 4,
                        rooms: 1
                    },
                    
                    // Payment Summary
                    paymentSummary: {
                        roomCharges: room.price * 4,
                        taxes: room.taxAmount * 4,
                        totalAmount: room.totalPrice * 4,
                        currency: room.currency,
                        paymentMethod: paymentMethod || 'Credit Card',
                        paymentStatus: 'PAID'
                    },
                    
                    // Cancellation Policy
                    cancellationPolicy: {
                        isRefundable: room.isRefundable,
                        freeCancellationDeadline: '2024-02-28 23:59:59',
                        cancellationCharges: [
                            { period: 'Before Feb 28', charge: 'Free' },
                            { period: 'Feb 28 - Mar 1', charge: '50% of total' },
                            { period: 'After Mar 1', charge: '100% of total' }
                        ]
                    },
                    
                    specialRequest: specialRequest || '',
                    createdAt: new Date().toISOString()
                }
            });
        }

        const requestBody = {
            Credentials: getCredentials(),
            PreBookId: preBookId,
            ClientReferenceNumber: `BK-${Date.now()}`,
            Passengers: guests.map((guest, index) => ({
                Title: guest.title || 'Mr',
                FirstName: guest.firstName,
                LastName: guest.lastName,
                Email: guest.email,
                Phone: guest.phone,
                IsLeadPassenger: index === 0
            })),
            SpecialRequest: specialRequest || ''
        };

        const response = await axios.post(`${TBO_URL}/Book`, requestBody);

        res.json({
            success: true,
            message: 'Booking confirmed',
            data: {
                bookingId: response.data.BookingId,
                confirmationNumber: response.data.ConfirmationNumber,
                status: response.data.BookingStatus,
                hotelName: response.data.HotelName,
                checkIn: response.data.CheckInDate,
                checkOut: response.data.CheckOutDate,
                totalPrice: response.data.TotalPrice,
                currency: response.data.Currency
            }
        });

    } catch (error) {
        console.log('Error in booking:', error.message);
        res.status(500).json({ success: false, message: 'Failed to confirm booking', error: error.message });
    }
});


// ==================== CANCEL BOOKING ====================
// POST /api/tbo/cancel
router.post('/cancel', async (req, res) => {
    try {
        const { bookingId, remarks } = req.body;

        if (!bookingId) {
            return res.status(400).json({ success: false, message: 'bookingId is required' });
        }

        if (USE_MOCK) {
            return res.json({
                success: true,
                message: 'Booking cancelled (MOCK DATA)',
                mock: true,
                data: {
                    bookingId: bookingId,
                    cancellationId: 'CAN' + Date.now(),
                    status: 'CANCELLED',
                    refundAmount: 500,
                    cancellationCharges: 0,
                    currency: 'USD',
                    remarks: remarks || 'Cancelled by user'
                }
            });
        }

        const requestBody = {
            Credentials: getCredentials(),
            BookingId: bookingId,
            RequestType: 'Cancel',
            Remarks: remarks || 'Cancellation requested'
        };

        const response = await axios.post(`${TBO_URL}/CancelBooking`, requestBody);

        res.json({
            success: true,
            message: 'Booking cancelled',
            data: {
                bookingId: bookingId,
                cancellationId: response.data.CancellationId,
                refundAmount: response.data.RefundAmount,
                cancellationCharges: response.data.CancellationCharges
            }
        });

    } catch (error) {
        console.log('Error in cancel:', error.message);
        res.status(500).json({ success: false, message: 'Failed to cancel booking', error: error.message });
    }
});


// ==================== BOOKING DETAILS ====================
// GET /api/tbo/booking/:bookingId
router.get('/booking/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;

        if (USE_MOCK) {
            return res.json({
                success: true,
                message: 'Booking details (MOCK DATA)',
                mock: true,
                data: {
                    bookingId: bookingId,
                    confirmationNumber: 'CNF123456',
                    status: 'CONFIRMED',
                    hotelName: 'Hilton Dubai Creek',
                    checkIn: '2024-03-01',
                    checkOut: '2024-03-05',
                    roomType: 'Deluxe Room',
                    guests: [{ firstName: 'John', lastName: 'Doe', email: 'john@test.com' }],
                    totalAmount: 968,
                    currency: 'USD'
                }
            });
        }

        const requestBody = {
            Credentials: getCredentials(),
            BookingId: bookingId
        };

        const response = await axios.post(`${TBO_URL}/BookingDetails`, requestBody);

        res.json({
            success: true,
            message: 'Booking details found',
            data: response.data.BookingDetails
        });

    } catch (error) {
        console.log('Error in booking details:', error.message);
        res.status(500).json({ success: false, message: 'Failed to get booking details', error: error.message });
    }
});


// ==================== GET CITIES ====================
// GET /api/tbo/cities/:countryCode
router.get('/cities/:countryCode', async (req, res) => {
    try {
        const { countryCode } = req.params;
        const code = countryCode.toUpperCase();

        if (USE_MOCK) {
            const cities = mockTboData.cities[code] || [];
            return res.json({
                success: true,
                message: 'Cities found (MOCK DATA)',
                mock: true,
                count: cities.length,
                data: cities
            });
        }

        const requestBody = {
            Credentials: getCredentials(),
            CountryCode: code
        };

        const response = await axios.post(`${TBO_URL}/CityList`, requestBody);

        res.json({
            success: true,
            message: 'Cities found',
            count: response.data.Cities?.length || 0,
            data: response.data.Cities || []
        });

    } catch (error) {
        console.log('Error in cities:', error.message);
        res.status(500).json({ success: false, message: 'Failed to get cities', error: error.message });
    }
});


// ==================== GET COUNTRIES ====================
// GET /api/tbo/countries
router.get('/countries', (req, res) => {
    const countries = [
        { code: 'AE', name: 'United Arab Emirates' },
        { code: 'IN', name: 'India' },
        { code: 'US', name: 'United States' },
        { code: 'GB', name: 'United Kingdom' },
        { code: 'SG', name: 'Singapore' },
        { code: 'TH', name: 'Thailand' },
        { code: 'MY', name: 'Malaysia' },
        { code: 'FR', name: 'France' },
        { code: 'DE', name: 'Germany' },
        { code: 'AU', name: 'Australia' }
    ];

    res.json({
        success: true,
        message: 'Countries list',
        data: countries
    });
});

// CHECK-IN / CHECK-OUT
router.post('/checkin-checkout', (req, res) => {
    const { hotelCode } = req.body;

    if (!hotelCode) {
        return res.json({
            success: false,
            message: "hotelCode is missing"
        });
    }

    // Mock response (just simple data)
    return res.json({
        success: true,
        message: "Check-in / Check-out info",
        data: {
            checkIn: "3:00 PM",
            earlyCheckIn: "Extra charges apply",
            checkOut: "12:00 PM",
            lateCheckOut: "Extra charges apply"
        }
    });
});

module.exports = router;
