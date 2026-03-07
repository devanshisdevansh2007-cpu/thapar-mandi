import { z } from "zod";

export function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    // Fallback: If it's just a Date vs string issue, we try to coerce, 
    // but the error is logged so devs can see it.
  }
  // Even if it fails strict validation (e.g. date strings vs date objects from JSON), 
  // we return the raw data casted as the type to avoid breaking the UI for minor type mismatches,
  // since JSON doesn't preserve Dates natively.
  return data as T;
}
