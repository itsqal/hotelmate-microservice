import pool from './connection.js';

// Custom error class for loyalty service
class LoyaltyServiceError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}

export const resolvers = {
    Query: {
        guest: async (_, { id }) => {
            try {
                const result = await pool.query(
                    'SELECT * FROM guests WHERE guest_id = $1',
                    [id]
                );
                if (!result.rows[0]) {
                    throw new LoyaltyServiceError('Guest not found', 'NOT_FOUND');
                }
                return result.rows[0];
            } catch (error) {
                throw new LoyaltyServiceError(
                    error.message || 'Error fetching guest',
                    error.code || 'INTERNAL_ERROR'
                );
            }
        },

        loyaltyAccount: async (_, { id }) => {
            try {
                const result = await pool.query(
                    `SELECT la.*, g.name as guest_name, g.email as guest_email 
                     FROM loyalty_accounts la 
                     JOIN guests g ON la.guest_id = g.guest_id 
                     WHERE la.account_id = $1`,
                    [id]
                );
                if (!result.rows[0]) {
                    throw new LoyaltyServiceError('Loyalty account not found', 'NOT_FOUND');
                }
                return result.rows[0];
            } catch (error) {
                throw new LoyaltyServiceError(
                    error.message || 'Error fetching loyalty account',
                    error.code || 'INTERNAL_ERROR'
                );
            }
        },

        rewards: async (_, { available, tier }) => {
            try {
                let query = 'SELECT * FROM rewards';
                const params = [];
                const conditions = [];
                if (available !== undefined) {
                    conditions.push('available = $' + (params.length + 1));
                    params.push(available);
                }
                if (tier) {
                    conditions.push('tier_restriction = $' + (params.length + 1));
                    params.push(tier);
                }
                if (conditions.length > 0) {
                    query += ' WHERE ' + conditions.join(' AND ');
                }
                const result = await pool.query(query, params);
                // Map snake_case to camelCase
                return result.rows.map(row => ({
                    rewardId: row.reward_id,
                    name: row.name,
                    pointsRequired: row.points_required,
                    description: row.description,
                    available: row.available,
                    tierRestriction: row.tier_restriction,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                }));
            } catch (error) {
                throw new LoyaltyServiceError(
                    error.message || 'Error fetching rewards',
                    error.code || 'INTERNAL_ERROR'
                );
            }
        },

        reward: async (_, { id }) => {
            try {
                const result = await pool.query(
                    'SELECT * FROM rewards WHERE reward_id = $1',
                    [id]
                );
                if (!result.rows[0]) {
                    throw new LoyaltyServiceError('Reward not found', 'NOT_FOUND');
                }
                const row = result.rows[0];
                return {
                    rewardId: row.reward_id,
                    name: row.name,
                    pointsRequired: row.points_required,
                    description: row.description,
                    available: row.available,
                    tierRestriction: row.tier_restriction,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                };
            } catch (error) {
                throw new LoyaltyServiceError(
                    error.message || 'Error fetching reward',
                    error.code || 'INTERNAL_ERROR'
                );
            }
        },

        transactions: async (_, { accountId, type, startDate, endDate }) => {
            try {
                let query = 'SELECT * FROM transactions WHERE account_id = $1';
                const params = [accountId];
                let paramIndex = 2;

                if (type) {
                    query += ` AND transaction_type = $${paramIndex}`;
                    params.push(type);
                    paramIndex++;
                }

                if (startDate) {
                    query += ` AND transaction_date >= $${paramIndex}`;
                    params.push(startDate);
                    paramIndex++;
                }

                if (endDate) {
                    query += ` AND transaction_date <= $${paramIndex}`;
                    params.push(endDate);
                }

                query += ' ORDER BY transaction_date DESC';
                const result = await pool.query(query, params);
                return result.rows;
            } catch (error) {
                throw new LoyaltyServiceError(
                    error.message || 'Error fetching transactions',
                    error.code || 'INTERNAL_ERROR'
                );
            }
        },

        redemptions: async (_, { accountId, status }) => {
            try {
                const query = status
                    ? 'SELECT * FROM redemptions WHERE account_id = $1 AND status = $2'
                    : 'SELECT * FROM redemptions WHERE account_id = $1';
                const params = status ? [accountId, status] : [accountId];
                const result = await pool.query(query, params);
                return result.rows;
            } catch (error) {
                throw new LoyaltyServiceError(
                    error.message || 'Error fetching redemptions',
                    error.code || 'INTERNAL_ERROR'
                );
            }
        },

        // New query to get account summary
        accountSummary: async (_, { accountId }) => {
            try {
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');

                    // Get account details
                    const accountResult = await client.query(
                        'SELECT * FROM loyalty_accounts WHERE account_id = $1',
                        [accountId]
                    );

                    if (!accountResult.rows[0]) {
                        throw new LoyaltyServiceError('Account not found', 'NOT_FOUND');
                    }

                    // Get recent transactions
                    const transactionsResult = await client.query(
                        'SELECT * FROM transactions WHERE account_id = $1 ORDER BY transaction_date DESC LIMIT 5',
                        [accountId]
                    );

                    // Get pending redemptions
                    const redemptionsResult = await client.query(
                        'SELECT r.*, rw.name as reward_name FROM redemptions r JOIN rewards rw ON r.reward_id = rw.reward_id WHERE r.account_id = $1 AND r.status = $2',
                        [accountId, 'PENDING']
                    );

                    await client.query('COMMIT');

                    return {
                        account: accountResult.rows[0],
                        recentTransactions: transactionsResult.rows,
                        pendingRedemptions: redemptionsResult.rows
                    };
                } catch (error) {
                    await client.query('ROLLBACK');
                    throw error;
                } finally {
                    client.release();
                }
            } catch (error) {
                throw new LoyaltyServiceError(
                    error.message || 'Error fetching account summary',
                    error.code || 'INTERNAL_ERROR'
                );
            }
        }
    },

    Mutation: {
        createLoyaltyAccount: async (_, { guestId }) => {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Check if guest exists
                const guestResult = await client.query(
                    'SELECT * FROM guests WHERE guest_id = $1',
                    [guestId]
                );
                if (!guestResult.rows[0]) {
                    throw new LoyaltyServiceError('Guest not found', 'NOT_FOUND');
                }

                // Check if account already exists
                const existingAccount = await client.query(
                    'SELECT * FROM loyalty_accounts WHERE guest_id = $1',
                    [guestId]
                );
                if (existingAccount.rows[0]) {
                    throw new LoyaltyServiceError('Loyalty account already exists', 'DUPLICATE');
                }

                // Create account
                const result = await client.query(
                    'INSERT INTO loyalty_accounts (guest_id, total_points, tier, last_updated) VALUES ($1, 0, $2, NOW()) RETURNING *',
                    [guestId, 'BRONZE']
                );

                await client.query('COMMIT');
                return result.rows[0];
            } catch (error) {
                await client.query('ROLLBACK');
                throw new LoyaltyServiceError(
                    error.message || 'Error creating loyalty account',
                    error.code || 'INTERNAL_ERROR'
                );
            } finally {
                client.release();
            }
        },

        earnPoints: async (_, { accountId, points, description }) => {
            if (points <= 0) {
                throw new LoyaltyServiceError('Points must be greater than 0', 'INVALID_INPUT');
            }

            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                // Check if account exists
                const accountResult = await client.query(
                    'SELECT * FROM loyalty_accounts WHERE account_id = $1',
                    [accountId]
                );
                if (!accountResult.rows[0]) {
                    throw new LoyaltyServiceError('Account not found', 'NOT_FOUND');
                }

                // Create transaction
                const transactionResult = await client.query(
                    'INSERT INTO transactions (account_id, points, transaction_type, description, transaction_date) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
                    [accountId, points, 'earn', description]
                );

                // Update account points
                await client.query(
                    'UPDATE loyalty_accounts SET total_points = total_points + $1, last_updated = NOW() WHERE account_id = $2',
                    [points, accountId]
                );

                await client.query('COMMIT');
                return transactionResult.rows[0];
            } catch (error) {
                await client.query('ROLLBACK');
                throw new LoyaltyServiceError(
                    error.message || 'Error earning points',
                    error.code || 'INTERNAL_ERROR'
                );
            } finally {
                client.release();
            }
        },

        redeemReward: async (_, { accountId, rewardId }) => {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Get reward details
                const rewardResult = await client.query(
                    'SELECT * FROM rewards WHERE reward_id = $1 AND available = true',
                    [rewardId]
                );
                if (!rewardResult.rows[0]) {
                    throw new LoyaltyServiceError('Reward not found or unavailable', 'NOT_FOUND');
                }
                const pointsRequired = rewardResult.rows[0].points_required;

                // Check account points
                const accountResult = await client.query(
                    'SELECT * FROM loyalty_accounts WHERE account_id = $1',
                    [accountId]
                );
                if (!accountResult.rows[0]) {
                    throw new LoyaltyServiceError('Account not found', 'NOT_FOUND');
                }
                if (accountResult.rows[0].total_points < pointsRequired) {
                    throw new LoyaltyServiceError('Insufficient points', 'INSUFFICIENT_POINTS');
                }

                // Create redemption
                const redemptionResult = await client.query(
                    'INSERT INTO redemptions (account_id, reward_id, redemption_date, status) VALUES ($1, $2, NOW(), $3) RETURNING *',
                    [accountId, rewardId, 'PENDING']
                );

                // Create transaction for points deduction
                await client.query(
                    'INSERT INTO transactions (account_id, points, transaction_type, description, transaction_date) VALUES ($1, $2, $3, $4, NOW())',
                    [accountId, -pointsRequired, 'redeem', `Redeemed reward: ${rewardResult.rows[0].name}`]
                );

                // Update account points
                await client.query(
                    'UPDATE loyalty_accounts SET total_points = total_points - $1, last_updated = NOW() WHERE account_id = $2',
                    [pointsRequired, accountId]
                );

                await client.query('COMMIT');
                return redemptionResult.rows[0];
            } catch (error) {
                await client.query('ROLLBACK');
                throw new LoyaltyServiceError(
                    error.message || 'Error redeeming reward',
                    error.code || 'INTERNAL_ERROR'
                );
            } finally {
                client.release();
            }
        },

        createReward: async (_, { name, pointsRequired, description }) => {
            if (pointsRequired <= 0) {
                throw new LoyaltyServiceError('Points required must be greater than 0', 'INVALID_INPUT');
            }

            try {
                const result = await pool.query(
                    'INSERT INTO rewards (name, points_required, description, available) VALUES ($1, $2, $3, true) RETURNING *',
                    [name, pointsRequired, description]
                );
                return result.rows[0];
            } catch (error) {
                throw new LoyaltyServiceError(
                    error.message || 'Error creating reward',
                    error.code || 'INTERNAL_ERROR'
                );
            }
        },

        // New mutation to update redemption status
        updateRedemptionStatus: async (_, { redemptionId, status }) => {
            const validStatuses = ['PENDING', 'COMPLETED', 'CANCELLED', 'EXPIRED'];
            if (!validStatuses.includes(status)) {
                throw new LoyaltyServiceError('Invalid status', 'INVALID_INPUT');
            }

            try {
                const result = await pool.query(
                    'UPDATE redemptions SET status = $1 WHERE redemption_id = $2 RETURNING *',
                    [status, redemptionId]
                );
                if (!result.rows[0]) {
                    throw new LoyaltyServiceError('Redemption not found', 'NOT_FOUND');
                }
                return result.rows[0];
            } catch (error) {
                throw new LoyaltyServiceError(
                    error.message || 'Error updating redemption status',
                    error.code || 'INTERNAL_ERROR'
                );
            }
        },

        addReward: async (_, { name, pointsRequired, description, available = true, tierRestriction }) => {
            if (pointsRequired <= 0) {
                throw new LoyaltyServiceError('Points required must be greater than 0', 'INVALID_INPUT');
            }
            try {
                const result = await pool.query(
                    'INSERT INTO rewards (name, points_required, description, available, tier_restriction) VALUES ($1, $2, $3, $4, $5) RETURNING reward_id AS "rewardId", name, points_required AS "pointsRequired", description, available, tier_restriction AS "tierRestriction", created_at AS "createdAt", updated_at AS "updatedAt"',
                    [name, pointsRequired, description, available, tierRestriction]
                );
                return result.rows[0];
            } catch (error) {
                throw new LoyaltyServiceError(
                    error.message || 'Error adding reward',
                    error.code || 'INTERNAL_ERROR'
                );
            }
        }
    }
}; 