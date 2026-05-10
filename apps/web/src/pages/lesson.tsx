import { useCallback, useEffect, useRef, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
} from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { ApiError, apiFetch } from "@/lib/api";
import { playSound } from "@/lib/sound";
import { FlameIcon } from "@/components/icons/flame-icon";
import { TekIcon } from "@/components/icons/tek-icon";
import type {
  LessonContent,
  LessonStep,
  WarmupQuestion,
  Exercise,
  LessonAnswerResponse,
  LessonCompleteResponse,
  AddLessonPhraseCardResponse,
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
  L1: { label: "Starter", color: "bg-teal-50 text-teal" },
  L2: { label: "Reader", color: "bg-teal-50 text-teal" },
  L3: { label: "Writer", color: "bg-plum-50 text-plum" },
  L4: { label: "Fluent", color: "bg-mustard-50 text-mustard-fg" },
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
            if (data.tek) {
              window.dispatchEvent(
                new CustomEvent("tek-balance-updated", {
                  detail: { balance: data.tek.balance },
                })
              );
            }
          })
          .catch(() => {
            // Even on error, move to complete screen
            setCurrentStep("complete");
          });
      }
    },
    [lessonId, isReview, navigate]
  );

  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-teal"
            role="status"
            aria-label="レッスンを読み込み中"
          />
          <p className="text-sm text-ink-2">レッスンを読み込み中...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !lesson) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="text-center">
          <p className="mb-4 text-ink-2">
            {error || "レッスンが見つかりませんでした。"}
          </p>
          <Link
            to="/lesson"
            className="inline-block rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark"
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
        lessonId={lessonId}
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
    <main className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-rule bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link
            to="/lesson"
            className="flex items-center gap-1.5 text-sm text-ink-2 transition-colors hover:text-ink"
            style={{ fontSize: 13, fontWeight: 500 }}
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
            ホームへ
          </Link>

          <div className="flex items-center gap-2">
            {isReview && (
              <span className="rounded-full bg-paper-2 px-2.5 py-0.5 text-xs font-semibold text-ink-2">
                復習
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${levelMeta.color}`}
            >
              {lesson.level} {levelMeta.label}
            </span>
            <span className="text-xs text-ink-3">
              {STEP_LABELS[currentStep]}
            </span>
          </div>
        </div>

        {/* Progress bar — 4px, bg paper-2, fill teal, transition width 250ms */}
        <div className="h-1 bg-paper-2">
          <div
            className="h-full bg-teal"
            style={{
              width: `${progress}%`,
              transition: "width 250ms ease",
            }}
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
                  ? "w-6 bg-teal"
                  : i === stepIndex
                    ? "w-6 bg-teal"
                    : "w-2 bg-rule"
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
  readOnly: _readOnly = false,
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
          }
        );
        setResult(res);
        playSound(res.correct ? "correct" : "incorrect");
      } catch {
        setResult({ correct: false, score: 0 });
      } finally {
        setIsSubmitting(false);
      }
    },
    [selected, isSubmitting, lessonId, question]
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
      <div className="text-center text-ink-2">
        ウォームアップ問題がありません。
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-3">
          ウォームアップ · {currentIdx + 1} / {questions.length}
        </p>
        <h2 className="text-lg font-semibold text-ink">
          このフレーズの意味はどれ？
        </h2>
      </div>

      {/* Phrase card */}
      <div className="mb-6 rounded-[14px] border border-rule bg-paper-2 p-5">
        <p className="mb-1 text-lg font-semibold text-teal">
          {question.phrase}
        </p>
        <p className="text-sm text-ink-2">{question.context}</p>
      </div>

      {/* Choices */}
      <div className="mb-6 flex flex-col gap-3">
        {question.choices.map((choice) => {
          const isSelected = selected === choice.id;
          const isCorrect = result?.correctAnswer === choice.id;
          const showCorrect = result !== null && isCorrect;
          const showWrong = result !== null && isSelected && !result.correct;

          let borderClass = "border-rule hover:border-ink-3";
          let bgClass = "bg-paper hover:bg-paper-2";
          let textClass = "text-ink";

          if (showCorrect) {
            borderClass = "border-teal";
            bgClass = "bg-teal-50";
            textClass = "text-teal";
          } else if (showWrong) {
            borderClass = "border-coral";
            bgClass = "bg-coral-50";
            textClass = "text-coral-fg";
          } else if (isSelected) {
            borderClass = "border-teal";
            bgClass = "bg-teal-50";
            textClass = "text-teal";
          }

          return (
            <button
              key={choice.id}
              onClick={() => handleSelect(choice.id)}
              disabled={selected !== null}
              className={`w-full rounded-[14px] border px-5 py-4 text-left text-sm font-medium transition-colors ${borderClass} ${bgClass} ${textClass} disabled:cursor-default`}
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
              ? "border border-teal bg-teal-50"
              : "border border-coral bg-coral-50"
          }`}
        >
          <p
            className={`mb-1 text-sm font-semibold ${result.correct ? "text-teal" : "text-coral-fg"}`}
          >
            {result.correct ? "正解！" : "惜しい！"}
          </p>
          {result.feedback && (
            <p className="text-sm text-ink-2">{result.feedback}</p>
          )}
          {!result.correct && result.correctAnswer && (
            <p className="mt-1 text-sm text-ink-2">
              正解：{" "}
              <span className="font-medium text-ink">
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
          className="w-full rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark active:bg-teal-dark"
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
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-3">
          フォーカス
        </p>
        <h2 className="text-lg font-semibold text-ink">今日のキーフレーズ</h2>
      </div>

      {/* Phrase highlight */}
      <div className="mb-6 rounded-[14px] border border-teal/30 bg-teal-50 p-6">
        <p className="mb-3 text-2xl font-bold text-teal">{focus.phrase}</p>
        <p className="text-sm leading-relaxed text-ink">{focus.explanation}</p>
      </div>

      {/* Examples carousel */}
      {focus.examples.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-3">
            例文
          </p>
          <div className="rounded-[14px] border border-rule bg-paper-2 p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-rule px-2.5 py-0.5 text-xs font-medium text-ink-2">
                {CONTEXT_LABELS[focus.examples[exampleIdx].context] ??
                  focus.examples[exampleIdx].context}
              </span>
            </div>
            <p className="mb-2 text-sm font-medium text-ink">
              {focus.examples[exampleIdx].english}
            </p>
            <p className="text-sm text-ink-2">
              {focus.examples[exampleIdx].japanese}
            </p>
          </div>

          {focus.examples.length > 1 && (
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => setExampleIdx((i) => Math.max(0, i - 1))}
                disabled={exampleIdx === 0}
                className="rounded-lg px-3 py-1.5 text-xs text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink disabled:opacity-30"
              >
                前へ
              </button>
              <span className="text-xs text-ink-3">
                {exampleIdx + 1} / {focus.examples.length}
              </span>
              <button
                onClick={() =>
                  setExampleIdx((i) =>
                    Math.min(focus.examples.length - 1, i + 1)
                  )
                }
                disabled={exampleIdx === focus.examples.length - 1}
                className="rounded-lg px-3 py-1.5 text-xs text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink disabled:opacity-30"
              >
                次へ
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      {focus.tips.length > 0 && (
        <div className="mb-6 rounded-[14px] border border-mustard/30 bg-mustard-50 p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-mustard-fg">
            ヒント
          </p>
          <ul className="flex flex-col gap-2">
            {focus.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink">
                <span className="mt-0.5 text-mustard-fg" aria-hidden="true">
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
        className="w-full rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark active:bg-teal-dark"
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
  readOnly: _readOnly = false,
}: {
  lessonId: string;
  exercises: Exercise[];
  onComplete: () => void;
  readOnly?: boolean;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<Map<string, LessonAnswerResponse>>(
    new Map()
  );

  const exercise = exercises[currentIdx];

  const handleAnswer = useCallback(
    (result: LessonAnswerResponse) => {
      setResults((prev) => new Map(prev).set(exercise.id, result));
    },
    [exercise]
  );

  const handleNext = useCallback(() => {
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      onComplete();
    }
  }, [currentIdx, exercises.length, onComplete]);

  if (!exercise) {
    return <div className="text-center text-ink-2">練習問題がありません。</div>;
  }

  const currentResult = results.get(exercise.id) ?? null;

  return (
    <div>
      <div className="mb-6">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-3">
          練習 · {currentIdx + 1} / {exercises.length}
        </p>
        <h2 className="text-lg font-semibold text-ink">
          {exercise.instruction}
        </h2>
      </div>

      {exercise.type === "fill_in_blank" && (
        <FillInBlank
          lessonId={lessonId}
          exercise={exercise}
          result={currentResult}
          onAnswer={handleAnswer}
          readOnly={_readOnly}
        />
      )}

      {exercise.type === "reorder" && (
        <ReorderExercise
          lessonId={lessonId}
          exercise={exercise}
          result={currentResult}
          onAnswer={handleAnswer}
          readOnly={_readOnly}
        />
      )}

      {exercise.type === "free_text" && (
        <FreeTextExercise
          lessonId={lessonId}
          exercise={exercise}
          result={currentResult}
          onAnswer={handleAnswer}
          readOnly={_readOnly}
        />
      )}

      {exercise.type === "error_correction" && (
        <ErrorCorrectionExercise
          lessonId={lessonId}
          exercise={exercise}
          result={currentResult}
          onAnswer={handleAnswer}
          readOnly={_readOnly}
        />
      )}

      {exercise.type === "paraphrase" && (
        <ParaphraseExercise
          lessonId={lessonId}
          exercise={exercise}
          result={currentResult}
          onAnswer={handleAnswer}
          readOnly={_readOnly}
        />
      )}

      {(currentResult || _readOnly) && (
        <button
          onClick={handleNext}
          className="mt-6 w-full rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark active:bg-teal-dark"
        >
          {currentIdx < exercises.length - 1 ? "次の問題" : "練習完了"}
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
  readOnly: _readOnly = false,
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
        }
      );
      onAnswer(res);
      playSound(res.correct ? "correct" : "incorrect");
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
      <div className="mb-6 rounded-[14px] border border-rule bg-paper-2 p-5">
        <p className="text-base text-ink">
          {parts[0]}
          <span className="mx-1 inline-block min-w-[80px] border-b-2 border-teal px-1 text-center text-teal">
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
          className="flex-1 rounded-lg border border-rule bg-paper px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none transition-colors focus:border-teal disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting || result !== null}
          className="rounded-lg bg-teal px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark active:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "..." : "確認"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg px-5 py-4 ${
            result.correct
              ? "border border-teal bg-teal-50"
              : "border border-coral bg-coral-50"
          }`}
        >
          <p
            className={`mb-1 text-sm font-semibold ${result.correct ? "text-teal" : "text-coral-fg"}`}
          >
            {result.correct ? "正解！" : "惜しい！"}
          </p>
          {!result.correct && result.correctAnswer && (
            <p className="text-sm text-ink-2">
              正解：{" "}
              <span className="font-medium text-ink">
                {result.correctAnswer}
              </span>
            </p>
          )}
          {result.feedback && (
            <p className="mt-1 text-sm text-ink-2">{result.feedback}</p>
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
  readOnly: _readOnly = false,
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
    [result]
  );

  const removeWord = useCallback(
    (word: string, idx: number) => {
      if (result) return;
      setChosen((prev) => prev.filter((_, i) => i !== idx));
      setBank((prev) => [...prev, word]);
    },
    [result]
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
        }
      );
      onAnswer(res);
      playSound(res.correct ? "correct" : "incorrect");
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
      <div className="mb-4 min-h-[60px] rounded-[14px] border border-dashed border-rule bg-paper-2 p-4">
        {chosen.length === 0 ? (
          <p className="text-sm text-ink-3">下の単語をタップして文を作ろう</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {chosen.map((word, i) => (
              <button
                key={`chosen-${i}`}
                onClick={() => removeWord(word, i)}
                disabled={result !== null}
                className="rounded-lg border border-teal bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal transition-colors hover:bg-teal-50/80 disabled:cursor-default"
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
            className="rounded-lg border border-rule bg-paper-2 px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink-3 hover:bg-rule disabled:cursor-default"
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
          className="w-full rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark active:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "確認中..." : "確認"}
        </button>
      )}

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg px-5 py-4 ${
            result.correct
              ? "border border-teal bg-teal-50"
              : "border border-coral bg-coral-50"
          }`}
        >
          <p
            className={`mb-1 text-sm font-semibold ${result.correct ? "text-teal" : "text-coral-fg"}`}
          >
            {result.correct ? "正解！" : "惜しい！"}
          </p>
          {!result.correct && result.correctAnswer && (
            <p className="text-sm text-ink-2">
              正しい順序：{" "}
              <span className="font-medium text-ink">
                {result.correctAnswer}
              </span>
            </p>
          )}
          {result.feedback && (
            <p className="mt-1 text-sm text-ink-2">{result.feedback}</p>
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
  readOnly: _readOnly = false,
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
        }
      );
      onAnswer(res);
      playSound(res.correct ? "correct" : "incorrect");
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
        <div className="mb-5 rounded-[14px] border border-rule bg-paper-2 p-5">
          <p className="text-sm text-ink">{exercise.prompt}</p>
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
          className="w-full rounded-lg border border-rule bg-paper px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none transition-colors focus:border-teal disabled:opacity-60"
        />
      </div>

      {!result && (
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting}
          className="w-full rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark active:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "送信中..." : "送信"}
        </button>
      )}

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg px-5 py-4 ${
            result.correct
              ? "border border-teal bg-teal-50"
              : "border border-mustard/40 bg-mustard-50"
          }`}
        >
          <p
            className={`mb-1 text-sm font-semibold ${result.correct ? "text-teal" : "text-mustard-fg"}`}
          >
            {result.correct ? "よくできました！" : "AIフィードバック"}
          </p>
          {result.feedback && (
            <p className="text-sm text-ink">{result.feedback}</p>
          )}
          {result.correctAnswer && (
            <div className="mt-3 rounded-lg border border-rule bg-paper p-3">
              <p className="mb-1 text-xs font-medium text-ink-3">模範解答</p>
              <p className="text-sm text-ink">{result.correctAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ErrorCorrectionExercise
// ---------------------------------------------------------------------------

function ErrorCorrectionExercise({
  lessonId,
  exercise,
  result,
  onAnswer,
  readOnly: _readOnly = false,
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
        }
      );
      onAnswer(res);
      playSound(res.correct ? "correct" : "incorrect");
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
      {/* Error sentence to fix */}
      <div className="mb-6 rounded-[14px] border border-coral/30 bg-coral-50 p-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-coral-fg">
          この文の間違いを見つけて修正しよう
        </p>
        <p className="font-mono text-base text-ink">
          {exercise.errorSentence ?? exercise.sentence ?? ""}
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
          placeholder="修正した文を入力..."
          className="flex-1 rounded-lg border border-rule bg-paper px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none transition-colors focus:border-teal disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting || result !== null}
          className="rounded-lg bg-teal px-5 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark active:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "..." : "確認"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg px-5 py-4 ${
            result.correct
              ? "border border-teal bg-teal-50"
              : "border border-coral bg-coral-50"
          }`}
        >
          <p
            className={`mb-1 text-sm font-semibold ${result.correct ? "text-teal" : "text-coral-fg"}`}
          >
            {result.correct ? "正解！" : "惜しい！"}
          </p>
          {!result.correct && result.correctAnswer && (
            <p className="text-sm text-ink-2">
              正解：{" "}
              <span className="font-medium text-ink">
                {result.correctAnswer}
              </span>
            </p>
          )}
          {result.feedback && (
            <p className="mt-1 text-sm text-ink-2">{result.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ParaphraseExercise
// ---------------------------------------------------------------------------

function ParaphraseExercise({
  lessonId,
  exercise,
  result,
  onAnswer,
  readOnly: _readOnly = false,
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
        }
      );
      onAnswer(res);
      playSound(res.correct ? "correct" : "incorrect");
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
      {/* Original sentence to paraphrase */}
      {exercise.prompt && (
        <div className="mb-5 rounded-[14px] border border-plum/30 bg-plum-50 p-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-plum">
            この文を別の表現で言い換えよう
          </p>
          <p className="text-sm font-medium text-ink">{exercise.prompt}</p>
        </div>
      )}

      {/* Textarea */}
      <div className="mb-4">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={result !== null}
          placeholder="別の英語表現で書き直そう..."
          rows={4}
          className="w-full rounded-lg border border-rule bg-paper px-4 py-3 text-sm text-ink placeholder-ink-3 outline-none transition-colors focus:border-teal disabled:opacity-60"
        />
      </div>

      {!result && (
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || isSubmitting}
          className="w-full rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark active:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "送信中..." : "送信"}
        </button>
      )}

      {/* Result */}
      {result && (
        <div
          className={`rounded-lg px-5 py-4 ${
            result.correct
              ? "border border-teal bg-teal-50"
              : "border border-mustard/40 bg-mustard-50"
          }`}
        >
          <p
            className={`mb-1 text-sm font-semibold ${result.correct ? "text-teal" : "text-mustard-fg"}`}
          >
            {result.correct ? "よくできました！" : "AIフィードバック"}
          </p>
          {result.feedback && (
            <p className="text-sm text-ink">{result.feedback}</p>
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
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-3">
          まとめ
        </p>
        <h2 className="text-lg font-semibold text-ink">
          今日もよくできました！
        </h2>
      </div>

      {/* Summary */}
      <div className="mb-6 rounded-[14px] border border-rule bg-paper-2 p-6">
        <p className="text-sm leading-relaxed text-ink">{wrapup.summary}</p>
      </div>

      {/* Key points */}
      {wrapup.keyPoints.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-3">
            重要ポイント
          </p>
          <ul className="flex flex-col gap-3">
            {wrapup.keyPoints.map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-[14px] border border-rule bg-paper-2 p-4"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal text-xs font-bold text-paper">
                  {i + 1}
                </span>
                <p className="text-sm text-ink">{point}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next preview */}
      {wrapup.nextPreview && (
        <div className="mb-6 rounded-[14px] border border-rule bg-paper-2/50 p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-3">
            次回のレッスン
          </p>
          <p className="text-sm text-ink-2">{wrapup.nextPreview}</p>
        </div>
      )}

      <button
        onClick={onComplete}
        className="w-full rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark active:bg-teal-dark"
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
  lessonId,
  completionData,
  onNavigate,
}: {
  lessonId: string;
  completionData: LessonCompleteResponse | null;
  onNavigate: (path: string) => void;
}) {
  const [cardAdded, setCardAdded] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [addCardError, setAddCardError] = useState<string | null>(null);

  useEffect(() => {
    playSound("complete");
    if (completionData?.streak.isNewRecord) {
      const t = setTimeout(() => playSound("newRecord"), 700);
      return () => clearTimeout(t);
    }
  }, [completionData]);

  const handleAddToCards = useCallback(async () => {
    setAddingCard(true);
    setAddCardError(null);
    try {
      await apiFetch<AddLessonPhraseCardResponse>(
        `/api/lessons/${lessonId}/add-to-cards`,
        { method: "POST" }
      );
      setCardAdded(true);
      playSound("complete");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setCardAdded(true);
      } else {
        setAddCardError("カードの追加に失敗しました");
      }
    } finally {
      setAddingCard(false);
    }
  }, [lessonId]);

  const focusPhrase = completionData?.focusPhrase;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-8">
      <div className="w-full max-w-md text-center">
        {/* Trophy icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-mustard/40 bg-mustard-50">
            <span className="text-4xl" role="img" aria-label="Trophy">
              {"\uD83C\uDFC6"}
            </span>
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-ink">レッスン完了！</h1>
        <p className="mb-8 text-sm text-ink-2">
          今日のレッスンが終わりました。引き続き頑張りましょう！
        </p>

        {/* Score + streak */}
        {completionData && (
          <div className="mb-8 rounded-[14px] border border-rule bg-paper-2 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[14px] border border-rule bg-paper p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-3">
                  スコア
                </p>
                <p className="font-mono text-3xl font-bold text-ink">
                  {completionData.score}
                </p>
              </div>
              <div className="rounded-[14px] border border-rule bg-paper p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-3">
                  連続記録
                </p>
                <p className="flex items-center justify-center gap-1 font-mono text-3xl font-bold text-ink">
                  <FlameIcon
                    size={30}
                    className={
                      completionData.streak.currentStreak > 0
                        ? "text-coral"
                        : "text-ink-3"
                    }
                  />
                  {completionData.streak.currentStreak}
                </p>
              </div>
            </div>

            {completionData.streak.isNewRecord && (
              <div className="mt-4 rounded-lg border border-mustard/40 bg-mustard-50 px-4 py-3">
                <p className="text-sm font-semibold text-mustard-fg">
                  {"\uD83C\uDF89"} 新記録達成：
                  {completionData.streak.longestStreak}日連続！
                </p>
              </div>
            )}

            {completionData.tek && (
              <div className="mt-4 rounded-lg border border-teal/30 bg-teal-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TekIcon size={18} className="text-teal" />
                  <span className="text-sm font-semibold text-teal-dark">
                    tek 獲得
                  </span>
                </div>
                <span className="font-mono text-lg font-bold text-teal">
                  +{completionData.tek.earned}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Focus phrase card addition */}
        {focusPhrase && (
          <div className="mb-8 rounded-[14px] border border-rule bg-paper-2 p-6 text-left">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-3">
              今日のフレーズ
            </p>
            <p className="mb-1 font-mono text-lg font-bold text-ink">
              {focusPhrase.phrase}
            </p>
            <p className="mb-4 text-sm leading-relaxed text-ink-2">
              {focusPhrase.explanation}
            </p>

            {cardAdded ? (
              <div className="rounded-lg border border-teal/30 bg-teal-50 px-4 py-3 text-center">
                <p className="text-sm font-semibold text-teal">
                  カードに追加しました
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={handleAddToCards}
                  disabled={addingCard}
                  className="w-full rounded-lg border border-plum/30 bg-plum-50 px-4 py-3 text-sm font-semibold text-plum transition-colors hover:border-plum/50 hover:bg-plum-50/80 active:bg-plum-50/60 disabled:opacity-50"
                >
                  {addingCard ? "追加中..." : "フレーズカードに追加する"}
                </button>
                {addCardError && (
                  <p className="mt-2 text-xs text-coral">{addCardError}</p>
                )}
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onNavigate("/dashboard")}
            className="w-full rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-paper transition-colors hover:bg-teal-dark active:bg-teal-dark"
          >
            ダッシュボードに戻る
          </button>
          <button
            onClick={() => onNavigate("/cards/review")}
            className="w-full rounded-lg border border-rule bg-paper px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink-3 hover:bg-paper-2"
          >
            フレーズカードを復習する
          </button>
        </div>
      </div>
    </main>
  );
}
