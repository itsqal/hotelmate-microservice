import pool from '../connection.js';

export const getReviews = async () => {
    const query = `
        SELECT * FROM reviews
        ORDER BY review_date DESC
    `;

    try {
        const result = await pool.query(query);
        return result.rows.map(review => ({
            reviewId: review.id,
            guestId: review.guest_id,
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
        WHERE id = $1
    `;

    try {
        const result = await pool.query(query, [id]);
        const review = result.rows[0];
        return {
            reviewId: review.id,
            guestId: review.guest_id,
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

export const addReview = async (input) => {
    const query = `
        INSERT INTO reviews (guest_id, stay_id, overall_rating, content, review_date, last_updated)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING 
            id as "reviewId",
            guest_id as "guestId",
            stay_id as "stayId",
            overall_rating as "overallRating",
            content,
            review_date as "reviewDate",
            last_updated as "lastUpdated"
    `;

    try {
        const result = await pool.query(query, [
            input.guestId,
            input.stayId,
            input.overallRating,
            input.content
        ]);
        return result.rows[0];
    } catch (error) {
        console.error('Error adding review:', error);
        throw error;
    }
};

export const updateReview = async (input) => {
    const query = `
        UPDATE reviews 
        SET 
            overall_rating = COALESCE($1, overall_rating),
            content = COALESCE($2, content),
            last_updated = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING 
            id as "reviewId",
            guest_id as "guestId",
            stay_id as "stayId",
            overall_rating as "overallRating",
            content,
            review_date as "reviewDate",
            last_updated as "lastUpdated"
    `;

    try {
        const result = await pool.query(query, [
            input.overallRating,
            input.content,
            input.reviewId
        ]);

        if (result.rows.length === 0) {
            throw new Error('Review not found');
        }
        return result.rows[0];
    } catch (error) {
        console.error('Error updating review:', error);
        throw error;
    }
};

export const deleteReview = async (id) => {
    const query = `
        DELETE FROM reviews
        WHERE id = $1
        RETURNING id
    `;

    try {
        const result = await pool.query(query, [id]);
        return {
            success: result.rows.length > 0,
            message: result.rows.length > 0
                ? 'Review deleted successfully'
                : 'Review not found'
        };
    } catch (error) {
        console.error('Error deleting review:', error);
        throw error;
    }
};