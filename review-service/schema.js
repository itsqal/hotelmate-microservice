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
    }
    type Aspect {
        aspectId: ID!
        name: String!
    }
    type ReviewAspectRating {
        aspect: Aspect! # The aspect that was rated (e.g., "Cleanliness")
        rating: Int!    # The rating given (e.g., 4)
    }
    type Query {
        reviews: [Review]
        aspects: [Aspect]
    }
`