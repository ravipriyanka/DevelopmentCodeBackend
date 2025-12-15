

# Hotel API

Simple Hotel API with Google Maps and TBO integration.

## Project Structure

```
hotel-api/
├── src/
│   ├── config/
│   │   └── config.js
│   ├── routes/
│   │   ├── googleRoutes.js
│   │   └── tboRoutes.js
│   └── server.js
├── .env
├── package.json
└── README.md
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp env.example .env
```

3. Add your API keys in `.env`

4. Start server:
```bash
npm run dev
```

## API Endpoints

### Google Maps API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/google/search?query=hotels in dubai` | Search places |
| GET | `/api/google/autocomplete?input=dub` | Get autocomplete suggestions |
| GET | `/api/google/details/:placeId` | Get place details |
| GET | `/api/google/nearby?lat=25.2&lng=55.2&radius=5000` | Find nearby hotels |
| GET | `/api/google/photo?reference=xxx` | Get photo URL |

### TBO API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tbo/search` | Search hotels |
| POST | `/api/tbo/details` | Get hotel details |
| POST | `/api/tbo/rooms` | Get room rates |
| POST | `/api/tbo/prebook` | Pre-book room |
| POST | `/api/tbo/book` | Confirm booking |
| POST | `/api/tbo/cancel` | Cancel booking |
| GET | `/api/tbo/booking/:bookingId` | Get booking details |
| GET | `/api/tbo/cities/:countryCode` | Get cities list |
| GET | `/api/tbo/countries` | Get countries list |

## Example Requests

### Google - Search Hotels
```bash
curl "http://localhost:3000/api/google/search?query=hotels in dubai"
```

### Google - Autocomplete
```bash
curl "http://localhost:3000/api/google/autocomplete?input=dub"
```

### Google - Nearby Hotels
```bash
curl "http://localhost:3000/api/google/nearby?lat=25.2048&lng=55.2708&radius=5000"
```

### TBO - Search Hotels
```bash
curl -X POST http://localhost:3000/api/tbo/search \
  -H "Content-Type: application/json" \
  -d '{
    "cityCode": "DXB",
    "checkIn": "2024-03-01",
    "checkOut": "2024-03-05",
    "rooms": [{"adults": 2, "children": 0}],
    "nationality": "IN"
  }'
```

### TBO - Get Room Rates
```bash
curl -X POST http://localhost:3000/api/tbo/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "hotelCode": "HOTEL123",
    "searchId": "xxx",
    "checkIn": "2024-03-01",
    "checkOut": "2024-03-05",
    "rooms": [{"adults": 2}]
  }'
```

### TBO - Book Hotel
```bash
curl -X POST http://localhost:3000/api/tbo/book \
  -H "Content-Type: application/json" \
  -d '{
    "preBookId": "xxx",
    "guests": [{
      "title": "Mr",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+971501234567"
    }],
    "specialRequest": "Late checkout"
  }'
```

### TBO - Get Cities
```bash
curl "http://localhost:3000/api/tbo/cities/AE"
```

## Environment Variables

```
PORT=3000
GOOGLE_API_KEY=your-google-api-key
TBO_API_URL=https://api.tbotechnology.in/TBOHolidays_HotelAPI
TBO_USERNAME=your-username
TBO_PASSWORD=your-password
TBO_CLIENT_ID=your-client-id
```

