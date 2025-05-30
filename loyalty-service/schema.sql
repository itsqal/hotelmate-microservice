-- Create tables for the loyalty service

-- Guests table
CREATE TABLE IF NOT EXISTS guests (
    guest_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Loyalty accounts table
CREATE TABLE IF NOT EXISTS loyalty_accounts (
    account_id SERIAL PRIMARY KEY,
    guest_id INTEGER REFERENCES guests(guest_id) ON DELETE CASCADE,
    total_points INTEGER NOT NULL DEFAULT 0,
    tier VARCHAR(50) NOT NULL DEFAULT 'BRONZE',
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_tier CHECK (tier IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM'))
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES loyalty_accounts(account_id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjust'))
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
    reward_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    points_required INTEGER NOT NULL CHECK (points_required > 0),
    description TEXT,
    available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
    redemption_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES loyalty_accounts(account_id) ON DELETE CASCADE,
    reward_id INTEGER REFERENCES rewards(reward_id) ON DELETE RESTRICT,
    redemption_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'EXPIRED'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_guest_id ON loyalty_accounts(guest_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_redemptions_account_id ON redemptions(account_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);

-- Create function to update tier based on points
CREATE OR REPLACE FUNCTION update_loyalty_tier()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tier := CASE
        WHEN NEW.total_points >= 10000 THEN 'PLATINUM'
        WHEN NEW.total_points >= 5000 THEN 'GOLD'
        WHEN NEW.total_points >= 1000 THEN 'SILVER'
        ELSE 'BRONZE'
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update tier
CREATE TRIGGER update_tier_trigger
    BEFORE UPDATE ON loyalty_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_tier();

-- Create function to update reward's updated_at timestamp
CREATE OR REPLACE FUNCTION update_reward_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update reward's timestamp
CREATE TRIGGER update_reward_timestamp_trigger
    BEFORE UPDATE ON rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_reward_timestamp(); 