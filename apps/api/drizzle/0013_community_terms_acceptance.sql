ALTER TABLE users ADD COLUMN IF NOT EXISTS community_terms_accepted_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS community_terms_version text;
