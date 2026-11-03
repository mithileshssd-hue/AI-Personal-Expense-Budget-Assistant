-- Migration 0004: Savings transactions, goals, and balance integrity triggers

CREATE TABLE IF NOT EXISTS savings_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    amount REAL NOT NULL CHECK (amount > 0),
    purpose TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS savings_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    target_amount REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_savings_tx_user_date ON savings_transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_savings_tx_user_type ON savings_transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);

CREATE TRIGGER IF NOT EXISTS trg_prevent_negative_savings_balance_insert
BEFORE INSERT ON savings_transactions
WHEN NEW.type = 'withdrawal'
BEGIN
    SELECT CASE
        WHEN (
            COALESCE((SELECT SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) FROM savings_transactions WHERE user_id = NEW.user_id), 0) < NEW.amount
        )
        THEN RAISE(ABORT, 'Withdrawal cannot exceed available savings balance.')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_prevent_negative_savings_balance_update
BEFORE UPDATE ON savings_transactions
BEGIN
    SELECT CASE
        WHEN (
            COALESCE((SELECT SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) FROM savings_transactions WHERE user_id = NEW.user_id AND id != OLD.id), 0)
            + (CASE WHEN NEW.type = 'deposit' THEN NEW.amount ELSE -NEW.amount END) < 0
        )
        THEN RAISE(ABORT, 'Savings update would result in a negative savings balance.')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_prevent_negative_savings_balance_delete
BEFORE DELETE ON savings_transactions
WHEN OLD.type = 'deposit'
BEGIN
    SELECT CASE
        WHEN (
            COALESCE((SELECT SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) FROM savings_transactions WHERE user_id = OLD.user_id), 0) - OLD.amount < 0
        )
        THEN RAISE(ABORT, 'Cannot delete deposit: would result in a negative savings balance.')
    END;
END;

