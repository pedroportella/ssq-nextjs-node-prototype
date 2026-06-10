CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_ref text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  given_name text NOT NULL,
  family_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_profile_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  attribute_key text NOT NULL,
  attribute_value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, attribute_key)
);

CREATE TABLE IF NOT EXISTS transaction_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN ('ENABLED', 'DISABLED')),
  owning_agency text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  transaction_definition_id uuid NOT NULL REFERENCES transaction_definitions(id) ON DELETE RESTRICT,
  reference_number text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'DECLINED')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_profile_attributes_customer_id_idx
  ON customer_profile_attributes (customer_id);

CREATE INDEX IF NOT EXISTS service_requests_customer_id_idx
  ON service_requests (customer_id);

CREATE INDEX IF NOT EXISTS service_requests_transaction_definition_id_idx
  ON service_requests (transaction_definition_id);

CREATE INDEX IF NOT EXISTS service_request_events_service_request_id_idx
  ON service_request_events (service_request_id);
