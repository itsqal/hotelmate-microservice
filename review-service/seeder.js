import pool from './connection.js';

const seedAspects = async () => {
    const aspects = [
        'Cleanliness',
        'Staff Service',
        'Location',
        'Room Comfort',
        'Facilities',
        'Value for Money'
    ];

    for (const aspect of aspects) {
        await pool.query(
            'INSERT INTO aspects (name) VALUES ($1)',
            [aspect]
        );
    }
    console.log('Aspects seeded successfully');
};

const seedReviews = async () => {
    const reviews = [
        {
            guest_id: 1,
            hotel_id: 1,
            stay_id: 1,
            overall_rating: 4,
            content: 'Great stay overall! Really enjoyed the facilities.',
            review_date: new Date(),
            last_updated: new Date()
        },
        {
            guest_id: 2,
            hotel_id: 1,
            stay_id: 2,
            overall_rating: 5,
            content: 'Excellent service and very clean rooms.',
            review_date: new Date(),
            last_updated: new Date()
        }
    ];

    for (const review of reviews) {
        const result = await pool.query(
            `INSERT INTO reviews (guest_id, hotel_id, stay_id, overall_rating, content, review_date, last_updatedp) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING review_id`,
            [review.guest_id, review.hotel_id, review.stay_id, review.overall_rating, review.content, review.review_date, review.last_updated]
        );
        
        const aspects = await pool.query('SELECT aspect_id FROM aspects');
        for (const aspect of aspects.rows) {
            await pool.query(
                `INSERT INTO review_aspect (review_id, aspect_id, rating, comment) 
                 VALUES ($1, $2, $3, $4)`,
                [result.rows[0].review_id, aspect.aspect_id, Math.floor(Math.random() * 5) + 1, 'Sample comment']
            );
        }
    }
    console.log('Reviews and aspect ratings seeded successfully');
};

const seed = async () => {
    try {
        await seedAspects();
        await seedReviews();
        console.log('Database seeded successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        pool.end();
    }
};

seed();