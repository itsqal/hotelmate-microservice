# HotelMate Microservices

HotelMate is a modular microservice-based system designed to enhance the guest experience in hotel management systems. It includes services for **Review Management** and **Customer Loyalty**, integrated seamlessly with core hotel operations.

## Table of Contents

- [Overview](#overview)
- [Services](#services)
  - [Review Service](#review-service)
  - [Loyalty Service](#loyalty-service)
- [GraphQL Usage](#graphql-usage)
  - [Review Service Examples](#review-service-examples)
  - [Loyalty Service Examples](#loyalty-service-examples)
- [Technologies](#technologies)

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

### 💎 Loyalty Service

This service manages customer loyalty, enabling features like:

- **Reward point accumulation** for completed stays and special actions  
- **Tiered loyalty system** (Bronze, Silver, Gold, Platinum) with automatic upgrades based on points  
- **Manual points management** (add, update, reset) by admins for customer service or promotions  
- **Reward redemption** for eligible guests  
- **Tracking guest loyalty activity and history**  

**Integrations:**

- **Guest Service** – for guest identity and contact info  
- **Reservation Service** – to fetch and process completed reservations for point awards  
- **Room Service** – for room-related reward logic (if needed)  
- **Billing Service** – for potential point earning on payments (optional)

**Main Models:**

- `Guest`: Represents a hotel guest with loyalty account info (points, tier, etc.)
- `LoyaltyAccount`: Tracks each guest's points, tier, and transaction history
- `Reward`: Defines available rewards, required points, and tier restrictions
- `Transaction`: Records all point-earning, adjustment, and redemption events

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
