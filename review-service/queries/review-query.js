import pool from '../connection.js';

export const getReviews = async () => {
    const query = `
        SELECT * FROM reviews
        ORDER BY review_date DESC
    `;

    try {
        const result = await pool.query(query);
        return result.rows.map(review => ({
            reviewId: review.review_id,
            guestId: review.guest_id,
            hotelId: review.hotel_id,
            stayId: review.stay_id,
            overallRating: review.overall_rating,
            content: review.content,
            reviewDate: review.review_date,
            lastUpdated: review.last_updated
        }));
    } catch (error) {
        console.error('Error fetching reviews: ', error);
        throw error;
    }
};

export const getReviewById = async (id) => {
    const query = `
        SELECT * FROM reviews
        WHERE review_id = $1
    `;

    try {
        const result = await pool.query(query, [id]);
        const review = result.rows[0];
        return {
            reviewId: review.review_id,
            guestId: review.guest_id,
            hotelId: review.hotel_id,
            stayId: review.stay_id,
            overallRating: review.overall_rating,
            content: review.content,
            reviewDate: review.review_date,
            lastUpdated: review.last_updated
        };
    } catch (error) {
        console.error('Error fetching review: ', error);
        throw error;
    }
};