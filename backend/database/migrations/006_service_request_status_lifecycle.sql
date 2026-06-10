ALTER TABLE service_requests
  DROP CONSTRAINT IF EXISTS service_requests_status_check;

ALTER TABLE service_requests
  ADD CONSTRAINT service_requests_status_check
  CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'COMPLETED', 'WITHDRAWN'));
