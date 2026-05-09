import type { DrizzleClient } from "../../db";
import { focusAppearances } from "../../db/schema";
import type {
  RewriteContext,
  ExerciseType,
  FocusViewpoint,
  Domain,
} from "@teklin/shared";

const PHRASE_MAX_LENGTH = 200;

// Strip Unicode control chars (\p{Cc}: C0/C1 controls including newlines,
// tabs, NUL, DEL) and quote chars. Stored phrases are later re-injected into
// LLM prompts via formatProfileForPrompt, so we sanitize before persistence
// to make naive LLM-to-LLM prompt injection harder and to bound prompt size.
const PHRASE_DISALLOWED = /[\p{Cc}"'`]/gu;

export function sanitizePhrase(phrase: string): string {
  return phrase
    .replace(PHRASE_DISALLOWED, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PHRASE_MAX_LENGTH);
}

export function deriveViewpoint(context: RewriteContext): FocusViewpoint {
  return context === "pr_comment" ? "reviewer" : "writer";
}

export async function recordFocusAppearance(
  db: DrizzleClient,
  params: {
    userId: string;
    lessonId: string;
    phrase: string;
    context: RewriteContext;
    domain: Domain;
    exerciseTypes: ExerciseType[];
    appearedAt: number;
  }
): Promise<void> {
  const viewpoint = deriveViewpoint(params.context);
  await db
    .insert(focusAppearances)
    .values({
      id: crypto.randomUUID(),
      userId: params.userId,
      lessonId: params.lessonId,
      phrase: sanitizePhrase(params.phrase),
      context: params.context,
      domain: params.domain,
      viewpoint,
      exerciseTypes: JSON.stringify(params.exerciseTypes),
      appearedAt: params.appearedAt,
    })
    .onConflictDoNothing();
}
