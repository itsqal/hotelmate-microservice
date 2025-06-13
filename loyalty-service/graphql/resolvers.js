export const resolvers = {
  Query: {
    guest: async (_, { id }, { db }) => {
      const result = await db.query(
        'SELECT * FROM guests WHERE guest_id = $1',
        [id]
      );
      return result.rows[0];
    },

    guests: async (_, __, { db }) => {
      const result = await db.query('SELECT * FROM guests');
      return result.rows;
    },

    guestByEmail: async (_, { email }, { db }) => {
      const result = await db.query(
        'SELECT * FROM guests WHERE email = $1',
        [email]
      );
      return result.rows[0];
    },

    rewards: async (_, { available, tier }, { db }) => {
      let query = 'SELECT * FROM rewards';
      const params = [];
      
      if (available !== undefined || tier) {
        query += ' WHERE';
        if (available !== undefined) {
          query += ' available = $1';
          params.push(available);
        }
        if (tier) {
          query += available !== undefined ? ' AND' : '';
          query += ` tier_restriction = $${params.length + 1}`;
          params.push(tier);
        }
      }
      
      const result = await db.query(query, params);
      return result.rows;
    },

    reward: async (_, { id }, { db }) => {
      const result = await db.query(
        'SELECT * FROM rewards WHERE reward_id = $1',
        [id]
      );
      return result.rows[0];
    },

    hotelEaseGuest: async (_, { email }, { hotelEaseClient }) => {
      const query = `
        query GetGuest($email: String!) {
          guestByEmail(email: $email) {
            id
            fullName
            email
            phone
            address
          }
        }
      `;
      const response = await hotelEaseClient.guest.request(query, { email });
      return response.guestByEmail;
    },

    hotelEaseReservations: async (_, { guestId }, { hotelEaseClient }) => {
      const query = `
        query GetReservations($guestId: Int!) {
          reservationsByGuest(guestId: $guestId) {
            id
            roomId
            checkInDate
            checkOutDate
            status
          }
        }
      `;
      const response = await hotelEaseClient.reservation.request(query, { guestId });
      return response.reservationsByGuest;
    },

    hotelEaseBills: async (_, { reservationId }, { hotelEaseClient }) => {
      const query = `
        query GetBills($reservationId: Int!) {
          billsByReservation(reservationId: $reservationId) {
            id
            totalAmount
            paymentStatus
            generatedAt
          }
        }
      `;
      const response = await hotelEaseClient.billing.request(query, { reservationId });
      return response.billsByReservation;
    }
  },

  Mutation: {
    createGuest: async (_, { guestData }, { db }) => {
      const { fullName, email, phone, address } = guestData;
      const result = await db.query(
        `INSERT INTO guests (full_name, email, phone, address, loyalty_points, tier)
         VALUES ($1, $2, $3, $4, 0, 'BRONZE')
         RETURNING *`,
        [fullName, email, phone, address]
      );
      return result.rows[0];
    },

    updateGuest: async (_, { id, guestData }, { db }) => {
      const { fullName, email, phone, address } = guestData;
      const result = await db.query(
        `UPDATE guests 
         SET full_name = COALESCE($1, full_name),
             email = COALESCE($2, email),
             phone = COALESCE($3, phone),
             address = COALESCE($4, address),
             updated_at = NOW()
         WHERE guest_id = $5
         RETURNING *`,
        [fullName, email, phone, address, id]
      );
      return result.rows[0];
    },

    deleteGuest: async (_, { id }, { db }) => {
      const result = await db.query(
        'DELETE FROM guests WHERE guest_id = $1 RETURNING guest_id',
        [id]
      );
      return result.rows.length > 0;
    },

    addReward: async (_, { name, pointsRequired, description, available, tierRestriction }, { db }) => {
      const result = await db.query(
        `INSERT INTO rewards (name, points_required, description, available, tier_restriction)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, pointsRequired, description, available ?? true, tierRestriction]
      );
      return result.rows[0];
    },

    updateReward: async (_, { id, rewardData }, { db }) => {
      const { name, pointsRequired, description, available, tierRestriction } = rewardData;
      const result = await db.query(
        `UPDATE rewards 
         SET name = COALESCE($1, name),
             points_required = COALESCE($2, points_required),
             description = COALESCE($3, description),
             available = COALESCE($4, available),
             tier_restriction = COALESCE($5, tier_restriction),
             updated_at = NOW()
         WHERE reward_id = $6
         RETURNING *`,
        [name, pointsRequired, description, available, tierRestriction, id]
      );
      return result.rows[0];
    },

    deleteReward: async (_, { id }, { db }) => {
      const result = await db.query(
        'DELETE FROM rewards WHERE reward_id = $1 RETURNING reward_id',
        [id]
      );
      return result.rows.length > 0;
    },

    earnPoints: async (_, { guestId, points, reason }, { db }) => {
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        // Update guest's points and tier
        const result = await client.query(
          `UPDATE guests 
           SET loyalty_points = loyalty_points + $1,
               tier = CASE 
                 WHEN loyalty_points + $1 >= 1000 THEN 'PLATINUM'
                 WHEN loyalty_points + $1 >= 500 THEN 'GOLD'
                 WHEN loyalty_points + $1 >= 100 THEN 'SILVER'
                 ELSE 'BRONZE'
               END,
               updated_at = NOW()
           WHERE guest_id = $2
           RETURNING *`,
          [points, guestId]
        );

        // Record transaction
        await client.query(
          `INSERT INTO transactions (guest_id, points, type, description, timestamp)
           VALUES ($1, $2, 'EARN', $3, NOW())`,
          [guestId, points, reason]
        );

        await client.query('COMMIT');
        return result.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },

    redeemReward: async (_, { guestId, rewardId }, { db }) => {
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        // Get reward details
        const rewardResult = await client.query(
          'SELECT * FROM rewards WHERE reward_id = $1 AND available = true',
          [rewardId]
        );
        const reward = rewardResult.rows[0];
        if (!reward) {
          throw new Error('Reward not found or not available');
        }

        // Get guest details
        const guestResult = await client.query(
          'SELECT * FROM guests WHERE guest_id = $1',
          [guestId]
        );
        const guest = guestResult.rows[0];
        if (!guest) {
          throw new Error('Guest not found');
        }

        // Check if guest has enough points
        if (guest.loyalty_points < reward.points_required) {
          throw new Error('Insufficient points');
        }

        // Check tier restriction
        if (reward.tier_restriction && guest.tier !== reward.tier_restriction) {
          throw new Error('Guest tier does not meet reward requirements');
        }

        // Update guest's points
        const result = await client.query(
          `UPDATE guests 
           SET loyalty_points = loyalty_points - $1,
               tier = CASE 
                 WHEN loyalty_points - $1 >= 1000 THEN 'PLATINUM'
                 WHEN loyalty_points - $1 >= 500 THEN 'GOLD'
                 WHEN loyalty_points - $1 >= 100 THEN 'SILVER'
                 ELSE 'BRONZE'
               END,
               updated_at = NOW()
           WHERE guest_id = $2
           RETURNING *`,
          [reward.points_required, guestId]
        );

        // Record transaction
        await client.query(
          `INSERT INTO transactions (guest_id, points, type, description, timestamp)
           VALUES ($1, $2, 'REDEEM', $3, NOW())`,
          [guestId, -reward.points_required, `Redeemed reward: ${reward.name}`]
        );

        await client.query('COMMIT');
        return result.rows[0];
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  }
}; 