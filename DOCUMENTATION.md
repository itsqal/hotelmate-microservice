# Hotelmate Documentation

---

## Overview

HotelMate comprises two main backend services and a unified frontend. Each service operates independently but collaborates through shared integrations with the central hotel system (e.g., guest, reservation, and room services).

---

## Services

### 📝 Review Service

This service allows guests to leave, edit, and delete reviews about their stays. It supports comprehensive feedback by incorporating various review **Aspects** such as:

- Cleanliness  
- Hospitality  
- Room Facilities  
- Location  
- Value for Money

**Integrations:**

- **Guest Service** – for reviewer data  
- **Reservation Service** – to validate the guest's stay  
- **Room Service** – to associate reviews with specific room types

**Main Models:**

- `Review`: Represents a guest's review of their stay.
- `Aspect`: Defines a specific quality metric for rating.

---
# Environment Variables Documentation

This section describes the required `.env` variables for each service in the HotelMate project.  
**Copy the relevant section and create a `.env` file in each service directory.**

---

## frontend-loyalty/.env

```properties
PORT=3001
REVIEW_FRONTEND_URL=http://localhost:3002
```

- **PORT**: Port for the frontend-loyalty app (default: 3001).
- **REVIEW_FRONTEND_URL**: URL of the review frontend service. Change if running on a different host or port.

---

## frontend-review/.env

```properties
PORT=3002
FRONTEND_LOYALTY_URL=http://localhost:3001
GRAPHQL_ENDPOINT=http://host.docker.internal:4002/graphql
```

- **PORT**: Port for the frontend-review app (default: 3002).
- **FRONTEND_LOYALTY_URL**: URL of the loyalty frontend service.
- **GRAPHQL_ENDPOINT**: URL of the review-service GraphQL endpoint.  
  - Use `http://localhost:4002/graphql` if running locally.
  - Use `http://host.docker.internal:4002/graphql` if running in Docker.

---

## loyalty-service/.env

```properties
DB_USER=yourusername
DB_HOST=host.docker.internal
DB_NAME=hotelmate-loyalty-service
DB_PASSWORD=yourpassword
DB_PORT=yourport

GUEST_SERVICE_URL=http://host.docker.internal:8003/graphql
ROOM_SERVICE_URL=http://host.docker.internal:8001/graphql
RESERVATION_SERVICE_URL=http://host.docker.internal:8002/graphql
BILLING_SERVICE_URL=http://host.docker.internal:8004/graphql
```

- **DB_USER**: Username for the loyalty service database.
- **DB_HOST**: Hostname for the PostgreSQL server.  
  - Use `host.docker.internal` for Docker-to-host connections.
  - Use the database service name (e.g., `loyalty-db`) if using Docker Compose.
- **DB_NAME**: Database name for the loyalty service.
- **DB_PASSWORD**: Password for the user.
- **DB_PORT**: Port for PostgreSQL (default: 5432).
- **GUEST_SERVICE_URL**: URL for the guest service GraphQL endpoint.
- **ROOM_SERVICE_URL**: URL for the room service GraphQL endpoint.
- **RESERVATION_SERVICE_URL**: URL for the reservation service GraphQL endpoint.
- **BILLING_SERVICE_URL**: URL for the billing service GraphQL endpoint.

---

## review-service/.env

```properties
PORT=4002

DB_USER=yourusername
DB_HOST=host.docker.internal
DB_NAME=hotelmate-review-service
DB_PASSWORD=yourpassword
DB_PORT=yourport

GUEST_SERVICE_URL=http://host.docker.internal:8003/graphql
ROOM_SERVICE_URL=http://host.docker.internal:8001/graphql
RESERVATION_SERVICE_URL=http://host.docker.internal:8002/graphql
BILLING_SERVICE_URL=http://host.docker.internal:8004/graphql
```

- **PORT**: Port for the review-service (default: 4002).
- **DB_USER**: PostgreSQL username for the review service database.
- **DB_HOST**: Hostname for the PostgreSQL server.  
  - Use `host.docker.internal` for Docker-to-host connections.
  - Use the database service name (e.g., `review-db`) if using Docker Compose.
- **DB_NAME**: Database name for the review service.
- **DB_PASSWORD**: Password for the PostgreSQL user.
- **DB_PORT**: Port for PostgreSQL (default: 5432).
- **GUEST_SERVICE_URL**: URL for the guest service GraphQL endpoint.
- **ROOM_SERVICE_URL**: URL for the room service GraphQL endpoint.
- **RESERVATION_SERVICE_URL**: URL for the reservation service GraphQL endpoint.
- **BILLING_SERVICE_URL**: URL for the billing service GraphQL endpoint.

---

### 💎 Loyalty Service

This service manages customer loyalty, enabling features like:

- Reward point accumulation  
- Discounts based on loyalty tier or point balance  
- Tracking guest activity and rewards  

It helps improve customer retention through targeted benefits.

---

## GraphQL Usage

Below are example queries and mutations for each service.

---

### 📘 Review Service Mutation

#### ✅ Create a Review
```graphql
mutation createReview {
    addReview(input: {
        guestId: 1,
        stayId: 1,
        overallRating: 3,
        content: "Not so bad. I recommend giving this hotel a try!"
    }) {
        reviewId,
        guestId,
        stayId,
        overallRating,
        content
    }
}
```

### ✅ Update a Review
```graphql
mutation updateReview {
    updateReview (input: {
        reviewId: 1,
        overallRating: 4,
        content: "I really enjoyed staying at this hotel!"
    }) {
        reviewId,
        overallRating,
        content
    }
}
```

### ✅ Delete A Review
```graphql
mutation deleteReview {
    deleteReview (id: 1) {
        success,
        message
    }
}
```
### 📘 Review Service Query

### ✅ Get All Review
```graphql
query getReviews {
    reviews {
        reviewId,
        overallRating,
        content,
        aspects {
            rating,
            comment,
            aspect {
                aspectId,
                name
            }
        }
        guest {
          id
          fullName
          email
          phone
          address
        }
    }
}
```

### ✅ Update a Single Review
```graphql
query getReviewById {
    review(id: 1) {
        reviewId,
        overallRating,
        content,
        aspects {
            rating,
            comment,
            aspect {
                aspectId,
                name
            }
        }
        guest {
          id
          fullName
          email
          phone
          address
        }
    }
}
```

### 📘 Loyalty Service Mutation

#### ✅ Award or Adjust Points
```graphql
mutation {
  updatePoints(guestId: 1, points: 5000, reason: "Manual adjustment") {
    id
    fullName
    loyaltyPoints
    tier
  }
}
```

#### ✅ Reset Points
```graphql
mutation {
  resetPoints(guestId: 1, reason: "Account reset") {
    id
    fullName
    loyaltyPoints
    tier
  }
}
```

#### ✅ Redeem a Reward
```graphql
mutation {
  redeemReward(guestId: 1, rewardId: 2) {
    id
    fullName
    loyaltyPoints
    tier
  }
}
```

#### ✅ Process Completed Reservations (award points for all completed stays)
```graphql
mutation {
  processCompletedReservations
}
```

### 📘 Loyalty Service Query

#### ✅ Get All Guests with Loyalty Info
```graphql
query {
  guests {
    id
    fullName
    email
    loyaltyPoints
    tier
  }
}
```

#### ✅ Get Guests with Completed Reservations
```graphql
query {
  guestsWithCompletedReservations {
    id
    fullName
    loyaltyPoints
    tier
    email
    phone
    address
  }
}
```

#### ✅ Get All Rewards
```graphql
query {
  rewards(available: true) {
    rewardId
    name
    pointsRequired
    description
    tierRestriction
  }
}
```