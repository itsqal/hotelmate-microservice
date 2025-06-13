import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  type LoyaltyPoints {
    id: ID!
    userId: String!
    points: Int!
    lastUpdated: String!
  }

  type Transaction {
    id: ID!
    userId: String!
    points: Int!
    type: TransactionType!
    description: String!
    timestamp: String!
  }

  enum TransactionType {
    EARN
    REDEEM
    ADJUST
  }

  type Query {
    getUserPoints(userId: String!): LoyaltyPoints
    getTransactionHistory(userId: String!): [Transaction!]!
  }

  type Mutation {
    earnPoints(userId: String!, points: Int!, description: String!): Transaction!
    redeemPoints(userId: String!, points: Int!, description: String!): Transaction!
    adjustPoints(userId: String!, points: Int!, description: String!): Transaction!
  }
`; 