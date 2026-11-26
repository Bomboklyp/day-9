import { query } from "../utils/database";

export async function reserveLoginAttempt(key: string) {
  return (
    await query<{ attempts: number; retry_seconds: number }>(
      `INSERT INTO login_attempts(key_hash,attempts,reset_at) VALUES($1,1,now()+interval '15 minutes')
       ON CONFLICT(key_hash) DO UPDATE SET
         attempts=CASE WHEN login_attempts.reset_at<=now() THEN 1 ELSE login_attempts.attempts+1 END,
         reset_at=CASE WHEN login_attempts.reset_at<=now() THEN now()+interval '15 minutes' ELSE login_attempts.reset_at END
       RETURNING attempts, GREATEST(1,ceil(extract(epoch FROM reset_at-now())))::int AS retry_seconds`,
      [key],
    )
  ).rows[0]!;
}

export async function clearLoginAttempts(key: string) {
  await query("DELETE FROM login_attempts WHERE key_hash=$1", [key]);
}
