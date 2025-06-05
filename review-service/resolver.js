import { getReviews, getReviewById, addReview, updateReview, deleteReview } from "./queries/review-query.js";
import { getAspects, getAspectById, addAspect, updateAspect, deleteAspect } from "./queries/aspect-query.js";
import { fetchGuestData, fetchReservationData } from "./remoteGraphQLClient.js";
import { addReviewAspect } from "./queries/review-aspect-query.js";
import pool from './connection.js';

export const resolvers = {
    Query: {
        reviews: async () => {
            return await getReviews();
        },
        review: async (_, { id }) => {
            return await getReviewById(id);
        },
        aspects: async () => {
            return await getAspects();
        },
        aspect: async (_, { id }) => {
            return await getAspectById(id);
        },
        guests: async () => {
            const data = await fetchGuestData();
            return data.guests;
        },
        reservations: async() => {
            const data = await fetchReservationData();
            return data.reservations;
        }
    },
    Review: {
        aspects: async (parent) => {
            const query = `
                SELECT 
                    ra.review_id,
                    ra.aspect_id,
                    ra.rating,
                    ra.comment,
                    a.name,
                    a.id
                FROM review_aspects ra
                JOIN aspects a ON ra.aspect_id = a.id
                WHERE ra.review_id = $1
            `;
            const result = await pool.query(query, [parent.reviewId]);
            return result.rows.map(row => ({
                reviewId: row.review_id,
                aspectId: row.aspect_id,
                rating: row.rating,
                comment: row.comment,
                aspect: {
                    aspectId: row.id,
                    name: row.name
                }
            }));
        }
    },
    Aspect: {
        reviews: async (parent) => {
            const query = `
                SELECT 
                    ra.*,
                    r.id,
                    r.guest_id,
                    r.stay_id,
                    r.overall_rating,
                    r.content,
                    r.review_date,
                    r.last_updated
                FROM review_aspects ra
                JOIN reviews r ON ra.review_id = r.id
                WHERE ra.aspect_id = $1
            `;
            const result = await pool.query(query, [parent.aspectId]);
            return result.rows.map(row => ({
                reviewId: row.review_id,
                aspectId: row.aspect_id,
                rating: row.rating,
                comment: row.comment,
                review: {
                    reviewId: row.id,
                    guestId: row.guest_id,
                    stayId: row.stay_id,
                    overallRating: row.overall_rating,
                    content: row.content,
                    reviewDate: row.review_date,
                    lastUpdated: row.last_updated
                }
            }));
        }
    },
    Mutation: {
        addAspect: async (_, { input }) => {
            return await addAspect(input.name);
        },
        updateAspect: async (_, { input }) => {
            return await updateAspect(input.aspectId, input.name);
        },
        deleteAspect: async (_, { id }) => {
            return await deleteAspect(id);
        },
        addReview: async (_, { input }) => {
            return await addReview(input);
        },
        updateReview: async (_, { input }) => {
            return await updateReview(input);
        },
        deleteReview: async (_, { id }) => {
            return await deleteReview(id);
        },
        addReviewAspect: async (_, { input }) => {
            return await addReviewAspect(input);
        }
    }
};