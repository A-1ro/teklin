const NORMALIZE_MAX_LENGTH = 200;

export function normalizePhrase(phrase: string): string {
  // 長さガード: ReDoS 防止のため入力を最大長で切り詰める。
  // sanitizePhrase 経由で来る場合は既に 200 char 上限だが、
  // 直接呼ばれる将来経路に対する防衛深化。
  let result = phrase.slice(0, NORMALIZE_MAX_LENGTH);

  const quoteRegexStart = /^["'`""''「」『』]+/;
  const quoteRegexEnd = /["'`""''「」『』]+$/;

  // 1. trim（前後空白）
  result = result.trim();

  // 2. 前後の引用符除去
  result = result.replace(quoteRegexStart, "").replace(quoteRegexEnd, "");

  // 3. 末尾句読点除去
  result = result.replace(/[.!?。！？]+$/, "");

  // 3b. 句読点除去で露出した内側の引用符を除去（'Look into'! のようなケース対応）
  result = result.replace(quoteRegexStart, "").replace(quoteRegexEnd, "");

  // 4. 引用符 / 句読点除去後に再度 trim
  result = result.trim();

  // 5. toLowerCase
  result = result.toLowerCase();

  return result;
}
