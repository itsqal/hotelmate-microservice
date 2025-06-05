import pool from "../connection.js";

export const addReviewAspect = async (input) => {
    const query = `
        INSERT INTO review_aspects (review_id, aspect_id, rating, comment)
        VALUES ($1, $2, $3, $4)
        RETURNING 
            review_id as "reviewId",
            aspect_id as "aspectId",
            rating,
            comment
    `;

    try {
        const result = await pool.query(query, [
            input.reviewId,
            input.aspectId,
            input.rating,
            input.comment
        ]);
        return result.rows[0];
    } catch (error) {
        console.error('Error adding review aspect:', error);
        throw error;
    }
};