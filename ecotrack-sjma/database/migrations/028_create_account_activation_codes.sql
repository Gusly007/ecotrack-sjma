-- 023_create_account_activation_codes.sql
-- Backs the email-code activation flow for new self-registered citizens.
--
-- When a user registers, est_active is set to FALSE on UTILISATEUR and a row
-- is inserted here with a 6-digit code + 30-minute expiry. POST /auth/verify-
-- activation reads this row, flips est_active=TRUE, and deletes it so the
-- code is single-use.
--
-- Existing rows in UTILISATEUR keep est_active=TRUE (no backfill needed) and
-- are not affected by the new flow. The DEFAULT clause in the migration only
-- changes future INSERTs.

CREATE TABLE IF NOT EXISTS account_activation_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(8) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_activation_code ON account_activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_account_activation_email ON account_activation_codes(email);

COMMENT ON TABLE account_activation_codes IS '6-digit activation codes issued on signup. Cleared on successful verify.';
