export const CORRELATION_HEADER = "x-correlation-id";
export const DEMO_CUSTOMER_EMAIL_HEADER = "x-demo-customer-email";
export const DEMO_ROLE_HEADER = "x-ssq-demo-role";
export const DEMO_SUBJECT_HEADER = "x-ssq-demo-subject";
export const DEFAULT_DEMO_CUSTOMER_EMAIL = "demo.customer@example.test";

export const demoRoles = ["Citizen", "ServiceOfficer", "TeamLead", "Admin"] as const;

export type DemoRole = typeof demoRoles[number];
export type IdentityAssuranceLevel = "DEMO_LOW_ASSURANCE";
export type IdentitySource = "DEMO_HEADER";

export interface ResolvedIdentity {
  assuranceLevel: IdentityAssuranceLevel;
  displayName: string;
  email?: string;
  role: DemoRole;
  roles: DemoRole[];
  source: IdentitySource;
  subject: string;
  userId: string;
}

export type DemoIdentity = ResolvedIdentity;

const reviewerRoles: DemoRole[] = ["ServiceOfficer", "TeamLead", "Admin"];

export function resolveDemoIdentity(input: {
  roleHeader?: string | null;
  subjectHeader?: string | null;
  legacyCustomerEmailHeader?: string | null;
}): DemoIdentity {
  const role = parseDemoRole(input.roleHeader);
  const subject = input.subjectHeader ?? input.legacyCustomerEmailHeader ?? DEFAULT_DEMO_CUSTOMER_EMAIL;

  return {
    assuranceLevel: "DEMO_LOW_ASSURANCE",
    displayName: createDemoDisplayName(role, subject),
    email: subject.includes("@") ? subject : undefined,
    role,
    roles: [role],
    source: "DEMO_HEADER",
    subject,
    userId: `demo:${role.toLowerCase()}:${subject}`
  };
}

export function isCitizen(identity: DemoIdentity): boolean {
  return identity.roles.includes("Citizen");
}

export function canReadSubmittedRecords(identity: DemoIdentity): boolean {
  return reviewerRoles.some((role) => identity.roles.includes(role));
}

export function canReadOperations(identity: DemoIdentity): boolean {
  return identity.roles.includes("Admin");
}

export function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseDemoRole(value?: string | null): DemoRole {
  const normalizedValue = value?.toLowerCase();
  const role = demoRoles.find((candidate) => candidate.toLowerCase() === normalizedValue);

  return role ?? "Citizen";
}

function createDemoDisplayName(role: DemoRole, subject: string): string {
  if (role === "Citizen") {
    return subject.includes("@") ? subject.split("@")[0] ?? subject : subject;
  }

  return `${role} ${subject}`;
}
