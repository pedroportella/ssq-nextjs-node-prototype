import { z } from "zod";

export interface FieldValidationError {
  field: string;
  message: string;
}

type JsonSchemaProperty = {
  type?: string;
  enum?: unknown[];
  format?: string;
  minimum?: number;
  items?: JsonSchemaProperty;
};

type JsonSchemaObject = {
  type?: string;
  required?: unknown[];
  properties?: Record<string, JsonSchemaProperty>;
};

export function validatePayloadAgainstSchema(input: {
  payload: unknown;
  schema: Record<string, unknown>;
}): { ok: true; payload: Record<string, unknown> } | { ok: false; fieldErrors: FieldValidationError[] } {
  if (!isPlainObject(input.payload)) {
    return {
      ok: false,
      fieldErrors: [
        {
          field: "$",
          message: "Payload must be an object."
        }
      ]
    };
  }

  const schema = input.schema as JsonSchemaObject;
  const required = new Set((schema.required ?? []).filter((field): field is string => typeof field === "string"));
  const properties = schema.properties ?? {};
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [field, property] of Object.entries(properties)) {
    const validator = createPropertyValidator(property);
    shape[field] = required.has(field) ? validator : validator.optional();
  }

  const result = z.object(shape).passthrough().safeParse(input.payload);

  if (!result.success) {
    return {
      ok: false,
      fieldErrors: result.error.issues.map((issue) => ({
        field: issue.path.length > 0 ? issue.path.join(".") : "$",
        message: issue.message
      }))
    };
  }

  return {
    ok: true,
    payload: result.data
  };
}

function createPropertyValidator(property: JsonSchemaProperty): z.ZodTypeAny {
  switch (property.type) {
    case "string": {
      let validator: z.ZodTypeAny = z.string();

      if (property.enum?.every((value): value is string => typeof value === "string") && property.enum.length > 0) {
        validator = validator.refine((value) => property.enum?.includes(value), {
          message: `Must be one of: ${property.enum.join(", ")}.`
        });
      }

      if (property.format === "date") {
        validator = validator.refine(isIsoDate, {
          message: "Must be a valid date in YYYY-MM-DD format."
        });
      }

      return validator;
    }
    case "boolean":
      return z.boolean();
    case "number": {
      let validator = z.number();

      if (typeof property.minimum === "number") {
        validator = validator.min(property.minimum);
      }

      return validator;
    }
    case "array":
      return z.array(createPropertyValidator(property.items ?? {}));
    default:
      return z.unknown();
  }
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
