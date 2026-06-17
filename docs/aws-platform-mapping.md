# AWS Platform Mapping

Maps the implemented review prototype to a plausible AWS production platform. The live review apps run on DigitalOcean, not AWS.

## Current Evidence

- Backend and three Next.js apps are containerised with Dockerfiles and Compose.
- CI can run install, lint/typecheck, tests, guards, builds and Docker image builds.
- Frontend apps call the backend through server-side service adapters.
- DigitalOcean templates prove review deployment discipline without claiming production hosting.
- Guards check artefacts, terminology, browser bundle leakage and frontend source boundaries.

## Production Mapping

| Prototype surface | AWS production fit |
| --- | --- |
| Backend container | ECS/Fargate behind an ALB, or EKS if the agency platform standardises on Kubernetes. |
| Next.js app containers | ECS/Fargate or EKS services behind ALB/CloudFront routing. |
| PostgreSQL | RDS or Aurora PostgreSQL with encryption, backups, restore drills and rotation. |
| Internal service calls | VPC private subnets, security groups, service discovery and internal routing. |
| Secrets/config | Secrets Manager for secrets and SSM Parameter Store for non-secret config. |
| Outbox events | SQS or EventBridge plus worker service or Lambda consumer. |
| Document storage | Private S3 with KMS, malware scanning, retention and access audit. |
| Logs/metrics/traces | CloudWatch, X-Ray or OpenTelemetry exporters, plus agency observability tooling. |
| Security perimeter | WAF, IAM, KMS, private networking, audit trails and platform policy controls. |

## Kubernetes And Serverless Fit

EKS is a good fit if SSQ already has shared Kubernetes operations, ingress, policy, observability and team support. ECS/Fargate is simpler if the product only needs a few containerised services with ALB routing and autoscaling.

Serverless fits best around the core workloads: outbox processing, scheduled reconciliation, stale-draft cleanup, document scanning orchestration and longer-running cross-system workflows.

## GitHub Actions Promotion Shape

1. Run quality checks and tests.
2. Build backend and frontend images.
3. Scan dependencies and images.
4. Publish images to ECR through OIDC-assumed AWS roles.
5. Promote through environments with approvals and protected secrets.
6. Run smoke checks after deployment and keep rollback paths explicit.

## Honest Gaps

AWS, Kubernetes and serverless components are mapped, not implemented, in this review environment. Real account IDs, cluster names, IAM roles, domains and secrets belong in private platform configuration.
