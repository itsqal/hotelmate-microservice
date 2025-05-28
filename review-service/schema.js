export const typeDefs = `#graphql
    type Review {
        reviewId: ID!
        guestId: Int!
        hotelId: Int!
        stayId: Int!
        overallRating: Int!
        content: String
        reviewDate: String!
        lastUpdated: String
        aspects: [ReviewAspect]
    }
    type Aspect {
        aspectId: ID!
        name: String!
        reviews: [ReviewAspect]
    }
    type ReviewAspect {
        reviewId: ID!
        aspectId: ID!
        rating: Int!
        comment: String
        review: Review!
        aspect: Aspect!
    }
    type Query {
        reviews: [Review]
        review(id: ID!): Review
        aspects: [Aspect]
        aspect(id: ID!): Aspect
    }
`