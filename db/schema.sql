-- Sylvia's events + reservations schema

CREATE TABLE IF NOT EXISTS events (
  id           TEXT PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  start_date   DATE NOT NULL,
  end_date     DATE,
  start_time   TEXT NOT NULL,
  end_time     TEXT,
  day_label    TEXT NOT NULL,
  recurrence_type TEXT NOT NULL DEFAULT 'Does not Repeat',
  recurring    BOOLEAN NOT NULL DEFAULT FALSE,
  image_url    TEXT
);

CREATE TABLE IF NOT EXISTS reservations (
  id                BIGSERIAL PRIMARY KEY,
  event_id          TEXT NOT NULL REFERENCES events(id),
  guest_name        TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  party_size        INTEGER NOT NULL,
  reservation_date  DATE NOT NULL,
  notes             TEXT,
  package           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent upgrades for installs created before group packages / the 200 cap.
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS package TEXT;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_party_size_check;
ALTER TABLE reservations
  ADD CONSTRAINT reservations_party_size_check CHECK (party_size BETWEEN 1 AND 200);

CREATE INDEX IF NOT EXISTS idx_reservations_event ON reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date  ON reservations(reservation_date);
