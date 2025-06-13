import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type Guest {
    id: Int!
    fullName: String!
    email: String!
    phone: String
    address: String
    loyaltyPoints: Int!
    tier: String!
    createdAt: String!
    updatedAt: String!
  }

  type Reward {
    rewardId: Int!
    name: String!
    pointsRequired: Int!
    description: String
    available: Boolean!
    tierRestriction: String
    createdAt: String!
    updatedAt: String!
  }

  type HotelEaseGuest {
    id: Int!
    fullName: String!
    email: String!
    phone: String
    address: String
  }

  type HotelEaseReservation {
    id: Int!
    roomId: Int!
    checkInDate: String!
    checkOutDate: String!
    status: String!
  }

  type HotelEaseBill {
    id: Int!
    totalAmount: Float!
    paymentStatus: String!
    generatedAt: String!
  }

  type Query {
    guest(id: Int!): Guest
    guests: [Guest!]!
    guestByEmail(email: String!): Guest
    rewards(available: Boolean, tier: String): [Reward!]!
    reward(id: Int!): Reward
    hotelEaseGuest(email: String!): HotelEaseGuest
    hotelEaseReservations(guestId: Int!): [HotelEaseReservation!]!
    hotelEaseBills(reservationId: Int!): [HotelEaseBill!]!
  }

  type Mutation {
    createGuest(guestData: GuestInput!): Guest!
    updateGuest(id: Int!, guestData: GuestUpdateInput!): Guest!
    deleteGuest(id: Int!): Boolean!
    addReward(name: String!, pointsRequired: Int!, description: String, available: Boolean, tierRestriction: String): Reward!
    updateReward(id: Int!, rewardData: RewardUpdateInput!): Reward!
    deleteReward(id: Int!): Boolean!
    earnPoints(guestId: Int!, points: Int!, reason: String!): Guest!
    redeemReward(guestId: Int!, rewardId: Int!): Guest!
  }

  input GuestInput {
    fullName: String!
    email: String!
    phone: String
    address: String
  }

  input GuestUpdateInput {
    fullName: String
    email: String
    phone: String
    address: String
  }

  input RewardUpdateInput {
    name: String
    pointsRequired: Int
    description: String
    available: Boolean
    tierRestriction: String
  }
`; 