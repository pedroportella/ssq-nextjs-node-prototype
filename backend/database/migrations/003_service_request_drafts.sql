CREATE TABLE IF NOT EXISTS service_request_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_definition_id uuid NOT NULL REFERENCES transaction_definitions(id) ON DELETE RESTRICT,
  current_step text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS service_request_drafts_customer_id_idx
  ON service_request_drafts (customer_id);

CREATE INDEX IF NOT EXISTS service_request_drafts_transaction_definition_id_idx
  ON service_request_drafts (transaction_definition_id);
