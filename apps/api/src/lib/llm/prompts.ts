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
      "---BEGIN USER TEXT---",
      "{{original}}",
      "---END USER TEXT---",
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
      "Evaluate the following text:",
      "",
      "---BEGIN USER TEXT---",
      "{{text}}",
      "---END USER TEXT---",
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

  daily_lesson: {
    id: "daily_lesson",
    version: "1.0.0",
    system: [
      "You are an expert technical English curriculum designer for software engineers.",
      "Create personalized daily lessons that are practical, engaging, and focused on",
      "real-world engineering communication (PRs, commits, Slack, GitHub Issues).",
      "Always respond with valid JSON only, no markdown, no extra text.",
    ].join(" "),
    user: [
      "Generate a daily 5-minute technical English lesson with the following parameters:",
      "- User level: {{level}} (L1=beginner, L2=elementary, L3=intermediate, L4=advanced)",
      "- Domain: {{domain}} (web/infra/ml/mobile)",
      "- Context: {{context}} (commit_message/pr_comment/github_issue/slack/general)",
      "- Weaknesses to focus on: {{weaknesses}}",
      "",
      "The lesson MUST have exactly this structure as valid JSON:",
      "{",
      '  "warmup": {',
      '    "questions": [',
      "      {",
      '        "id": "w1",',
      '        "phrase": "<English phrase>",',
      '        "translation": "<Japanese translation>",',
      '        "context": "<usage context>",',
      '        "type": "multiple_choice",',
      '        "choices": [{"id": "a", "text": "..."}, {"id": "b", "text": "..."}, {"id": "c", "text": "..."}, {"id": "d", "text": "..."}],',
      '        "correctChoiceId": "<id of correct choice>"',
      "      }",
      "      // 3 questions total",
      "    ]",
      "  },",
      '  "focus": {',
      '    "phrase": "<key phrase/pattern to learn>",',
      '    "explanation": "<clear explanation in English>",',
      '    "examples": [',
      '      {"english": "...", "japanese": "...", "context": "{{context}}"}',
      "      // 3 examples",
      "    ],",
      '    "tips": ["<tip1>", "<tip2>"]',
      "  },",
      '  "practice": {',
      '    "exercises": [',
      "      // Mix of fill_in_blank, reorder, free_text — 3 exercises total",
      "      // fill_in_blank: {id, type, instruction, sentence (with ___ blank), correctAnswer, acceptableAnswers}",
      "      // reorder: {id, type, instruction, words (shuffled array), correctAnswer (space-joined)}",
      "      // free_text: {id, type, instruction, prompt}",
      "    ]",
      "  },",
      '  "wrapup": {',
      '    "summary": "<brief summary>",',
      '    "keyPoints": ["<point1>", "<point2>", "<point3>"],',
      '    "nextPreview": "<preview of next topic>"',
      "  }",
      "}",
      "",
      "Rules:",
      "- Warmup reviews previously known phrases relevant to {{context}}",
      "- Focus phrase must be at the right difficulty for level {{level}}",
      "- Practice exercises must use the focus phrase or related patterns",
      "- All content must be relevant to {{domain}} engineering work",
      "- L1: very simple, L2: basic, L3: intermediate idioms, L4: advanced nuance",
      "- Return ONLY the JSON object, no markdown, no explanation outside JSON",
    ].join("\n"),
  } satisfies PromptTemplate,
} as const;
