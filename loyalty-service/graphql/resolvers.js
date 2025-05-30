export const resolvers = {
  Query: {
    getUserPoints: async (_, { userId }, { db }) => {
      const result = await db.query(
        'SELECT * FROM loyalty_points WHERE user_id = $1',
        [userId]
      );
      return result.rows[0];
    },

    getTransactionHistory: async (_, { userId }, { db }) => {
      const result = await db.query(
        'SELECT * FROM transactions WHERE user_id = $1 ORDER BY timestamp DESC',
        [userId]
      );
      return result.rows;
    }
  },

  Mutation: {
    earnPoints: async (_, { userId, points, description }, { db }) => {
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        // Update or insert loyalty points
        await client.query(
          `INSERT INTO loyalty_points (user_id, points, last_updated)
           VALUES ($1, $2, NOW())
           ON CONFLICT (user_id) 
           DO UPDATE SET 
             points = loyalty_points.points + $2,
             last_updated = NOW()`,
          [userId, points]
        );

        // Record transaction
        const transactionResult = await client.query(
          `INSERT INTO transactions (user_id, points, type, description, timestamp)
           VALUES ($1, $2, 'EARN', $3, NOW())
           RETURNING *`,
          [userId, points, description]
        );

        await client.query('COMMIT');
        return transactionResult.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    redeemPoints: async (_, { userId, points, description }, { db }) => {
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        // Check if user has enough points
        const pointsResult = await client.query(
          'SELECT points FROM loyalty_points WHERE user_id = $1',
          [userId]
        );

        if (!pointsResult.rows[0] || pointsResult.rows[0].points < points) {
          throw new Error('Insufficient points');
        }

        // Update loyalty points
        await client.query(
          `UPDATE loyalty_points 
           SET points = points - $2,
               last_updated = NOW()
           WHERE user_id = $1`,
          [userId, points]
        );

        // Record transaction
        const transactionResult = await client.query(
          `INSERT INTO transactions (user_id, points, type, description, timestamp)
           VALUES ($1, $2, 'REDEEM', $3, NOW())
           RETURNING *`,
          [userId, points, description]
        );

        await client.query('COMMIT');
        return transactionResult.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    adjustPoints: async (_, { userId, points, description }, { db }) => {
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        // Update or insert loyalty points
        await client.query(
          `INSERT INTO loyalty_points (user_id, points, last_updated)
           VALUES ($1, $2, NOW())
           ON CONFLICT (user_id) 
           DO UPDATE SET 
             points = $2,
             last_updated = NOW()`,
          [userId, points]
        );

        // Record transaction
        const transactionResult = await client.query(
          `INSERT INTO transactions (user_id, points, type, description, timestamp)
           VALUES ($1, $2, 'ADJUST', $3, NOW())
           RETURNING *`,
          [userId, points, description]
        );

        await client.query('COMMIT');
        return transactionResult.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  }
}; 