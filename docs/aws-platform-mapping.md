# AWS Platform Mapping

This note maps the SSQ prototype's implemented review architecture to a plausible AWS production platform.

It is a platform-readiness and selection-criteria evidence pack, not a claim that the current review environment runs on AWS. The live prototype uses DigitalOcean App Platform as review infrastructure only.

## Current Evidence

| Implemented now | What it proves | Evidence |
| --- | --- | --- |
| Four containerized workloads | The backend and three public Next.js apps have explicit runtime boundaries. | [Docker Compose](../docker-compose.yml), [backend Dockerfile](../backend/Dockerfile), app Dockerfiles under [frontend/apps](../frontend/apps). |
| GitHub Actions quality gate | Pull requests and main pushes can run lint, typecheck, tests, guards, builds and Docker image builds. | [CI workflow](../.github/workflows/ci.yml). |
| Local full-stack runtime | PostgreSQL, backend and frontend apps can run together with health/readiness checks. | [local development](local-development.md), [release runbook](release-runbook.md). |
| DigitalOcean review templates | Review deployment specs exist as safe templates, while generated specs and app IDs stay out of Git. | [DigitalOcean deployment](digitalocean-deployment.md), `.do/*.template.yml`. |
| Server-only backend integration | Frontend apps call the backend through server-side service adapters, not browser-visible backend origins. | [frontend deployment readiness](frontend-deployment-readiness.md), [API and security evidence](api-and-security-evidence.md). |
| Operational guardrails | Artifact, frontend-source and browser-bundle guards reduce accidental leakage of local specs, internal URLs and backend-only settings. | [quality guards](../scripts/quality-guards.mjs), [release quality checks](release-runbook.md#release-quality-checks). |

## AWS Production Architecture Mapping

| Prototype surface | AWS production mapping | Production notes |
| --- | --- | --- |
| Backend container | ECS/Fargate service behind an internal or public Application Load Balancer, or an EKS Deployment/Service if SSQ standardises on Kubernetes. | Keep `/health/live` for liveness and `/health/ready` for database-backed readiness. Attach autoscaling, private networking, WAF and access logging as required. |
| Three Next.js app containers | ECS/Fargate services or EKS workloads behind public ALB/CloudFront routing. | Preserve the server-only `BACKEND_INTERNAL_URL` boundary so browser bundles never receive internal backend origins. |
| PostgreSQL review database | Amazon RDS for PostgreSQL or Aurora PostgreSQL. | Enable encryption, backups, point-in-time recovery, maintenance windows, minor-version patching, credential rotation and restore drills. |
| Docker Compose networking | VPC private subnets, security groups, service discovery and internal ALB routes. | Restrict backend/database access to the minimum required workloads. |
| Environment variables | AWS Secrets Manager for secrets and SSM Parameter Store for non-secret config. | Use IAM-based access, rotation where appropriate and separate values per environment. |
| Persisted outbox events | SQS or EventBridge with a worker service or Lambda consumer. | Add retry, idempotency, dead-letter queues, replay and reconciliation controls. |
| Metadata-only document handling | Private S3 buckets with KMS encryption, malware scanning, retention policy and access audit. | Production document handling must include privacy, retention and security review before storing real files. |
| Logs | CloudWatch Logs or the agency central logging platform. | Preserve correlation IDs and redaction rules; add retention and access controls. |
| Metrics and traces | CloudWatch metrics, X-Ray or OpenTelemetry collectors/exporters. | Track request latency, error rate, readiness, saturation, queue lag and dependency failures. |
| Public frontend delivery | ALB plus CloudFront, or S3/CloudFront for static assets if a future frontend shape allows it. | Next.js SSR routes still need a compute runtime; only static/build assets should move to object storage/CDN. |
| Security perimeter | AWS WAF, Shield where required, security groups, IAM, KMS, private subnets and audit trails. | Pair platform controls with application authorization, privacy review and penetration testing. |

## Reference AWS Shape

```text
Public users
  -> Route 53 / managed DNS
  -> CloudFront and/or public ALB
  -> Next.js dashboard app
  -> Next.js Seniors Card app
  -> Next.js Rental Security Subsidy app
  -> internal ALB or service discovery
  -> Node.js/Fastify backend
  -> RDS PostgreSQL

Backend async path
  -> outbox table
  -> SQS or EventBridge
  -> worker service or Lambda
  -> dead-letter queue, replay and reconciliation

Platform services
  -> Secrets Manager / SSM Parameter Store
  -> CloudWatch Logs, metrics and alarms
  -> X-Ray or OpenTelemetry tracing
  -> S3 private document storage with KMS and scanning
```

## Kubernetes Fit

Kubernetes is not needed for the prototype review environment, but the current container boundaries translate cleanly if SSQ runs a shared EKS platform.

Use EKS when:

- the agency already standardises on Kubernetes operations, ingress, policy and observability;
- multiple teams need consistent workload deployment patterns;
- service mesh, admission policy, namespace isolation or shared platform tooling are required;
- rollout strategies, pod disruption budgets, horizontal pod autoscaling and cluster-level policy are operationally supported.

Keep the first production mapping simpler with ECS/Fargate when:

- the services are few and independently deployable;
- the team wants less cluster-management overhead;
- the main platform needs are container runtime, autoscaling, logs, secrets and ALB routing.

Either path should preserve the same application contracts: health/readiness endpoints, server-only backend integration, environment-specific configuration, image scanning, smoke tests and rollback gates.

## Serverless Fit

Serverless components make the most sense around the prototype rather than replacing the core SSR/API workloads immediately.

Good fits:

- SQS/EventBridge/Lambda for outbox processing, notification handoff and integration events;
- scheduled EventBridge jobs for retention, reconciliation and stale-draft cleanup;
- Lambda-backed malware scanning orchestration for uploaded documents;
- Step Functions for longer-running, auditable cross-system workflows if required.

Less suitable for the current core path:

- the Next.js SSR apps and Fastify API are already production-shaped as containers;
- replacing them with Lambda would add adapter/runtime complexity without proving more for this prototype.

## GitHub Actions Deployment Blueprint

The committed workflow is a quality gate. A production pipeline would add environment promotion and AWS deployment jobs without committing secrets or account-specific values.

Recommended shape:

1. Pull request gate:
   - install pinned Node.js and pnpm;
   - run lint, typecheck and unit/integration tests;
   - run artifact and frontend-source guards;
   - build backend, shared packages and all frontend apps;
   - build Docker images and scan them.
2. Main branch build:
   - repeat the quality gate;
   - produce immutable image tags from commit SHA;
   - publish images to ECR;
   - generate SBOM/provenance if required by the platform.
3. Development deployment:
   - assume an AWS IAM role through GitHub OIDC;
   - deploy to ECS/Fargate or EKS;
   - run readiness checks and full-stack smoke against development URLs.
4. Test/staging promotion:
   - require GitHub Environment approval;
   - reuse the same image tags;
   - apply migrations with an explicit pre-deploy step;
   - run smoke, browser and accessibility checks.
5. Production promotion:
   - require manual approval and change record linkage;
   - deploy with rolling or blue/green strategy;
   - run post-deploy smoke;
   - keep rollback to the previous image and migration policy documented.

OIDC outline for a future deploy job:

```yaml
permissions:
  contents: read
  id-token: write

jobs:
  deploy:
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::<account-id>:role/<github-deploy-role>
          aws-region: <region>
      - name: Deploy immutable image tag
        run: ./scripts/deploy-aws.sh <environment> <commit-sha>
      - name: Run smoke checks
        run: pnpm test:full-stack-smoke
```

This is intentionally a blueprint, not an active workflow. Real account IDs, role names, cluster names, hosted zones, certificate ARNs, secrets and environment URLs belong in private platform configuration.

## Deployment Governance

Production deployment should add:

- GitHub Environments for development, test, staging and production;
- OIDC role assumption instead of long-lived cloud keys;
- least-privilege IAM for build, deploy and runtime roles;
- separate AWS accounts or account boundaries per environment where required;
- image signing/scanning and dependency/security scanning;
- migration gates with rollback or forward-fix policy;
- post-deploy smoke checks using environment-scoped URLs;
- alert and dashboard checks before handover;
- release notes, change records and incident rollback contacts.

## What This Answers For The Role

The implemented prototype proves container boundaries, local runtime, GitHub Actions quality automation and review deployment discipline. This mapping shows how those same boundaries translate into AWS, Kubernetes, serverless, CI/CD promotion and platform support patterns without pretending the current DigitalOcean review apps are production infrastructure.

## Production-Next Gaps

- Implement real AWS infrastructure as code with account-specific values kept out of Git.
- Choose ECS/Fargate or EKS based on SSQ platform standards.
- Add ECR publishing, image scanning, SBOM/provenance and deploy jobs.
- Add environment promotion with manual approvals, rollback policy and post-deploy smoke.
- Add RDS backup/PITR/restore drills, secrets rotation, central logs, metrics, tracing and alerting.
- Add SQS/EventBridge/Lambda outbox processing with dead-letter and replay controls.
- Complete security, privacy, accessibility, performance and resilience review before any production claim.
