ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS assigned_officer_subject text,
  ADD COLUMN IF NOT EXISTS assigned_team text,
  ADD COLUMN IF NOT EXISTS last_touched_by text,
  ADD COLUMN IF NOT EXISTS last_touched_at timestamptz;

CREATE INDEX IF NOT EXISTS service_requests_assigned_team_idx
  ON service_requests (assigned_team);

CREATE INDEX IF NOT EXISTS service_requests_assigned_officer_subject_idx
  ON service_requests (assigned_officer_subject);

CREATE INDEX IF NOT EXISTS service_requests_last_touched_at_idx
  ON service_requests (last_touched_at);
