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

- Reward point accumulation  
- Discounts based on loyalty tier or point balance  
- Tracking guest activity and rewards  

It helps improve customer retention through targeted benefits.

---

## GraphQL Usage

Below are example queries and mutations for each service.

---

### 📘 Review Service Examples

#### ✅ Create a Review
```graphql
mutation {
  createReview(input: {
    guestId: "12345",
    reservationId: "abcde",
    roomId: "room-101",
    comments: "Great stay!",
    aspects: [
      { name: "Cleanliness", score: 5 },
      { name: "Hospitality", score: 4 }
    ]
  }) {
    id
    comments
    aspects {
      name
      score
    }
  }
}
```
