-- Sylvia's events + reservations schema

CREATE TABLE IF NOT EXISTS events (
  id           TEXT PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  start_date   DATE NOT NULL,
  start_time   TEXT NOT NULL,
  end_time     TEXT,
  day_label    TEXT NOT NULL,
  recurring    BOOLEAN NOT NULL DEFAULT FALSE,
  image_url    TEXT
);

CREATE TABLE IF NOT EXISTS reservations (
  id                BIGSERIAL PRIMARY KEY,
  event_id          TEXT NOT NULL REFERENCES events(id),
  guest_name        TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  party_size        INTEGER NOT NULL CHECK (party_size BETWEEN 1 AND 20),
  reservation_date  DATE NOT NULL,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_event ON reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date  ON reservations(reservation_date);
