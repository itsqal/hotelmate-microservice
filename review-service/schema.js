export const typeDefs = `#graphql
    type Review {
        reviewId: ID!
        stayId: Int!
        overallRating: Int!
        content: String
        reviewDate: String!
        lastUpdated: String
        aspects: [ReviewAspect]
        guest: Guest
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
    type Room {
        id: ID!
        roomNumber: Int!
        roomType: String!
        pricePerNight: Float!
        status: String!
    }
    type Reservation {
        id: ID!
        roomId: Int!
        checkInDate: String!
        checkOutDate: String!
        room: Room!
    }
    type Guest {
        id: ID!
        fullName: String
        email: String
        phone: String
        address: String
    }
    type Query {
        reviews: [Review]
        review(id: ID!): Review
        aspects: [Aspect]
        aspect(id: ID!): Aspect
        guests: [Guest]
        reservations: [Reservation]
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

        addReviewAspect(input: AddReviewAspectInput!): ReviewAspect
    }
    input AddReviewAspectInput {
        reviewId: Int!
        aspectId: Int!,
        rating: Int!,
        comment: String
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