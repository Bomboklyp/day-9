ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE requests ADD CONSTRAINT requests_status_check CHECK(status IN ('new','assigned','in_progress','waiting','resolved','closed','escalated'));
ALTER TABLE requests ADD COLUMN IF NOT EXISTS escalation_reason text;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS response_due_at timestamptz;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS responded_at timestamptz;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE requests ADD CONSTRAINT requests_escalation_reason_check CHECK(status <> 'escalated' OR length(trim(escalation_reason)) > 0 AND escalation_reason IS NOT NULL);
CREATE TABLE sla_policies (
 priority text PRIMARY KEY CHECK(priority IN ('urgent','high','medium','low')),
 response_minutes integer NOT NULL CHECK(response_minutes BETWEEN 1 AND 43200),
 resolution_minutes integer NOT NULL CHECK(resolution_minutes BETWEEN response_minutes AND 43200),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE attachments (
 id uuid PRIMARY KEY, request_id integer NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
 author_id text NOT NULL REFERENCES users(id), filename text NOT NULL,
 mime_type text NOT NULL CHECK(mime_type IN ('image/png','image/jpeg','application/pdf')),
 size integer NOT NULL CHECK(size BETWEEN 1 AND 10485760), content bytea NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), CHECK(octet_length(content)=size)
);
CREATE INDEX attachments_request_idx ON attachments(request_id);
CREATE TABLE notifications (
 id uuid PRIMARY KEY, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 request_id integer NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('assignment','escalation','sla','status')),
 title text NOT NULL, message text NOT NULL, dedupe_key text NOT NULL,
 read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,dedupe_key)
);
CREATE INDEX notifications_user_idx ON notifications(user_id,created_at DESC);
ALTER TABLE request_events DROP CONSTRAINT IF EXISTS request_events_kind_check;
ALTER TABLE request_events ADD CONSTRAINT request_events_kind_check CHECK(kind IN ('created','status','comment','attachment'));
