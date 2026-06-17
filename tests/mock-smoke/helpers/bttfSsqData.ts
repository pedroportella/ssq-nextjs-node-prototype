export type SsqServiceApp = "seniors-card" | "rental-security-subsidy";

export interface BttfSsqApplicant {
  email: string;
  firstName: string;
  fullName: string;
  lastName: string;
  phone: string;
  safeId: string;
}

export interface BttfSsqApplicantOptions {
  now?: Date | number;
  scenarioId?: string;
  sequence?: number;
}

const bttfPeople = [
  { firstName: "Marty", lastName: "McFly" },
  { firstName: "Jennifer", lastName: "Parker" },
  { firstName: "Emmett", lastName: "Brown" },
  { firstName: "Clara", lastName: "Clayton" },
  { firstName: "Lorraine", lastName: "Baines" },
  { firstName: "George", lastName: "McFly" },
  { firstName: "Biff", lastName: "Tannen" }
];

function stableHash(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = ((hash << 5) - hash) + character.charCodeAt(0);
    hash |= 0;
  }

  return Math.abs(hash);
}

function hashBase36(value: string, length: number) {
  return stableHash(value).toString(36).slice(0, length).padEnd(length, "0");
}

function hashDigits(value: string, length: number) {
  const seed = String(stableHash(value)).padEnd(length, "0");

  return seed.slice(0, length);
}

function toEmailStem(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
}

function toTimestamp(value: Date | number | undefined) {
  if (value instanceof Date) {
    return value.getTime();
  }

  return value ?? Date.now();
}

export function generateBttfSsqApplicantData(
  app: SsqServiceApp,
  options: BttfSsqApplicantOptions = {}
): BttfSsqApplicant {
  const seed = `${app}:${options.scenarioId ?? "default"}:${options.sequence ?? 0}`;
  const safeId = `${toTimestamp(options.now).toString(36)}-${hashBase36(seed, 6)}`;
  const person = bttfPeople[stableHash(seed) % bttfPeople.length] ?? bttfPeople[0];
  const appToken = app === "seniors-card" ? "sc" : "rss";
  const fullName = `${person.firstName} ${person.lastName}`;
  const emailStem = toEmailStem(fullName);

  return {
    email: `${emailStem}+${appToken}-${safeId}@delorean.example`,
    firstName: person.firstName,
    fullName,
    lastName: person.lastName,
    phone: `04${hashDigits(seed, 8)}`,
    safeId
  };
}
