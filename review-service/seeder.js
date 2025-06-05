import pool from './connection.js';

const aspects_table_query = `
    CREATE TABLE aspects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL
    );
`;

const reviews_table_query = `
    CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        guest_id INTEGER,
        stay_id INTEGER,
        overall_rating INTEGER,
        content TEXT,
        review_date DATE,
        last_updated DATE
    );
`;

const review_aspects_table_query = `
    CREATE TABLE review_aspects (
        review_id INTEGER NOT NULL, 
        aspect_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,

        PRIMARY KEY (review_id, aspect_id),
        FOREIGN KEY (review_id) REFERENCES reviews(id),
        FOREIGN KEY (aspect_id) REFERENCES aspects(id)
    );
`;

try {
    await pool.query(aspects_table_query);
    await pool.query(reviews_table_query);  
    await pool.query(review_aspects_table_query);  
} catch (error) {
    console.error("Failed to create tables:", error);
}

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
            stay_id: 1,
            overall_rating: 4,
            content: 'Great stay overall! Really enjoyed the facilities.',
            review_date: new Date(),
            last_updated: new Date()
        },
        {
            guest_id: 2,
            stay_id: 2,
            overall_rating: 5,
            content: 'Excellent service and very clean rooms.',
            review_date: new Date(),
            last_updated: new Date()
        },
        {
            guest_id: 3,
            stay_id: 3,
            overall_rating: 2,
            content: 'I had a really bad experience staying at this hotel!.',
            review_date: new Date(),
            last_updated: new Date()
        }
    ];

    for (const review of reviews) {
        const result = await pool.query(
            `INSERT INTO reviews (guest_id, stay_id, overall_rating, content, review_date, last_updated) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [review.guest_id, review.stay_id, review.overall_rating, review.content, review.review_date, review.last_updated]
        );

        const aspects = await pool.query('SELECT id FROM aspects');

        for (const aspect of aspects.rows) {
            await pool.query(
                `INSERT INTO review_aspects (review_id, aspect_id, rating, comment) 
                 VALUES ($1, $2, $3, $4)`,
                [result.rows[0].id, aspect.id, Math.floor(Math.random() * 5) + 1, 'Sample comment']
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