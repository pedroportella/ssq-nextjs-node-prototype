CREATE TABLE IF NOT EXISTS submission_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  summary_format text NOT NULL CHECK (summary_format IN ('TEXT')),
  content_type text NOT NULL,
  file_name text NOT NULL,
  summary_payload jsonb NOT NULL,
  summary_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_request_id)
);

CREATE INDEX IF NOT EXISTS submission_summaries_service_request_id_idx
  ON submission_summaries (service_request_id);
