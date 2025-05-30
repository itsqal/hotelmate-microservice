export const typeDefs = `#graphql
    type Guest {
        guestId: ID!
        name: String!
        email: String!
        joinDate: String!
        loyaltyAccount: LoyaltyAccount
    }

    type LoyaltyAccount {
        accountId: ID!
        guestId: ID!
        totalPoints: Int!
        tier: String!
        lastUpdated: String!
        transactions: [Transaction]
        redemptions: [Redemption]
        guestName: String
        guestEmail: String
    }

    type Transaction {
        transactionId: ID!
        accountId: ID!
        points: Int!
        transactionType: String!
        description: String
        transactionDate: String!
    }

    type Reward {
        rewardId: ID!
        name: String!
        pointsRequired: Int!
        description: String
        available: Boolean!
        createdAt: String!
        updatedAt: String!
    }

    type Redemption {
        redemptionId: ID!
        accountId: ID!
        rewardId: ID!
        redemptionDate: String!
        status: String!
        reward: Reward
        rewardName: String
    }

    type AccountSummary {
        account: LoyaltyAccount!
        recentTransactions: [Transaction]!
        pendingRedemptions: [Redemption]!
    }

    type Query {
        guest(id: ID!): Guest
        loyaltyAccount(id: ID!): LoyaltyAccount
        rewards(available: Boolean): [Reward]
        reward(id: ID!): Reward
        transactions(accountId: ID!, type: String, startDate: String, endDate: String): [Transaction]
        redemptions(accountId: ID!, status: String): [Redemption]
        accountSummary(accountId: ID!): AccountSummary
    }

    type Mutation {
        createLoyaltyAccount(guestId: ID!): LoyaltyAccount
        earnPoints(accountId: ID!, points: Int!, description: String): Transaction
        redeemReward(accountId: ID!, rewardId: ID!): Redemption
        createReward(name: String!, pointsRequired: Int!, description: String): Reward
        updateRedemptionStatus(redemptionId: ID!, status: String!): Redemption
    }
` 