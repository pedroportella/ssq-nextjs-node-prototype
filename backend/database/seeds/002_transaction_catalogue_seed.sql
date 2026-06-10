INSERT INTO feature_flags (flag_key, description, enabled, metadata)
VALUES
  (
    'transaction.dashboard.enabled',
    'Controls access to the customer dashboard prototype surface.',
    true,
    '{"surface": "dashboard"}'::jsonb
  ),
  (
    'transaction.seniors-card.enabled',
    'Controls access to the Seniors Card prototype transaction.',
    true,
    '{"surface": "seniors-card"}'::jsonb
  ),
  (
    'transaction.rental-security-subsidy.enabled',
    'Controls access to the Rental Security Subsidy prototype transaction.',
    true,
    '{"surface": "rental-security-subsidy"}'::jsonb
  )
ON CONFLICT (flag_key) DO UPDATE
SET description = EXCLUDED.description,
    enabled = EXCLUDED.enabled,
    metadata = EXCLUDED.metadata,
    updated_at = now();

INSERT INTO transaction_schemas (transaction_definition_id, schema_version, schema_json)
SELECT id,
       '2026-06-10',
       '{
         "type": "object",
         "title": "Customer dashboard",
         "required": [],
         "properties": {
           "summaryPeriod": {
             "type": "string",
             "enum": ["current", "last-90-days"]
           }
         }
       }'::jsonb
FROM transaction_definitions
WHERE transaction_key = 'dashboard'
ON CONFLICT (transaction_definition_id, schema_version) DO UPDATE
SET schema_json = EXCLUDED.schema_json,
    updated_at = now();

INSERT INTO transaction_schemas (transaction_definition_id, schema_version, schema_json)
SELECT id,
       '2026-06-10',
       '{
         "type": "object",
         "title": "Seniors Card",
         "required": ["dateOfBirth", "residencyStatus"],
         "properties": {
           "dateOfBirth": {
             "type": "string",
             "format": "date"
           },
           "residencyStatus": {
             "type": "string",
             "enum": ["queensland-resident", "moving-to-queensland"]
           },
           "concessionConsent": {
             "type": "boolean"
           }
         }
       }'::jsonb
FROM transaction_definitions
WHERE transaction_key = 'seniors-card'
ON CONFLICT (transaction_definition_id, schema_version) DO UPDATE
SET schema_json = EXCLUDED.schema_json,
    updated_at = now();

INSERT INTO transaction_schemas (transaction_definition_id, schema_version, schema_json)
SELECT id,
       '2026-06-10',
       '{
         "type": "object",
         "title": "Rental Security Subsidy",
         "required": ["householdIncome", "rentalBondAmount"],
         "properties": {
           "householdIncome": {
             "type": "number",
             "minimum": 0
           },
           "rentalBondAmount": {
             "type": "number",
             "minimum": 0
           },
           "supportingDocuments": {
             "type": "array",
             "items": {
               "type": "string"
             }
           }
         }
       }'::jsonb
FROM transaction_definitions
WHERE transaction_key = 'rental-security-subsidy'
ON CONFLICT (transaction_definition_id, schema_version) DO UPDATE
SET schema_json = EXCLUDED.schema_json,
    updated_at = now();
