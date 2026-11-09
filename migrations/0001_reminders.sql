-- PR-SUBSCRIBE-01. Business mail reads status = 'active' only.
-- pending_verify is cleared after 7 days. Unsubscribed rows are kept 90 days.

CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  locale TEXT NOT NULL CHECK (locale IN ('zh-CN', 'en')),
  status TEXT NOT NULL CHECK (status IN ('pending_verify', 'active', 'unsubscribed')),
  verified_at TEXT,
  subscribed_at TEXT,
  unsubscribed_at TEXT,
  last_digest_at TEXT,
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS subscribers_status_idx ON subscribers (status);

CREATE TABLE IF NOT EXISTS verification_codes (
  email TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  wrong_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  send_count INTEGER NOT NULL DEFAULT 0,
  send_window_started_at TEXT NOT NULL,
  last_sent_at TEXT NOT NULL,
  pending_locale TEXT NOT NULL CHECK (pending_locale IN ('zh-CN', 'en')),
  FOREIGN KEY (email) REFERENCES subscribers (email) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS digest_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  sent_at TEXT,
  payload_json TEXT NOT NULL
);
