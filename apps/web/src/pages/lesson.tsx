import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { ApiError, apiFetch } from "@/lib/api";
import { FlameIcon } from "@/components/icons/flame-icon";
import type {
  LessonContent,
  LessonStep,
  WarmupQuestion,
  Exercise,
  LessonAnswerResponse,
  LessonCompleteResponse,
  Level,
} from "@teklin/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonData {
  id: string;
  level: Level;
  type: string;
  content: LessonContent;
}

type StepId = "warmup" | "focus" | "practice" | "wrapup" | "complete";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LEVEL_META: Record<Level, { label: string; color: string }> = {
  L1: { label: "Starter", color: "bg-green-500/20 text-green-400" },
  L2: { label: "Reader", color: "bg-blue-500/20 text-blue-400" },
  L3: { label: "Writer", color: "bg-purple-500/20 text-purple-400" },
  L4: { label: "Fluent", color: "bg-amber-500/20 text-amber-400" },
};

const STEPS: StepId[] = ["warmup", "focus", "practice", "wrapup"];

function parseApiErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return "フィードバックの取得に失敗しました。少し時間をおいて再試行してください。";
  }

  try {
    const parsed = JSON.parse(err.message) as { error?: unknown };
    if (typeof parsed.error === "string" && parsed.error.trim().length > 0) {
      return parsed.error;
    }
  } catch {
    if (err.message.trim().length > 0) {
      return err.message;
    }
  }

  return "フィードバックの取得に失敗しました。少し時間をおいて再試行してください。";
}

// ---------------------------------------------------------------------------
// LessonPage
// ---------------------------------------------------------------------------

export function LessonPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReview = searchParams.get("review") === "true";
  const lessonId = id as string;

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StepId>("warmup");
  const [completionData, setCompletionData] =
    useState<LessonCompleteResponse | null>(null);
  const [started, setStarted] = useState(false);

  // Start the lesson session on mount (once user is loaded)
  useEffect(() => {
    if (authLoading || !user || started) return;

    setStarted(true);

    apiFetch<LessonData>(`/api/lessons/${lessonId}`)
      .then((data) => {
        setLesson(data);
        if (!isReview) {
          return apiFetch(`/api/lessons/${lessonId}/start`, { method: "POST" });
        }
      })
      .catch(() => setError("レッスンの読み込みに失敗しました。"))
      .finally(() => setIsLoading(false));
  }, [authLoading, user, lessonId, started]);

  const handleStepComplete = useCallback(
    (step: LessonStep) => {
      const idx = STEPS.indexOf(step as StepId);
      if (idx < STEPS.length - 1) {
        setCurrentStep(STEPS[idx + 1]);
      } else if (isReview) {
        // Review mode: go back to lesson home instead of complete screen
        navigate("/lesson");
      } else {
        // wrapup complete → call complete endpoint
        apiFetch<LessonCompleteResponse>(`/api/lessons/${lessonId}/complete`, {
          method: "POST",
        })
          .then((data) => {
            setCompletionData(data);
            setCurrentStep("complete");
          })
          .catch(() => {
            // Even on error, move to complete screen
            setCurrentStep("complete");
          });
      }
    },
    [lessonId, isReview, navigate],
  );

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500"
            role="status"
            aria-label="レッスンを読み込み中"
          />
          <p className="text-sm text-gray-400">レッスンを読み込み中...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !lesson) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <p className="mb-4 text-gray-400">{error || "レッスンが見つかりませんでした。"}</p>
          <Link
            to="/lesson"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            レッスン一覧に戻る
          </Link>
        </div>
      </main>
    );
  }

  if (currentStep === "complete") {
    return (
      <CompleteScreen
        completionData={completionData}
        onNavigate={navigate}
      />
    );
  }

  const levelMeta = LEVEL_META[lesson.level];
  const stepIndex = STEPS.indexOf(currentStep);

  return (
    <LessonShell
      lesson={lesson}
      levelMeta={levelMeta}
      currentStep={currentStep}
      stepIndex={stepIndex}
      isReview={isReview}
    >
      {currentStep === "warmup" && (
        <WarmupStep
          lessonId={lessonId}
          questions={lesson.content.warmup.questions as WarmupQuestion[]}
          onComplete={() => handleStepComplete("warmup")}
          readOnly={isReview}
        />
      )}
      {currentStep === "focus" && (
        <FocusStep
          focus={lesson.content.focus}
          onComplete={() => handleStepComplete("focus")}
        />
      )}
      {currentStep === "practice" && (
        <PracticeStep
          lessonId={lessonId}
          exercises={lesson.content.practice.exercises as Exercise[]}
          onComplete={() => handleStepComplete("practice")}
          readOnly={isReview}
        />
      )}
      {currentStep === "wrapup" && (
        <WrapupStep
          wrapup={lesson.content.wrapup}
          onComplete={() => handleStepComplete("wrapup")}
        />
      )}
    </LessonShell>
  );
}

// ---------------------------------------------------------------------------
// LessonShell
// ---------------------------------------------------------------------------

function LessonShell({
  lesson,
  levelMeta,
  currentStep,
  stepIndex,
  isReview,
  children,
}: {
  lesson: LessonData;
  levelMeta: { label: string; color: string };
  currentStep: StepId;
  stepIndex: number;
  isReview: boolean;
  children: React.ReactNode;
}) {
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const STEP_LABELS: Record<StepId, string> = {
    warmup: "ウォームアップ",
    focus: "フォーカス",
    practice: "練習",
    wrapup: "まとめ",
    complete: "完了",
  };

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link
            to="/lesson"
            className="flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-200"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            終了
          </Link>

          <div className="flex items-center gap-2">
            {isReview && (
              <span className="rounded-full bg-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-300">
                復習
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${levelMeta.color}`}
            >
              {lesson.level} {levelMeta.label}
            </span>
            <span className="text-xs text-gray-500">
              {STEP_LABELS[currentStep]}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-gray-800">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </header>

      {/* Step indicator dots */}
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((step, i) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${
                i < stepIndex
                  ? "w-6 bg-blue-500"
                  : i === stepIndex
                    ? "w-6 bg-blue-400"
                    : "w-2 bg-gray-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto max-w-2xl px-4 pb-8">{children}</div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// WarmupStep
// ---------------------------------------------------------------------------

function WarmupStep({
  lessonId,
  questions,
  onComplete,
  readOnly = false,
}: {
  lessonId: string;
  questions: WarmupQuestion[];
  onComplete: () => void;
  readOnly?: boolean;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<LessonAnswerResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const question = questions[currentIdx];

  const handleSelect = useCallback(
    async (choiceId: string) => {
      if (selected || isSubmitting) return;
      setSelected(choiceId);

      setIsSubmitting(true);
      try {
        const res = await apiFetch<LessonAnswerResponse>(
          `/api/lessons/${lessonId}/answer`,
          {
            method: "POST",
            body: JSON.stringify({
              step: "warmup" as LessonStep,
              exerciseId: question.id,
              answer: choiceId,
            }),
          },
        );
        setResult(res);
      } catch {
        setResult({ correct: false, score: 0 });
      } finally {
        setIsSubmitting(false);
      }
    },
    [selected, isSubmitting, lessonId, question],
  );

  const handleNext = useCallback(() => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setResult(null);
    } else {
      onComplete();
    }
  }, [currentIdx, questions.length, onComplete]);

  if (!question) {
    return (
      <div className="text-center text-gray-400">ウォームアップ問題がありません。</div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
          ウォームアップ · {currentIdx + 1} / {questions.length}
        </p>
        <h2 className="text-lg font-semibold text-gray-100">
          このフレーズの意味はどれ？
        </h2>
      </div>

      {/* Phrase card */}
      <div className="mb-6 rounded-xl border border-gray-700 bg-gray-900 p-5">
        <p className="mb-1 text-lg font-semibold text-blue-300">
          {question.phrase}
        </p>
        <p className="text-sm text-gray-400">{question.context}</p>
      </div>

      {/* Choices */}
      <div className="mb-6 flex flex-col gap-3">
        {question.choices.map((choice) => {
          const isSelected = selected === choice.id;
          const isCorrect = result?.correctAnswer === choice.id;
          const showCorrect = result !== null && isCorrect;
          const showWrong = result !== null && isSelected && !result.correct;

          let borderClass = "border-gray-700 hover:border-gray-600";
          let bgClass = "bg-gray-900 hover:bg-gray-800";
          let textClass = "text-gray-200";

          if (showCorrect) {
            borderClass = "border-green-600";
            bgClass = "bg-green-950/30";
            textClass = "text-green-300";
          } else if (showWrong) {
            borderClass = "border-red-600";
            bgClass = "bg-red-950/30";
            textClass = "text-red-300";
          } else if (isSelected) {
            borderClass = "border-blue-600";
            bgClass = "bg-blue-950/30";
            textClass = "text-blue-300";
          }

          return (
            <button
              key={choice.id}
              onClick={() => handleSelect(choice.id)}
              disabled={selected !== null}
              className={`w-full rounded-xl border px-5 py-4 text-left text-sm font-medium transition-colors ${borderClass} ${bgClass} ${textClass} disabled:cursor-default`}
            >
              {choice.text}
            </button>
          );
        })}
      </div>

      {/* Result feedback */}
      {result && (
        <div
          className={`mb-6 rounded-lg px-5 py-4 ${
            result.correct
              ? "border border-green-800 bg-green-950/30"
              : "border border-red-800 bg-red-950/30"
          }`}
        >
          <p
            className={`mb-1 text-sm font-semibold ${result.correct ? "text-green-400" : "text-red-400"}`}
          >
            {result.correct ? "正解！" : "惜しい！"}
          </p>
          {result.feedback && (
            <p className="text-sm text-gray-400">{result.feedback}</p>
          )}
          {!result.correct && result.correctAnswer && (
            <p className="mt-1 text-sm text-gray-400">
              正解：{" "}
              <span className="font-medium text-gray-200">
                {
                  question.choices.find((c) => c.id === result.correctAnswer)
                    ?.text
                }
              </span>
            </p>
          )}
        </div>
      )}

      {result && (
        <button
          onClick={handleNext}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
        >
          {currentIdx < questions.length - 1 ? "次の問題" : "次へ"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FocusStep
// ---------------------------------------------------------------------------

function FocusStep({
  focus,
  onComplete,
}: {
  focus: LessonContent["focus"];
  onComplete: () => void;
}) {
  const [exampleIdx, setExampleIdx] = useState(0);

  const CONTEXT_LABELS: Record<string, string> = {
    commit_message: "Commit Message",
    pr_comment: "PR Comment",
    github_issue: "GitHub Issue",
    slack: "Slack",
    general: "General",
  };

  return (
    <div>
      <div className="mb-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
          フォーカス
        </p>
        <h2 className="text-lg font-semibold text-gray-100">
          今日のキーフレーズ
        </h2>
      </div>

      {/* Phrase highlight */}
      <div className="mb-6 rounded-2xl border border-blue-800/40 bg-blue-950/20 p-6">
        <p className="mb-3 text-2xl font-bold text-blue-300">{focus.phrase}</p>
        <p className="text-sm leading-relaxed text-gray-300">
          {focus.explanation}
        </p>
      </div>

      {/* Examples carousel */}
      {focus.examples.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            例文
          </p>
          <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-400">
                {CONTEXT_LABELS[focus.examples[exampleIdx].context] ??
                  focus.examples[exampleIdx].context}
              </span>
            </div>
            <p className="mb-2 text-sm font-medium text-gray-100">
              {focus.examples[exampleIdx].english}
            </p>
            <p className="text-sm text-gray-400">
              {focus.examples[exampleIdx].japanese}
            </p>
          </div>

          {focus.examples.length > 1 && (
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => setExampleIdx((i) => Math.max(0, i - 1))}
                disabled={exampleIdx === 0}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
              >
                前へ
              </button>
              <span className="text-xs text-gray-600">
                {exampleIdx + 1} / {focus.examples.length}
              </span>
              <button
                onClick={() =>
                  setExampleIdx((i) =>
                    Math.min(focus.examples.length - 1, i + 1),
                  )
                }
                disabled={exampleIdx === focus.examples.length - 1}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200 disabled:opacity-30"
              >
                次へ
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      {focus.tips.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-800/30 bg-amber-950/10 p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-amber-600">
            ヒント
          </p>
          <ul className="flex flex-col gap-2">
            {focus.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="mt-0.5 text-amber-500" aria-hidden="true">
                  •
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onComplete}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
      >
        わかった！練習しよう
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PracticeStep
// ---------------------------------------------------------------------------

function PracticeStep({
  lessonId,
  exercises,
  onComplete,
  readOnly = false,
}: {
  lessonId: string;
  exercises: Exercise[];
  onComplete: () => void;
  readOnly?: boolean;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<Map<string, LessonAnswerResponse>>(
    new Map(),
  );

  const exercise = exercises[currentIdx];

  const handleAnswer = useCallback(
    (result: LessonAnswerResponse) => {
      setResults((prev) => new Map(prev).set(exercise.id, result));
    },
    [exercise],
  );

  const handleNext = useCallback(() => {
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      onComplete();
    }
  }, [currentIdx, exercises.length, onComplete]);

  if (!exercise) {
    return (
      <div className="text-center text-gray-400">練習問題がありません。</div>
    );
  }

  const currentResult = results.get(exercise.id) ?? null;

  return (
    <div>
      <div className="mb-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
          練習 · {currentIdx + 1} / {exercises.length}
        </p>
        <h2 className="text-lg font-semibold text-gray-100">
          {exercise.instruction}
        </h2>
      </div>

      {exercise.type === "fill_in_blank" && (
        <FillInBlank
          lessonId={lessonId}
          exercise={exercise}
          result={currentResult}
          onAnswer={handleAnswer}
          readOnly={readOnly}
        />
      )}

      {exercise.type === "reorder" && (
        <ReorderExercise
          lessonId={lessonId}
          exercise={exercise}
          result={currentResult}
          onAnswer={handleAnswer}
          readOnly={readOnly}
        />
      )}

      {exercise.type === "free_text" && (
        <FreeTextExercise
          lessonId={lessonId}
          exercise={exercise}
          result={currentResult}
          onAnswer={handleAnswer}
          readOnly={readOnly}
        />
      )}

      {(currentResult || readOnly) && (
        <button
          onClick={handleNext}
          className="mt-6 w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
        >
          {currentIdx < exercises.length - 1
            ? "次の問題"
            : "練習完了"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FillInBlank
// ---------------------------------------------------------------------------

function FillInBlank({
  lessonId,
  exercise,
  result,
  onAnswer,
  readOnly = false,
}: {
  lessonId: string;
  exercise: Exercise;
  result: LessonAnswerResponse | null;
  onAnswer: (result: LessonAnswerResponse) => void;
  readOnly?: boolean;
}) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [exercise.id]);

  const sentence = exercise.sentence ?? "";
  const parts = sentence.split("___");

  const handleSubmit = useCallback(async () => {
    if (!value.trim() || isSubmitting || result) return;
    setIsSubmitting(true);

    try {
      const res = await apiFetch<LessonAnswerResponse>(
        `/api/lessons/${lessonId}/answer`,
        {
          method: "POST",
          body: JSON.stringify({
            step: "practice" as LessonStep,
            exerciseId: exercise.id,
            answer: value.trim(),
          }),
        },
      );
      onAnswer(res);
    } catch (err) {
      onAnswer({
        correct: false,
        score: 0,
        feedback: parseApiErrorMessage(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [value, isSubmitting, result, lessonId, exercise.id, onAnswer]);

  return (
    <div>
      {/* Sentence with blank */}
      <div className="mb-6 rounded-xl border border-gray-700 bg-gray-900 p-5">
        <p className="text-base text-gray-200">
          {parts[0]}
          <span className="mx-1 inline-block min-w-[80px] border-b-2 border-blue-500 px-1 text-center text-blue-300">
            {value || "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}
          </span>
          {parts[1]}
        </p>
      </div>

      {/* Input */}
      <div className="mb-4 flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          disabled={result !== null}
          placeholder="答えを入力..."
          className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 outline-none transition-colors focus:border-blue-500 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting || result !== null}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "..." : "確認"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg px-5 py-4 ${
            result.correct
              ? "border border-green-800 bg-green-950/30"
              : "border border-red-800 bg-red-950/30"
          }`}
        >
          <p
            className={`mb-1 text-sm font-semibold ${result.correct ? "text-green-400" : "text-red-400"}`}
          >
            {result.correct ? "正解！" : "惜しい！"}
          </p>
          {!result.correct && result.correctAnswer && (
            <p className="text-sm text-gray-400">
              正解：{" "}
              <span className="font-medium text-gray-200">
                {result.correctAnswer}
              </span>
            </p>
          )}
          {result.feedback && (
            <p className="mt-1 text-sm text-gray-400">{result.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReorderExercise
// ---------------------------------------------------------------------------

function ReorderExercise({
  lessonId,
  exercise,
  result,
  onAnswer,
  readOnly = false,
}: {
  lessonId: string;
  exercise: Exercise;
  result: LessonAnswerResponse | null;
  onAnswer: (result: LessonAnswerResponse) => void;
  readOnly?: boolean;
}) {
  // Compute initial word order once per exercise (keyed by exercise.id).
  // We intentionally omit exercise.words from deps to avoid re-shuffling on
  // parent re-renders; the bank state below owns the mutable word list.
  const initialBank = exercise.words ?? [];

  const [bank, setBank] = useState<string[]>(initialBank);
  const [chosen, setChosen] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addWord = useCallback(
    (word: string, idx: number) => {
      if (result) return;
      setBank((prev) => prev.filter((_, i) => i !== idx));
      setChosen((prev) => [...prev, word]);
    },
    [result],
  );

  const removeWord = useCallback(
    (word: string, idx: number) => {
      if (result) return;
      setChosen((prev) => prev.filter((_, i) => i !== idx));
      setBank((prev) => [...prev, word]);
    },
    [result],
  );

  const handleSubmit = useCallback(async () => {
    if (chosen.length === 0 || isSubmitting || result) return;
    setIsSubmitting(true);

    try {
      const res = await apiFetch<LessonAnswerResponse>(
        `/api/lessons/${lessonId}/answer`,
        {
          method: "POST",
          body: JSON.stringify({
            step: "practice" as LessonStep,
            exerciseId: exercise.id,
            answer: chosen.join(" "),
          }),
        },
      );
      onAnswer(res);
    } catch (err) {
      onAnswer({
        correct: false,
        score: 0,
        feedback: parseApiErrorMessage(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [chosen, isSubmitting, result, lessonId, exercise.id, onAnswer]);

  return (
    <div>
      {/* Chosen area */}
      <div className="mb-4 min-h-[60px] rounded-xl border border-dashed border-gray-600 bg-gray-900 p-4">
        {chosen.length === 0 ? (
          <p className="text-sm text-gray-600">
            下の単語をタップして文を作ろう
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {chosen.map((word, i) => (
              <button
                key={`chosen-${i}`}
                onClick={() => removeWord(word, i)}
                disabled={result !== null}
                className="rounded-lg border border-blue-700 bg-blue-950/40 px-3 py-1.5 text-sm font-medium text-blue-200 transition-colors hover:bg-blue-950/60 disabled:cursor-default"
              >
                {word}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Word bank */}
      <div className="mb-6 flex flex-wrap gap-2">
        {bank.map((word, i) => (
          <button
            key={`bank-${i}`}
            onClick={() => addWord(word, i)}
            disabled={result !== null}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-200 transition-colors hover:border-gray-600 hover:bg-gray-700 disabled:cursor-default"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Submit */}
      {!result && (
        <button
          onClick={handleSubmit}
          disabled={chosen.length === 0 || isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "確認中..." : "確認"}
        </button>
      )}

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg px-5 py-4 ${
            result.correct
              ? "border border-green-800 bg-green-950/30"
              : "border border-red-800 bg-red-950/30"
          }`}
        >
          <p
            className={`mb-1 text-sm font-semibold ${result.correct ? "text-green-400" : "text-red-400"}`}
          >
            {result.correct ? "正解！" : "惜しい！"}
          </p>
          {!result.correct && result.correctAnswer && (
            <p className="text-sm text-gray-400">
              正しい順序：{" "}
              <span className="font-medium text-gray-200">
                {result.correctAnswer}
              </span>
            </p>
          )}
          {result.feedback && (
            <p className="mt-1 text-sm text-gray-400">{result.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FreeTextExercise
// ---------------------------------------------------------------------------

function FreeTextExercise({
  lessonId,
  exercise,
  result,
  onAnswer,
  readOnly = false,
}: {
  lessonId: string;
  exercise: Exercise;
  result: LessonAnswerResponse | null;
  onAnswer: (result: LessonAnswerResponse) => void;
  readOnly?: boolean;
}) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!value.trim() || isSubmitting || result) return;
    setIsSubmitting(true);

    try {
      const res = await apiFetch<LessonAnswerResponse>(
        `/api/lessons/${lessonId}/answer`,
        {
          method: "POST",
          body: JSON.stringify({
            step: "practice" as LessonStep,
            exerciseId: exercise.id,
            answer: value.trim(),
          }),
        },
      );
      onAnswer(res);
    } catch (err) {
      onAnswer({
        correct: false,
        score: 0,
        feedback: parseApiErrorMessage(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [value, isSubmitting, result, lessonId, exercise.id, onAnswer]);

  return (
    <div>
      {/* Prompt */}
      {exercise.prompt && (
        <div className="mb-5 rounded-xl border border-gray-700 bg-gray-900 p-5">
          <p className="text-sm text-gray-300">{exercise.prompt}</p>
        </div>
      )}

      {/* Textarea */}
      <div className="mb-4">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={result !== null}
          placeholder="ここに答えを書こう..."
          rows={4}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 outline-none transition-colors focus:border-blue-500 disabled:opacity-60"
        />
      </div>

      {!result && (
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "送信中..." : "送信"}
        </button>
      )}

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg px-5 py-4 ${
            result.correct
              ? "border border-green-800 bg-green-950/30"
              : "border border-amber-800 bg-amber-950/20"
          }`}
        >
          <p
            className={`mb-1 text-sm font-semibold ${result.correct ? "text-green-400" : "text-amber-400"}`}
          >
            {result.correct ? "よくできました！" : "AIフィードバック"}
          </p>
          {result.feedback && (
            <p className="text-sm text-gray-300">{result.feedback}</p>
          )}
          {result.correctAnswer && (
            <div className="mt-3 rounded-lg border border-gray-700 bg-gray-900 p-3">
              <p className="mb-1 text-xs font-medium text-gray-500">
                模範解答
              </p>
              <p className="text-sm text-gray-200">{result.correctAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// WrapupStep
// ---------------------------------------------------------------------------

function WrapupStep({
  wrapup,
  onComplete,
}: {
  wrapup: LessonContent["wrapup"];
  onComplete: () => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
          まとめ
        </p>
        <h2 className="text-lg font-semibold text-gray-100">
          今日もよくできました！
        </h2>
      </div>

      {/* Summary */}
      <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <p className="text-sm leading-relaxed text-gray-300">
          {wrapup.summary}
        </p>
      </div>

      {/* Key points */}
      {wrapup.keyPoints.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            重要ポイント
          </p>
          <ul className="flex flex-col gap-3">
            {wrapup.keyPoints.map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-300">{point}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next preview */}
      {wrapup.nextPreview && (
        <div className="mb-6 rounded-xl border border-gray-800 bg-gray-900/50 p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-600">
            次回のレッスン
          </p>
          <p className="text-sm text-gray-400">{wrapup.nextPreview}</p>
        </div>
      )}

      <button
        onClick={onComplete}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
      >
        レッスンを完了
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CompleteScreen
// ---------------------------------------------------------------------------

function CompleteScreen({
  completionData,
  onNavigate,
}: {
  completionData: LessonCompleteResponse | null;
  onNavigate: (path: string) => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 py-8">
      <div className="w-full max-w-md text-center">
        {/* Trophy icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-amber-700/40 bg-amber-950/30">
            <span className="text-4xl" role="img" aria-label="Trophy">
              {"\uD83C\uDFC6"}
            </span>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-100">
          レッスン完了！
        </h1>
        <p className="mb-8 text-sm text-gray-400">
          今日のレッスンが終わりました。引き続き頑張りましょう！
        </p>

        {/* Score + streak */}
        {completionData && (
          <div className="mb-8 rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                  スコア
                </p>
                <p className="font-mono text-3xl font-bold text-gray-100">
                  {completionData.score}
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                  連続記録
                </p>
                <p className="flex items-center justify-center gap-1 font-mono text-3xl font-bold text-gray-100">
                  <FlameIcon
                    size={30}
                    className={
                      completionData.streak.currentStreak > 0
                        ? "text-orange-400"
                        : "text-blue-400"
                    }
                  />
                  {completionData.streak.currentStreak}
                </p>
              </div>
            </div>

            {completionData.streak.isNewRecord && (
              <div className="mt-4 rounded-lg border border-amber-800/40 bg-amber-950/20 px-4 py-3">
                <p className="text-sm font-semibold text-amber-400">
                  {"\uD83C\uDF89"} 新記録達成：{completionData.streak.longestStreak}日連続！
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onNavigate("/dashboard")}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
          >
            ダッシュボードに戻る
          </button>
          <button
            onClick={() => onNavigate("/cards/review")}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-6 py-3 text-sm font-semibold text-gray-200 transition-colors hover:border-gray-600 hover:bg-gray-800"
          >
            フレーズカードを復習する
          </button>
        </div>
      </div>
    </main>
  );
}
