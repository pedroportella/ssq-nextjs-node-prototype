export const CORRELATION_HEADER = "x-correlation-id";
export const DEMO_CUSTOMER_EMAIL_HEADER = "x-demo-customer-email";
export const DEMO_ROLE_HEADER = "x-ssq-demo-role";
export const DEMO_SUBJECT_HEADER = "x-ssq-demo-subject";
export const DEFAULT_DEMO_CUSTOMER_EMAIL = "demo.customer@example.test";

export const demoRoles = ["Citizen", "ServiceOfficer", "TeamLead", "Admin"] as const;

export type DemoRole = typeof demoRoles[number];

export interface DemoIdentity {
  role: DemoRole;
  subject: string;
}

export function resolveDemoIdentity(input: {
  roleHeader?: string | null;
  subjectHeader?: string | null;
  legacyCustomerEmailHeader?: string | null;
}): DemoIdentity {
  const role = parseDemoRole(input.roleHeader);

  return {
    role,
    subject: input.subjectHeader ?? input.legacyCustomerEmailHeader ?? DEFAULT_DEMO_CUSTOMER_EMAIL
  };
}

export function isCitizen(identity: DemoIdentity): boolean {
  return identity.role === "Citizen";
}

export function canReadSubmittedRecords(identity: DemoIdentity): boolean {
  return identity.role === "ServiceOfficer" || identity.role === "TeamLead" || identity.role === "Admin";
}

export function canReadOperations(identity: DemoIdentity): boolean {
  return identity.role === "Admin";
}

export function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseDemoRole(value?: string | null): DemoRole {
  const normalizedValue = value?.toLowerCase();
  const role = demoRoles.find((candidate) => candidate.toLowerCase() === normalizedValue);

  return role ?? "Citizen";
}
