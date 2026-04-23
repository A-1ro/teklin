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
    version: "2.0.0",
    system: [
      "You are an expert technical English curriculum designer for software engineers.",
      "Create personalized daily lessons that are practical, engaging, and focused on",
      "real-world engineering communication (PRs, commits, Slack, GitHub Issues).",
      "You receive a detailed learner profile with performance data, SRS card stats,",
      "rewrite history, and feedback trends. Use this data to deeply personalize the lesson.",
      "Always respond with valid JSON only, no markdown, no extra text.",
    ].join(" "),
    user: [
      "Generate a daily 5-minute technical English lesson with the following parameters:",
      "- User level: {{level}} (L1=beginner, L2=elementary, L3=intermediate, L4=advanced)",
      "- Domain: {{domain}} (web/infra/ml/mobile)",
      "- Context: {{context}} (commit_message/pr_comment/github_issue/slack/general)",
      "- Weaknesses to focus on: {{weaknesses}}",
      "- Previous lesson's next-topic promise: {{previousNextPreview}}",
      "",
      "=== LEARNER PROFILE (use this to personalize) ===",
      "{{learnerProfile}}",
      "=== END LEARNER PROFILE ===",
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
      '        "choices": [{"id": "a", "text": "<Japanese translation>"}, {"id": "b", "text": "<wrong Japanese>"}, {"id": "c", "text": "<wrong Japanese>"}, {"id": "d", "text": "<wrong Japanese>"}],',
      '        "correctChoiceId": "<id of the choice whose text matches the correct Japanese translation>",',
      "      }",
      "      (3 questions total)",
   "    ]",
      "  },",
      '  "focus": {',
      '    "phrase": "<key phrase/pattern to learn>",',
      '    "explanation": "<clear explanation in English>",',
      '    "examples": [',
      '      {"english": "...", "japanese": "...", "context": "{{context}}"}',
      "      (3 examples total)",
      "    ],",
      '    "tips": ["<tip1>", "<tip2>"]',
      "  },",
      '  "practice": {',
      '    "exercises": [',
      "      {{exerciseComposition}}",
      "    ]",
      "  },",
      '  "wrapup": {',
      '    "summary": "<Japanese summary>",',
      '    "keyPoints": ["<Japanese point1>", "<Japanese point2>", "<Japanese point3>"],',
      '    "nextPreview": "<Japanese preview of next topic>"',
      "  }",
      "}",
      "",
      "Rules:",
      "- Warmup shows an English phrase and asks the user to pick the correct Japanese meaning from 4 Japanese choices",
      "- Warmup choices MUST all be in Japanese (one correct translation, three plausible but wrong Japanese translations)",
      "- CRITICAL: Warmup distractors must be SUBTLE. All 4 choices should share the same easy/common vocabulary (e.g. if the phrase has 'adds', ALL choices must include '追加' — never make a basic word the differentiator). The differences between choices should require understanding the FULL sentence structure, not just one keyword. Good distractors differ in: modifier scope, object relationships, tense/aspect nuance, or who does what to whom. Bad distractors just swap the main verb for an obviously different one.",
      "- Focus phrase must be at the right difficulty for level {{level}}",
      "- Focus explanation and examples MUST be in English (this is the English learning content)",
      "- Practice exercise instruction, prompt, and all wrapup text MUST be in Japanese",
      "- Practice exercises must use the focus phrase or related patterns",
      "- IMPORTANT: All practice exercises MUST consistently use the focus phrase/keyword. However, each exercise MUST present a DIFFERENT sentence with a different scenario (e.g. different bugs, features, or contexts). Same key phrase, different situations.",
      "- All content must be relevant to {{domain}} engineering work",
      "",
      "Exercise type specifications:",
      "- fill_in_blank: {id, type, instruction: '<Japanese instruction>', sentence: '<sentence with ___ blank>', correctAnswer, acceptableAnswers}",
      "- reorder: {id, type, instruction: '<Japanese instruction>', correctAnswer: '<complete English sentence>'. Do NOT include a words field — it will be auto-generated}",
      "- free_text: {id, type, instruction: '<Japanese instruction>', prompt: '<Japanese scenario prompt>'}",
      "- error_correction: {id, type, instruction: '<Japanese instruction>', errorSentence: '<English sentence with 1-2 grammatical/usage errors>', correctAnswer: '<corrected sentence>', acceptableAnswers: ['<alternative corrections>']}",
      "- paraphrase: {id, type, instruction: '<Japanese instruction>', prompt: '<English sentence to paraphrase in Japanese>'}. Scored by LLM like free_text.",
      "",
      "Exercise composition rationale: {{exerciseRationale}}",
      "- L1: very simple, L2: basic, L3: intermediate idioms, L4: advanced nuance",
      "- If 'Previous lesson's next-topic promise' is not empty, you MUST base this lesson's focus phrase and theme on that promised topic. The user expects continuity between lessons.",
      "- Return ONLY the JSON object, no markdown, no explanation outside JSON",
      "",
      "Personalization guidelines (based on learner profile):",
      "- If the user has struggling SRS phrases, consider incorporating them into warmup questions or practice exercises to reinforce learning",
      "- If feedback trend shows 'too_easy', increase difficulty: use more advanced vocabulary, longer sentences, and nuanced distractors",
      "- If feedback trend shows 'too_hard', simplify: use shorter sentences, more common vocabulary, and clearer distractors",
      "- Avoid repeating recent focus phrases — check the list and pick a new topic",
      "- If the user scores low on a specific context (e.g. pr_comment), make exercises more thorough for that context",
      "- If the user has done many rewrites in a certain context, they're actively practicing it — leverage that familiarity",
      "- If SRS shows many overdue cards, warmup can include phrases similar to those overdue cards",
    ].join("\n"),
  } satisfies PromptTemplate,
} as const;
