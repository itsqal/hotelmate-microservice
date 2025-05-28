import { getReviews, getReviewById } from "./queries/review-query.js";
import { getAspects, getAspectById } from "./queries/aspect-query.js";
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
                    a.aspect_id
                FROM review_aspect ra
                JOIN aspects a ON ra.aspect_id = a.aspect_id
                WHERE ra.review_id = $1
            `;
            const result = await pool.query(query, [parent.reviewId]);
            return result.rows.map(row => ({
                reviewId: row.review_id,
                aspectId: row.aspect_id,
                rating: row.rating,
                comment: row.comment,
                aspect: {
                    aspectId: row.aspect_id,
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
                    r.review_id,
                    r.guest_id,
                    r.hotel_id,
                    r.stay_id,
                    r.overall_rating,
                    r.content,
                    r.review_date,
                    r.last_updated
                FROM review_aspect ra
                JOIN reviews r ON ra.review_id = r.review_id
                WHERE ra.aspect_id = $1
            `;
            const result = await pool.query(query, [parent.aspectId]);
            return result.rows.map(row => ({
                reviewId: row.review_id,
                aspectId: row.aspect_id,
                rating: row.rating,
                comment: row.comment,
                review: {
                    reviewId: row.review_id,
                    guestId: row.guest_id,
                    hotelId: row.hotel_id,
                    stayId: row.stay_id,
                    overallRating: row.overall_rating,
                    content: row.content,
                    reviewDate: row.review_date,
                    lastUpdated: row.last_updated
                }
            }));
        }
    }
}