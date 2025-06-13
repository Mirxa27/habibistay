# Property API

This API provides endpoints for managing property listings in the HabibiStay application.

## Create a Property

Create a new property listing.

### Endpoint

```
POST /api/properties
```

### Authentication

This endpoint requires authentication. The following roles are allowed to create properties:
- HOST
- PROPERTY_MANAGER
- ADMIN

### Request Headers

| Header | Description | Required |
|--------|-------------|----------|
| Authorization | Bearer token for authentication | Yes |
| Content-Type | application/json | Yes |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | The title of the property |
| description | string | Yes | Detailed description of the property |
| type | string | Yes | Type of property (e.g., APARTMENT, HOUSE, VILLA) |
| price | number | Yes | Price per night |
| cleaningFee | number | No | Cleaning fee |
| serviceFee | number | No | Service fee |
| address | string | Yes | Street address |
| city | string | Yes | City |
| state | string | No | State/Province/Region |
| zipCode | string | No | ZIP/Postal code |
| country | string | Yes | Country |
| lat | number | No | Latitude coordinate |
| lng | number | No | Longitude coordinate |
| bedrooms | integer | Yes | Number of bedrooms |
| beds | integer | Yes | Number of beds |
| bathrooms | number | Yes | Number of bathrooms (can be a decimal for half-baths) |
| maxGuests | integer | Yes | Maximum number of guests |
| amenities | string[] | Yes | Array of amenity IDs or names |
| houseRules | string | No | House rules for guests |
| cancellationPolicy | string | No | Cancellation policy |
| isPublished | boolean | No | Whether the property is published (default: false) |

### Example Request

```http
POST /api/properties
Content-Type: application/json
Authorization: Bearer your-jwt-token

{
  "title": "Luxury Beachfront Villa",
  "description": "Stunning villa with direct beach access and private pool.",
  "type": "VILLA",
  "price": 350,
  "cleaningFee": 100,
  "serviceFee": 50,
  "address": "456 Ocean View Drive",
  "city": "Malibu",
  "state": "CA",
  "zipCode": "90265",
  "country": "USA",
  "lat": 34.0259,
  "lng": -118.7798,
  "bedrooms": 4,
  "beds": 5,
  "bathrooms": 4.5,
  "maxGuests": 10,
  "amenities": ["POOL", "WIFI", "AIR_CONDITIONING", "KITCHEN", "PARKING"],
  "houseRules": "No smoking. No pets. No parties or events.",
  "cancellationPolicy": "Full refund 30 days before check-in.",
  "isPublished": true
}
```

### Responses

#### 201 Created

Property was successfully created. Returns the created property object.

```json
{
  "id": "property-123",
  "title": "Luxury Beachfront Villa",
  "description": "Stunning villa with direct beach access and private pool.",
  "type": "VILLA",
  "price": 350,
  "cleaningFee": 100,
  "serviceFee": 50,
  "address": "456 Ocean View Drive",
  "city": "Malibu",
  "state": "CA",
  "zipCode": "90265",
  "country": "USA",
  "lat": 34.0259,
  "lng": -118.7798,
  "bedrooms": 4,
  "beds": 5,
  "bathrooms": 4.5,
  "maxGuests": 10,
  "amenities": ["POOL", "WIFI", "AIR_CONDITIONING", "KITCHEN", "PARKING"],
  "houseRules": "No smoking. No pets. No parties or events.",
  "cancellationPolicy": "Full refund 30 days before check-in.",
  "isPublished": true,
  "ownerId": "user-123",
  "createdAt": "2023-05-15T10:30:00.000Z",
  "updatedAt": "2023-05-15T10:30:00.000Z"
}
```

#### 400 Bad Request

Invalid or missing required fields.

```json
{
  "error": "Missing required fields: title, description, type"
}
```

#### 401 Unauthorized

No authentication token provided or token is invalid.

```json
{
  "error": "Unauthorized: Authentication required"
}
```

#### 403 Forbidden

User does not have permission to create a property.

```json
{
  "error": "Forbidden: Insufficient permissions to create a property"
}
```

#### 500 Internal Server Error

An unexpected error occurred.

```json
{
  "error": "An unexpected error occurred while creating the property"
}
```

## Testing

Unit tests are available in `tests/api/properties.test.ts`. Run them with:

```bash
npm test tests/api/properties.test.ts
```

## Middleware

This endpoint is protected by the application's authentication middleware, which verifies the JWT token and checks the user's role before allowing access to the endpoint.
