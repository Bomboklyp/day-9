CREATE TABLE IF NOT EXISTS login_attempts (
  key_hash text PRIMARY KEY,
  attempts integer NOT NULL CHECK (attempts > 0),
  reset_at timestamptz NOT NULL
);
