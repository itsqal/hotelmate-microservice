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

export const addAspect = async (name) => {
    const query = `
        INSERT INTO aspects (name)
        VALUES ($1)
        returning aspect_id, name
    `;

    try {
        const result = await pool.query(query, [name]);
        return {
            aspectId: result.rows[0].aspect_id,
            name: result.rows[0].name,
        };
    } catch (error) {
        console.error('Error adding aspect:', error);
        throw error;
    }
};

export const updateAspect = async (aspectId, name) => {
    const query = `
        UPDATE aspects
        SET name = $1
        WHERE aspect_id = $2
        RETURNING aspect_id, name
    `;

    try {
        const result = await pool.query(query, [name, aspectId]);
        if (result.rows.length === 0) {
            throw new Error('Aspect not found');
        }
        return {
            aspectId: result.rows[0].aspect_id,
            name: result.rows[0].name,
        };
    } catch (error) {
        console.error('Error updating aspect:', error);
        throw error;
    }
};

export const deleteAspect = async (id) => {
    const query = `
        DELETE FROM aspects
        WHERE aspect_id = $1
        RETURNING aspect_id
    `;

    try {
        const result = await pool.query(query, [id]);
        return {
            success: result.rows.length > 0,
            message: result.rows.length > 0 
                ? 'Aspect deleted successfully'
                : 'Aspect not found'
        };
    } catch (error) {
        console.error('Error deleting aspect:', error);
        throw error
    }
}