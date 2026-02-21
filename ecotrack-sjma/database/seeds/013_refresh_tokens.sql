-- Seed: 013_refresh_tokens
-- Description: Refresh tokens demo

INSERT INTO refresh_tokens (user_id, token, created_at)
SELECT u.id_utilisateur, v.token, v.created_at
FROM (
  VALUES
    ('admin@ecotrack.local', 'demo_token_admin_001', NOW() - INTERVAL '1 day'),
    ('citoyen1@ecotrack.local', 'demo_token_citoyen1_001', NOW() - INTERVAL '2 days'),
    ('citoyen2@ecotrack.local', 'demo_token_citoyen2_001', NOW() - INTERVAL '3 days')
) AS v(email, token, created_at)
JOIN utilisateur u ON u.email = v.email
WHERE NOT EXISTS (
  SELECT 1 FROM refresh_tokens r
  WHERE r.user_id = u.id_utilisateur
    AND r.token = v.token
);
