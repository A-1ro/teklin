export interface PromptTemplate {
  id: string;
  version: string;
  system: string;
  /** User message with {{variable}} placeholders */
  user: string;
}

/**
 * Replace all `{{key}}` placeholders in a template string with the
 * corresponding values from the variables map.
 */
function interpolate(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    return Object.prototype.hasOwnProperty.call(variables, key)
      ? variables[key]
      : `{{${key}}}`;
  });
}

/**
 * Render a prompt template by substituting all `{{variable}}` placeholders.
 */
export function renderPrompt(
  template: PromptTemplate,
  variables: Record<string, string>
): { system: string; user: string } {
  return {
    system: interpolate(template.system, variables),
    user: interpolate(template.user, variables),
  };
}

// ---------------------------------------------------------------------------
// Built-in templates
// ---------------------------------------------------------------------------

export const templates = {
  rewrite: {
    id: "rewrite",
    version: "1.0.0",
    system: [
      "You are an expert technical writing coach for software engineers.",
      "Your task is to rewrite the user's English text to be clear, concise,",
      "and appropriate for the context provided.",
      "Explain the key improvements briefly.",
    ].join(" "),
    user: [
      "Context: {{context}}",
      "",
      "Original text:",
      "{{original}}",
      "",
      "Please rewrite the above text and explain the improvements.",
    ].join("\n"),
  } satisfies PromptTemplate,

  placement: {
    id: "placement",
    version: "1.0.0",
    system: [
      "You are an English proficiency evaluator for software engineers.",
      "Assess the given text for technical accuracy, grammar, clarity, and",
      "professional tone. Return a JSON object with fields:",
      "score (0-100), level (L1|L2|L3|L4), and feedback (string).",
    ].join(" "),
    user: [
      "Evaluate the following text written by a software engineer:",
      "",
      "{{text}}",
      "",
      'Return only valid JSON: {"score": <number>, "level": "<L1|L2|L3|L4>",',
      '"feedback": "<string>"}',
    ].join("\n"),
  } satisfies PromptTemplate,

  lesson_gen: {
    id: "lesson_gen",
    version: "1.0.0",
    system: [
      "You are a curriculum designer for a technical English learning app.",
      "Create a short, practical lesson for software engineers at the",
      "specified level and domain. Focus on real-world usage patterns.",
    ].join(" "),
    user: [
      "Generate a lesson for:",
      "- Level: {{level}}",
      "- Domain: {{domain}}",
      "- Skill: {{skill}}",
      "- Topic: {{topic}}",
      "",
      "Include 3-5 example phrases with explanations.",
    ].join("\n"),
  } satisfies PromptTemplate,
} as const;
