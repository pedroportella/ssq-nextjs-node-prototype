CREATE TABLE IF NOT EXISTS transaction_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_definition_id uuid NOT NULL REFERENCES transaction_definitions(id) ON DELETE CASCADE,
  schema_version text NOT NULL,
  schema_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transaction_definition_id, schema_version)
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL UNIQUE,
  description text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transaction_schemas_transaction_definition_id_idx
  ON transaction_schemas (transaction_definition_id);

CREATE INDEX IF NOT EXISTS feature_flags_enabled_idx
  ON feature_flags (enabled);
