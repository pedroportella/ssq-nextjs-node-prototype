export type SsqServiceApp = "seniors-card" | "rental-security-subsidy";

export interface BttfSsqApplicant {
  email: string;
  firstName: string;
  fullName: string;
  lastName: string;
  phone: string;
  safeId: string;
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

function randomBase36(length: number) {
  return Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(2, 2 + length).padEnd(length, "0");
}

function randomDigits(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function toEmailStem(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
}

export function generateBttfSsqApplicantData(app: SsqServiceApp): BttfSsqApplicant {
  const safeId = `${Date.now().toString(36)}-${randomBase36(6)}`;
  const person = bttfPeople[Math.floor(Math.random() * bttfPeople.length)] ?? bttfPeople[0];
  const appToken = app === "seniors-card" ? "sc" : "rss";
  const fullName = `${person.firstName} ${person.lastName}`;
  const emailStem = toEmailStem(fullName);

  return {
    email: `${emailStem}+${appToken}-${safeId}@delorean.example`,
    firstName: person.firstName,
    fullName,
    lastName: person.lastName,
    phone: `04${randomDigits(8)}`,
    safeId
  };
}
