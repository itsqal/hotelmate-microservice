import pool from '../connection.js';

export const getAspects = async () => {
    const query = `
        SELECT * FROM aspects
    `;

    try {
        const result = await pool.query(query);
        return result.rows.map(aspect => ({
            aspectId: aspect.aspect_id,
            name: aspect.name
        }));
    } catch (error) {
        console.error('Error fetching aspects: ', error);
        throw error;
    }
};

export const getAspectById = async (id) => {
    const query = `
        SELECT * FROM aspects
        WHERE aspect_id = $1
    `;

    try {
        const result = await pool.query(query, [id]);
        const aspect = result.rows[0];
        return {
            aspectId: aspect.aspect_id,
            name: aspect.name
        };
    } catch (error) {
        console.error('Error fetching aspect: ', error);
        throw error;
    }
};