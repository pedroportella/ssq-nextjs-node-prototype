CREATE TABLE IF NOT EXISTS supporting_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_request_draft_id uuid REFERENCES service_request_drafts(id) ON DELETE CASCADE,
  service_request_id uuid REFERENCES service_requests(id) ON DELETE CASCADE,
  category text NOT NULL,
  file_name text NOT NULL,
  file_extension text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0),
  storage_key text NOT NULL UNIQUE,
  upload_status text NOT NULL,
  scan_status text NOT NULL,
  retention_policy text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (service_request_draft_id IS NOT NULL AND service_request_id IS NULL)
    OR (service_request_draft_id IS NULL AND service_request_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS supporting_documents_customer_id_idx
  ON supporting_documents (customer_id);

CREATE INDEX IF NOT EXISTS supporting_documents_service_request_draft_id_idx
  ON supporting_documents (service_request_draft_id);

CREATE INDEX IF NOT EXISTS supporting_documents_service_request_id_idx
  ON supporting_documents (service_request_id);
