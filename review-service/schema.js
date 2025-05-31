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
    type MutationResponse {
        success: Boolean!
        message: String
    }
    type Mutation {
        addAspect(input: AddAspectInput!): Aspect
        updateAspect(input: UpdateAspectInput!): Aspect
        deleteAspect(id: ID!): MutationResponse
        addReview(input: AddReviewInput!): Review
        updateReview(input: UpdateReviewInput!): Review
        deleteReview(id: ID!): MutationResponse
    }
    input AddAspectInput {
        name: String!
    }
    input UpdateAspectInput {
        aspectId: ID!
        name: String!
    }
    input AddReviewInput {
        guestId: Int!
        hotelId: Int!
        stayId: Int!
        overallRating: Int!
        content: String
    }
    input UpdateReviewInput {
        reviewId: ID!,
        overallRating: Int
        content: String
    }
`