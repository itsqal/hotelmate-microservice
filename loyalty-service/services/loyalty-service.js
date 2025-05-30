import pool from '../connection.js';
import { guestQueries, reservationQueries, calculatePoints } from '../clients/hotelease-client.js';

class LoyaltyService {
    async createLoyaltyAccount(guestId) {
        const client = await pool.connect();
        try {
            // Verify guest exists in HotelEase
            const guest = await guestQueries.getGuest(guestId);
            if (!guest) {
                throw new Error('Guest not found in HotelEase system');
            }

            await client.query('BEGIN');

            // Check if account already exists
            const existingAccount = await client.query(
                'SELECT * FROM loyalty_accounts WHERE guest_id = $1',
                [guestId]
            );
            if (existingAccount.rows[0]) {
                throw new Error('Loyalty account already exists');
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
            throw error;
        } finally {
            client.release();
        }
    }

    async processCompletedStay(reservationId) {
        const client = await pool.connect();
        try {
            // Get reservation details from HotelEase
            const reservation = await reservationQueries.getReservation(reservationId);
            if (!reservation || reservation.status !== 'checked-out') {
                throw new Error('Invalid or incomplete reservation');
            }

            await client.query('BEGIN');

            // Get loyalty account
            const accountResult = await client.query(
                'SELECT * FROM loyalty_accounts WHERE guest_id = $1',
                [reservation.guestId]
            );
            if (!accountResult.rows[0]) {
                throw new Error('Loyalty account not found');
            }

            // Calculate points
            const points = calculatePoints(reservation);

            // Create transaction
            const transactionResult = await client.query(
                'INSERT INTO transactions (account_id, points, transaction_type, description, transaction_date) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
                [accountResult.rows[0].account_id, points, 'earn', `Points earned from stay in room ${reservation.room.roomNumber}`]
            );

            // Update account points
            await client.query(
                'UPDATE loyalty_accounts SET total_points = total_points + $1, last_updated = NOW() WHERE account_id = $2',
                [points, accountResult.rows[0].account_id]
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

    async getAccountSummary(accountId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get account details
            const accountResult = await client.query(
                'SELECT * FROM loyalty_accounts WHERE account_id = $1',
                [accountId]
            );
            if (!accountResult.rows[0]) {
                throw new Error('Account not found');
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

            // Get guest details from HotelEase
            const guest = await guestQueries.getGuest(accountResult.rows[0].guest_id);

            await client.query('COMMIT');

            return {
                account: {
                    ...accountResult.rows[0],
                    guestName: guest.fullName,
                    guestEmail: guest.email
                },
                recentTransactions: transactionsResult.rows,
                pendingRedemptions: redemptionsResult.rows
            };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

export default new LoyaltyService(); 