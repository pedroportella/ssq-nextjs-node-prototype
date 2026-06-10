INSERT INTO customers (id, external_ref, email, given_name, family_name)
VALUES (
  '10000000-0000-4000-8000-000000000001',
  'MYQLD-DEMO-001',
  'demo.customer@example.test',
  'Taylor',
  'Queensland'
)
ON CONFLICT (external_ref) DO UPDATE
SET email = EXCLUDED.email,
    given_name = EXCLUDED.given_name,
    family_name = EXCLUDED.family_name,
    updated_at = now();

INSERT INTO customer_profile_attributes (customer_id, attribute_key, attribute_value)
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'preferred_contact',
    '{"channel": "email", "verified": true}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    'residency',
    '{"state": "QLD", "verified": true}'::jsonb
  )
ON CONFLICT (customer_id, attribute_key) DO UPDATE
SET attribute_value = EXCLUDED.attribute_value,
    updated_at = now();

INSERT INTO transaction_definitions (id, transaction_key, label, description, status, owning_agency)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    'dashboard',
    'Customer dashboard',
    'Prototype customer portal overview and service request summary.',
    'ENABLED',
    'Smart Service Queensland'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'seniors-card',
    'Seniors Card',
    'Prototype Seniors Card transaction for eligibility and application flow.',
    'ENABLED',
    'Smart Service Queensland'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'rental-security-subsidy',
    'Rental Security Subsidy',
    'Prototype Rental Security Subsidy transaction for housing support workflow.',
    'ENABLED',
    'Smart Service Queensland'
  )
ON CONFLICT (transaction_key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    owning_agency = EXCLUDED.owning_agency,
    updated_at = now();

INSERT INTO service_requests (
  id,
  customer_id,
  transaction_definition_id,
  reference_number,
  status,
  payload
)
VALUES (
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  'SSQ-DEMO-0001',
  'SUBMITTED',
  '{"submittedVia": "seed", "prototype": true}'::jsonb
)
ON CONFLICT (reference_number) DO UPDATE
SET status = EXCLUDED.status,
    payload = EXCLUDED.payload,
    updated_at = now();

INSERT INTO service_request_events (service_request_id, event_type, event_payload)
VALUES (
  '30000000-0000-4000-8000-000000000001',
  'SERVICE_REQUEST_SEEDED',
  '{"source": "001_prototype_seed"}'::jsonb
);
