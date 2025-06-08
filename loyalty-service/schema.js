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
        tierMultiplier: Float!
        lastUpdated: String!
        transactions: [Transaction]
        redemptions: [Redemption]
        guestName: String
        guestEmail: String
        pointsExpiring: Int
        nextTierPoints: Int
    }

    type TierConfig {
        tierName: String!
        pointsRequired: Int!
        multiplier: Float!
        benefits: [String]!
    }

    type Transaction {
        transactionId: ID!
        accountId: ID!
        points: Int!
        basePoints: Int!
        multiplier: Float!
        transactionType: String!
        description: String
        transactionDate: String!
        expiryDate: String
    }

    type Reward {
        rewardId: ID!
        name: String!
        pointsRequired: Int!
        description: String
        available: Boolean!
        createdAt: String!
        updatedAt: String!
        tierRestriction: String
    }

    type Redemption {
        redemptionId: ID!
        accountId: ID!
        rewardId: ID!
        redemptionDate: String!
        status: String!
        reward: Reward
        rewardName: String
        pointsUsed: Int!
    }

    type AccountSummary {
        account: LoyaltyAccount!
        recentTransactions: [Transaction]!
        pendingRedemptions: [Redemption]!
        tierProgress: TierProgress!
        expiringPoints: [Transaction]!
    }

    type TierProgress {
        currentTier: String!
        currentPoints: Int!
        nextTier: String
        pointsToNextTier: Int
        progressPercentage: Float
    }

    type Query {
        guest(id: ID!): Guest
        loyaltyAccount(id: ID!): LoyaltyAccount
        rewards(available: Boolean, tier: String): [Reward]
        reward(id: ID!): Reward
        transactions(accountId: ID!, type: String, startDate: String, endDate: String): [Transaction]
        redemptions(accountId: ID!, status: String): [Redemption]
        accountSummary(accountId: ID!): AccountSummary
        tierConfigs: [TierConfig]!
        analytics(accountId: ID!): AccountAnalytics
    }

    type AccountAnalytics {
        totalPointsEarned: Int!
        totalPointsRedeemed: Int!
        averagePointsPerMonth: Float!
        favoriteRewards: [RewardAnalytics]!
        tierHistory: [TierHistory]!
    }

    type RewardAnalytics {
        reward: Reward!
        redemptionCount: Int!
        totalPointsSpent: Int!
    }

    type TierHistory {
        tier: String!
        achievedDate: String!
        pointsAtAchievement: Int!
    }

    type Mutation {
        createLoyaltyAccount(guestId: ID!): LoyaltyAccount
        earnPoints(accountId: ID!, points: Int!, description: String): Transaction
        redeemReward(accountId: ID!, rewardId: ID!): Redemption
        createReward(name: String!, pointsRequired: Int!, description: String, tierRestriction: String): Reward
        addReward(name: String!, pointsRequired: Int!, description: String, available: Boolean, tierRestriction: String): Reward
        updateRedemptionStatus(redemptionId: ID!, status: String!): Redemption
        bulkEarnPoints(transactions: [BulkPointsInput]!): [Transaction]!
        updateTierConfig(config: TierConfigInput!): TierConfig!
    }

    input BulkPointsInput {
        accountId: ID!
        points: Int!
        description: String
    }

    input TierConfigInput {
        tierName: String!
        pointsRequired: Int!
        multiplier: Float!
        benefits: [String]!
    }
` 