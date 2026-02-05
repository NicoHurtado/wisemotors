// NLU (Natural Language Understanding) wrapper
// Re-exporting from categorization.ts to maintain backward compatibility
// while migrating to the new CategorizedIntent system

import { categorizeQuery, CategorizedIntentSchema, type CategorizedIntent } from './categorization';

// Re-export types and functions
export { CategorizedIntentSchema, type CategorizedIntent };

// Wrapper for backward compatibility if needed, but prefer categorizeQuery directly
export async function extractIntent(prompt: string): Promise<CategorizedIntent> {
  return categorizeQuery(prompt);
}

