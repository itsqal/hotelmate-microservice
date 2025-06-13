import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { GraphQLClient } from 'graphql-request';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// GraphQL client setup
const loyaltyClient = new GraphQLClient(process.env.LOYALTY_SERVICE_URL || 'http://localhost:4001/graphql');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// Routes
app.get('/', async (req, res) => {
    try {
        const { rewards } = await loyaltyClient.request(`
            query {
                rewards(available: true) {
                    rewardId
                    name
                    pointsRequired
                    description
                    tierRestriction
                }
            }
        `);
        res.render('home', { rewards });
    } catch (error) {
        console.error('Error fetching rewards:', error);
        res.render('home', { rewards: [], error: 'Failed to load rewards' });
    }
});

app.get('/account/:id', async (req, res) => {
    try {
        const { accountSummary } = await loyaltyClient.request(`
            query($accountId: ID!) {
                accountSummary(accountId: $accountId) {
                    account {
                        accountId
                        totalPoints
                        tier
                        tierMultiplier
                        pointsExpiring
                        nextTierPoints
                    }
                    recentTransactions {
                        transactionId
                        points
                        transactionType
                        description
                        transactionDate
                    }
                    pendingRedemptions {
                        redemptionId
                        rewardName
                        pointsUsed
                        redemptionDate
                    }
                    tierProgress {
                        currentTier
                        currentPoints
                        nextTier
                        pointsToNextTier
                        progressPercentage
                    }
                    expiringPoints {
                        transactionId
                        points
                        expiryDate
                    }
                }
            }
        `, { accountId: req.params.id });

        const { analytics } = await loyaltyClient.request(`
            query($accountId: ID!) {
                analytics(accountId: $accountId) {
                    totalPointsEarned
                    totalPointsRedeemed
                    averagePointsPerMonth
                    favoriteRewards {
                        reward {
                            name
                            pointsRequired
                        }
                        redemptionCount
                        totalPointsSpent
                    }
                    tierHistory {
                        tier
                        achievedDate
                        pointsAtAchievement
                    }
                }
            }
        `, { accountId: req.params.id });

        res.render('account', { 
            summary: accountSummary,
            analytics
        });
    } catch (error) {
        console.error('Error fetching account details:', error);
        res.render('error', { 
            message: 'Failed to load account details',
            error
        });
    }
});

app.post('/redeem/:accountId', async (req, res) => {
    try {
        const { redeemReward } = await loyaltyClient.request(`
            mutation($accountId: ID!, $rewardId: ID!) {
                redeemReward(accountId: $accountId, rewardId: $rewardId) {
                    redemptionId
                    status
                    rewardName
                    pointsUsed
                }
            }
        `, {
            accountId: req.params.accountId,
            rewardId: req.body.rewardId
        });

        res.redirect(`/account/${req.params.accountId}`);
    } catch (error) {
        console.error('Error redeeming reward:', error);
        res.render('error', {
            message: 'Failed to redeem reward',
            error
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

app.listen(port, () => {
    console.log(`Loyalty frontend listening at http://localhost:${port}`);
}); 