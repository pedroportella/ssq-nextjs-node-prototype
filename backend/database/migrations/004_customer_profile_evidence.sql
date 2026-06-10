CREATE TABLE IF NOT EXISTS customer_profile_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_request_id uuid NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  customer_profile_attribute_id uuid REFERENCES customer_profile_attributes(id) ON DELETE SET NULL,
  attribute_key text NOT NULL,
  attribute_value jsonb NOT NULL,
  evidence_source text NOT NULL CHECK (evidence_source IN ('SIMULATED_PROFILE')),
  verification_status text NOT NULL CHECK (verification_status IN ('SIMULATED_VERIFIED', 'SIMULATED_UNVERIFIED')),
  evidence_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_profile_evidence_service_request_id_idx
  ON customer_profile_evidence (service_request_id);

CREATE INDEX IF NOT EXISTS customer_profile_evidence_attribute_key_idx
  ON customer_profile_evidence (attribute_key);
