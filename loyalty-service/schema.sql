-- Create tables for the loyalty service

-- Guests table
CREATE TABLE IF NOT EXISTS guests (
    guest_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tier configurations table
CREATE TABLE IF NOT EXISTS tier_configs (
    tier_name VARCHAR(50) PRIMARY KEY,
    points_required INTEGER NOT NULL,
    multiplier DECIMAL(3,2) NOT NULL,
    benefits TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty accounts table
CREATE TABLE IF NOT EXISTS loyalty_accounts (
    account_id SERIAL PRIMARY KEY,
    guest_id INTEGER REFERENCES guests(guest_id),
    total_points INTEGER DEFAULT 0,
    tier VARCHAR(50) REFERENCES tier_configs(tier_name),
    tier_multiplier DECIMAL(3,2) DEFAULT 1.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES loyalty_accounts(account_id),
    base_points INTEGER NOT NULL,
    multiplier DECIMAL(3,2) NOT NULL,
    points INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rewards table
CREATE TABLE IF NOT EXISTS rewards (
    reward_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    points_required INTEGER NOT NULL,
    description TEXT,
    available BOOLEAN DEFAULT true,
    tier_restriction VARCHAR(50) REFERENCES tier_configs(tier_name),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
    redemption_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES loyalty_accounts(account_id),
    reward_id INTEGER REFERENCES rewards(reward_id),
    points_used INTEGER NOT NULL,
    redemption_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tier history table
CREATE TABLE IF NOT EXISTS tier_history (
    history_id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES loyalty_accounts(account_id),
    tier VARCHAR(50) REFERENCES tier_configs(tier_name),
    achieved_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points_at_achievement INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_guest_id ON loyalty_accounts(guest_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_expiry_date ON transactions(expiry_date);
CREATE INDEX IF NOT EXISTS idx_redemptions_account_id ON redemptions(account_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_tier_history_account_id ON tier_history(account_id);

-- Insert default tier configurations
INSERT INTO tier_configs (tier_name, points_required, multiplier, benefits) VALUES
    ('BRONZE', 0, 1.00, ARRAY['Basic rewards access']),
    ('SILVER', 1000, 1.25, ARRAY['Basic rewards access', 'Priority customer service']),
    ('GOLD', 5000, 1.50, ARRAY['Basic rewards access', 'Priority customer service', 'Room upgrades']),
    ('PLATINUM', 10000, 2.00, ARRAY['Basic rewards access', 'Priority customer service', 'Room upgrades', 'Late checkout', 'Welcome amenities'])
ON CONFLICT (tier_name) DO NOTHING;

-- Create function to update tier based on points
CREATE OR REPLACE FUNCTION update_account_tier()
RETURNS TRIGGER AS $$
DECLARE
    new_tier VARCHAR(50);
    new_multiplier DECIMAL(3,2);
BEGIN
    SELECT tier_name, multiplier INTO new_tier, new_multiplier
    FROM tier_configs
    WHERE points_required <= NEW.total_points
    ORDER BY points_required DESC
    LIMIT 1;

    IF NEW.tier != new_tier THEN
        NEW.tier := new_tier;
        NEW.tier_multiplier := new_multiplier;
        
        -- Record tier change in history
        INSERT INTO tier_history (account_id, tier, points_at_achievement)
        VALUES (NEW.account_id, new_tier, NEW.total_points);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic tier updates
CREATE TRIGGER update_tier_trigger
    BEFORE UPDATE ON loyalty_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_account_tier();

-- Create function to handle point expiration
CREATE OR REPLACE FUNCTION handle_point_expiration()
RETURNS void AS $$
BEGIN
    -- Update expired points
    UPDATE loyalty_accounts la
    SET total_points = total_points - (
        SELECT COALESCE(SUM(points), 0)
        FROM transactions
        WHERE account_id = la.account_id
        AND expiry_date <= CURRENT_TIMESTAMP
        AND transaction_type = 'EARN'
    )
    WHERE EXISTS (
        SELECT 1
        FROM transactions
        WHERE account_id = la.account_id
        AND expiry_date <= CURRENT_TIMESTAMP
        AND transaction_type = 'EARN'
    );

    -- Mark expired transactions
    UPDATE transactions
    SET transaction_type = 'EXPIRED'
    WHERE expiry_date <= CURRENT_TIMESTAMP
    AND transaction_type = 'EARN';
END;
$$ LANGUAGE plpgsql;

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