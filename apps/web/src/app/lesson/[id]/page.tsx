"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type {
  DifficultyFeedback,
  ExerciseType,
  LessonAnswerResponse,
  LessonCompleteResponse,
  LessonContent,
  LessonFeedbackResponse,
  RewriteContext,
  TodayLessonResponse,
} from "@teklin/shared";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Step = "warmup" | "focus" | "practice" | "wrapup" | "complete";

const STEPS: Exclude<Step, "complete">[] = [
  "warmup",
  "focus",
  "practice",
  "wrapup",
];

const STEP_LABELS: Record<Step, string> = {
  warmup: "Warm-up",
  focus: "Focus",
  practice: "Practice",
  wrapup: "Wrap-up",
  complete: "Complete",
};

const CONTEXT_BADGE: Record<RewriteContext, { label: string; color: string }> =
  {
    commit_message: {
      label: "Commit Message",
      color: "bg-green-500/20 text-green-400",
    },
    pr_comment: {
      label: "PR Comment",
      color: "bg-blue-500/20 text-blue-400",
    },
    github_issue: {
      label: "GitHub Issue",
      color: "bg-purple-500/20 text-purple-400",
    },
    slack: { label: "Slack", color: "bg-amber-500/20 text-amber-400" },
    general: { label: "General", color: "bg-gray-500/20 text-gray-400" },
  };

const TOTAL_SECONDS = 5 * 60; // 5 minutes

// ---------------------------------------------------------------------------
// Timer hook
// ---------------------------------------------------------------------------

function useTimer(totalSeconds: number) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return { remaining, display };
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function LessonPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  // Lesson data
  const [content, setContent] = useState<LessonContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Step management
  const [currentStep, setCurrentStep] = useState<Step>("warmup");

  // Completion data
  const [completionData, setCompletionData] =
    useState<LessonCompleteResponse | null>(null);

  // Load lesson content
  useEffect(() => {
    if (authLoading || !user) return;

    apiFetch<TodayLessonResponse>("/api/lessons/today")
      .then((res) => {
        if (res.lesson && res.lesson.id === lessonId) {
          setContent(res.lesson.content);
        } else if (res.lesson) {
          // Lesson found but different ID -- still show it
          setContent(res.lesson.content);
        } else {
          setError("Lesson not found.");
        }
      })
      .catch(() => setError("Failed to load lesson."))
      .finally(() => setIsLoading(false));
  }, [authLoading, user, lessonId]);

  const handleStepComplete = useCallback(
    (nextStep: Step) => {
      if (nextStep === "complete") {
        // Call complete endpoint
        apiFetch<LessonCompleteResponse>(`/api/lessons/${lessonId}/complete`, {
          method: "POST",
        })
          .then((data) => setCompletionData(data))
          .catch(() => {
            // Even if API fails, show the complete screen with fallback
            setCompletionData({
              score: 0,
              streak: {
                currentStreak: 0,
                longestStreak: 0,
                isNewRecord: false,
              },
              completedAt: new Date().toISOString(),
            });
          });
      }
      setCurrentStep(nextStep);
    },
    [lessonId]
  );

  // -- Loading --
  if (authLoading || isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500"
            role="status"
            aria-label="Loading lesson"
          />
          <p className="text-sm text-gray-400">Loading lesson...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (error || !content) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <p className="mb-4 text-gray-400">
            {error || "Lesson not available."}
          </p>
          <Link
            href="/lesson"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Back to Lessons
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
        router={router}
      />
    );
  }

  return (
    <LessonShell currentStep={currentStep}>
      {currentStep === "warmup" && (
        <WarmupStep
          lessonId={lessonId}
          questions={content.warmup.questions}
          onComplete={() => handleStepComplete("focus")}
        />
      )}
      {currentStep === "focus" && (
        <FocusStep
          focus={content.focus}
          onComplete={() => handleStepComplete("practice")}
        />
      )}
      {currentStep === "practice" && (
        <PracticeStep
          lessonId={lessonId}
          exercises={content.practice.exercises}
          onComplete={() => handleStepComplete("wrapup")}
        />
      )}
      {currentStep === "wrapup" && (
        <WrapupStep
          wrapup={content.wrapup}
          onComplete={() => handleStepComplete("complete")}
        />
      )}
    </LessonShell>
  );
}

// ---------------------------------------------------------------------------
// Shell -- progress bar + timer
// ---------------------------------------------------------------------------

function LessonShell({
  currentStep,
  children,
}: {
  currentStep: Step;
  children: React.ReactNode;
}) {
  const timer = useTimer(TOTAL_SECONDS);
  const stepIndex = STEPS.indexOf(currentStep as Exclude<Step, "complete">);
  const progressPercent = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        {/* Top bar: step indicator + timer */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-200">
              {STEP_LABELS[currentStep]}
            </span>
            <span
              className={`font-mono text-sm ${
                timer.remaining <= 60 ? "text-amber-400" : "text-gray-400"
              }`}
              aria-label={`${Math.floor(timer.remaining / 60)} minutes ${timer.remaining % 60} seconds remaining`}
            >
              {timer.display}
            </span>
          </div>

          {/* Step progress */}
          <div className="flex gap-1.5">
            {STEPS.map((step, i) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i <= stepIndex ? "bg-blue-500" : "bg-gray-800"
                }`}
                role="presentation"
              />
            ))}
          </div>

          {/* Accessibility progress */}
          <div
            className="sr-only"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            Step {stepIndex + 1} of {STEPS.length}: {STEP_LABELS[currentStep]}
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Warm-up step
// ---------------------------------------------------------------------------

interface WarmupQuestionClient {
  id: string;
  phrase: string;
  translation: string;
  context: string;
  type: "multiple_choice";
  choices: { id: string; text: string }[];
}

function WarmupStep({
  lessonId,
  questions,
  onComplete,
}: {
  lessonId: string;
  questions: WarmupQuestionClient[];
  onComplete: () => void;
}) {
  const [qIndex, setQIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<LessonAnswerResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const q = questions[qIndex];

  const handleSelect = useCallback(
    async (choiceId: string) => {
      if (result || isSubmitting || !q) return;
      setSelectedId(choiceId);
      setIsSubmitting(true);

      try {
        const res = await apiFetch<LessonAnswerResponse>(
          `/api/lessons/${lessonId}/answer`,
          {
            method: "POST",
            body: JSON.stringify({
              step: "warmup",
              exerciseId: q.id,
              answer: choiceId,
            }),
          }
        );
        setResult(res);
      } catch {
        // On error, show as incorrect with no feedback
        setResult({ correct: false, score: 0 });
      } finally {
        setIsSubmitting(false);
      }
    },
    [result, isSubmitting, q, lessonId]
  );

  const handleNext = useCallback(() => {
    if (qIndex + 1 < questions.length) {
      setQIndex((prev) => prev + 1);
      setSelectedId(null);
      setResult(null);
    } else {
      onComplete();
    }
  }, [qIndex, questions.length, onComplete]);

  if (!q) {
    onComplete();
    return null;
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      {/* Question counter */}
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-500">
        Review {qIndex + 1} / {questions.length}
      </p>

      {/* Context badge */}
      <span className="mb-3 inline-block rounded-full bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-300">
        {q.context}
      </span>

      {/* Phrase */}
      <p className="mb-2 text-lg font-semibold text-gray-100">{q.phrase}</p>
      <p className="mb-6 text-sm text-gray-400">{q.translation}</p>

      {/* Choices */}
      <fieldset className="mb-6 space-y-3">
        <legend className="sr-only">Select the correct answer</legend>
        {q.choices.map((choice) => {
          const isSelected = selectedId === choice.id;
          const isCorrect =
            result?.correctAnswer === choice.id ||
            (result?.correct && isSelected);
          const isWrong = result && isSelected && !result.correct;

          let borderColor = "border-gray-700 hover:border-gray-600";
          let bgColor = "bg-gray-950";

          if (result) {
            if (isCorrect) {
              borderColor = "border-green-500";
              bgColor = "bg-green-950/30";
            } else if (isWrong) {
              borderColor = "border-red-500";
              bgColor = "bg-red-950/30";
            }
          } else if (isSelected) {
            borderColor = "border-blue-500";
            bgColor = "bg-blue-950/30";
          }

          return (
            <button
              key={choice.id}
              onClick={() => handleSelect(choice.id)}
              disabled={!!result || isSubmitting}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-default ${borderColor} ${bgColor}`}
            >
              <span
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  result && isCorrect
                    ? "border-green-500 bg-green-500"
                    : result && isWrong
                      ? "border-red-500 bg-red-500"
                      : isSelected
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-600"
                }`}
                aria-hidden="true"
              >
                {(isSelected || (result && isCorrect)) && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </span>
              <span className="text-sm text-gray-200">{choice.text}</span>
            </button>
          );
        })}
      </fieldset>

      {/* Feedback */}
      {result && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            result.correct
              ? "border border-green-800 bg-green-950/40 text-green-400"
              : "border border-red-800 bg-red-950/40 text-red-400"
          }`}
          role="alert"
          aria-live="polite"
        >
          {result.correct ? "Correct!" : "Incorrect."}
          {result.feedback && (
            <span className="ml-1 text-gray-400">{result.feedback}</span>
          )}
        </div>
      )}

      {/* Next button */}
      {result && (
        <button
          onClick={handleNext}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
        >
          {qIndex + 1 < questions.length ? "Next Question" : "Continue"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Focus step
// ---------------------------------------------------------------------------

function FocusStep({
  focus,
  onComplete,
}: {
  focus: LessonContent["focus"];
  onComplete: () => void;
}) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [tipsOpen, setTipsOpen] = useState(false);

  const example = focus.examples[exampleIndex];
  const badge = example ? CONTEXT_BADGE[example.context] : null;

  return (
    <div className="space-y-6">
      {/* Phrase card */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
          Today&apos;s Phrase
        </p>
        <p className="mb-3 text-xl font-bold text-gray-100">{focus.phrase}</p>
        <p className="text-sm leading-relaxed text-gray-400">
          {focus.explanation}
        </p>
      </div>

      {/* Example slider */}
      {focus.examples.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Example {exampleIndex + 1} / {focus.examples.length}
            </p>
            {badge && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.color}`}
              >
                {badge.label}
              </span>
            )}
          </div>

          {example && (
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-800 p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-200">
                  {example.english}
                </pre>
              </div>
              <p className="text-sm text-gray-400">{example.japanese}</p>
            </div>
          )}

          {/* Example navigation */}
          <div className="mt-4 flex gap-2">
            {focus.examples.map((_, i) => (
              <button
                key={i}
                onClick={() => setExampleIndex(i)}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i === exampleIndex ? "bg-blue-500" : "bg-gray-700"
                }`}
                aria-label={`Example ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tips accordion */}
      {focus.tips.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900">
          <button
            onClick={() => setTipsOpen(!tipsOpen)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
            aria-expanded={tipsOpen}
          >
            <span className="text-sm font-semibold text-gray-200">
              Tips ({focus.tips.length})
            </span>
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                tipsOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          {tipsOpen && (
            <div className="border-t border-gray-800 px-6 py-4">
              <ul className="space-y-2">
                {focus.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-gray-400"
                  >
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Next button */}
      <button
        onClick={onComplete}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
      >
        Start Practice
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Practice step
// ---------------------------------------------------------------------------

interface ExerciseClient {
  id: string;
  type: ExerciseType;
  instruction: string;
  sentence?: string;
  words?: string[];
  prompt?: string;
}

function PracticeStep({
  lessonId,
  exercises,
  onComplete,
}: {
  lessonId: string;
  exercises: ExerciseClient[];
  onComplete: () => void;
}) {
  const [exIndex, setExIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [reorderWords, setReorderWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [result, setResult] = useState<LessonAnswerResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ex = exercises[exIndex];

  // Reset state for each exercise
  useEffect(() => {
    setAnswer("");
    setResult(null);
    if (ex?.type === "reorder" && ex.words) {
      setAvailableWords([...ex.words]);
      setReorderWords([]);
    }
  }, [exIndex, ex?.type, ex?.words]);

  const currentAnswer = useMemo(() => {
    if (!ex) return "";
    if (ex.type === "reorder") return reorderWords.join(" ");
    return answer.trim();
  }, [ex, answer, reorderWords]);

  const handleSubmit = useCallback(async () => {
    if (!ex || !currentAnswer || isSubmitting || result) return;
    setIsSubmitting(true);

    try {
      const res = await apiFetch<LessonAnswerResponse>(
        `/api/lessons/${lessonId}/answer`,
        {
          method: "POST",
          body: JSON.stringify({
            step: "practice",
            exerciseId: ex.id,
            answer: currentAnswer,
          }),
        }
      );
      setResult(res);
    } catch {
      setResult({ correct: false, score: 0 });
    } finally {
      setIsSubmitting(false);
    }
  }, [ex, currentAnswer, isSubmitting, result, lessonId]);

  const handleNext = useCallback(() => {
    if (exIndex + 1 < exercises.length) {
      setExIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [exIndex, exercises.length, onComplete]);

  const handleWordTap = useCallback((word: string, idx: number) => {
    setAvailableWords((prev) => prev.filter((_, i) => i !== idx));
    setReorderWords((prev) => [...prev, word]);
  }, []);

  const handleWordRemove = useCallback((word: string, idx: number) => {
    setReorderWords((prev) => prev.filter((_, i) => i !== idx));
    setAvailableWords((prev) => [...prev, word]);
  }, []);

  if (!ex) {
    onComplete();
    return null;
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
      {/* Exercise counter */}
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-500">
        Exercise {exIndex + 1} / {exercises.length}
      </p>

      {/* Instruction */}
      <p className="mb-4 text-base font-semibold text-gray-100">
        {ex.instruction}
      </p>

      {/* Exercise type-specific UI */}
      {ex.type === "fill_in_blank" && (
        <FillInBlank
          sentence={ex.sentence ?? ""}
          answer={answer}
          onAnswerChange={setAnswer}
          disabled={!!result}
        />
      )}

      {ex.type === "reorder" && (
        <ReorderExercise
          reorderWords={reorderWords}
          availableWords={availableWords}
          onWordTap={handleWordTap}
          onWordRemove={handleWordRemove}
          disabled={!!result}
        />
      )}

      {ex.type === "free_text" && (
        <FreeTextExercise
          prompt={ex.prompt ?? ""}
          answer={answer}
          onAnswerChange={setAnswer}
          disabled={!!result}
        />
      )}

      {/* Feedback */}
      {result && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            result.correct
              ? "border border-green-800 bg-green-950/40 text-green-400"
              : "border border-red-800 bg-red-950/40 text-red-400"
          }`}
          role="alert"
          aria-live="polite"
        >
          <p className="font-semibold">
            {result.correct ? "Correct!" : "Incorrect."}
          </p>
          {result.correctAnswer && (
            <p className="mt-1 text-gray-300">
              Correct answer:{" "}
              <span className="font-mono text-gray-200">
                {result.correctAnswer}
              </span>
            </p>
          )}
          {result.feedback && (
            <p className="mt-1 text-gray-400">{result.feedback}</p>
          )}
        </div>
      )}

      {/* Submit / Next */}
      {!result ? (
        <button
          onClick={handleSubmit}
          disabled={!currentAnswer || isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
              Checking...
            </span>
          ) : (
            "Submit"
          )}
        </button>
      ) : (
        <button
          onClick={handleNext}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
        >
          {exIndex + 1 < exercises.length ? "Next Exercise" : "Continue"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fill in the blank
// ---------------------------------------------------------------------------

function FillInBlank({
  sentence,
  answer,
  onAnswerChange,
  disabled,
}: {
  sentence: string;
  answer: string;
  onAnswerChange: (v: string) => void;
  disabled: boolean;
}) {
  // Split sentence around ___
  const parts = sentence.split("___");

  return (
    <div className="mb-6">
      <div className="mb-4 rounded-lg bg-gray-800 p-4">
        <p className="text-sm leading-relaxed text-gray-200">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <span className="mx-1 inline-block min-w-[80px] border-b-2 border-blue-500 px-1 font-mono text-blue-400">
                  {answer || "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}
                </span>
              )}
            </span>
          ))}
        </p>
      </div>
      <label htmlFor="fill-blank-input" className="sr-only">
        Fill in the blank
      </label>
      <input
        id="fill-blank-input"
        type="text"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer..."
        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
        autoComplete="off"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reorder exercise (tap-to-build)
// ---------------------------------------------------------------------------

function ReorderExercise({
  reorderWords,
  availableWords,
  onWordTap,
  onWordRemove,
  disabled,
}: {
  reorderWords: string[];
  availableWords: string[];
  onWordTap: (word: string, idx: number) => void;
  onWordRemove: (word: string, idx: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="mb-6 space-y-4">
      {/* Built sentence */}
      <div className="min-h-[52px] rounded-lg border border-gray-700 bg-gray-800 p-3">
        {reorderWords.length === 0 ? (
          <p className="text-sm text-gray-500">Tap words to build a sentence</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {reorderWords.map((word, i) => (
              <button
                key={`built-${i}`}
                onClick={() => !disabled && onWordRemove(word, i)}
                disabled={disabled}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
              >
                {word}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Available words */}
      <div className="flex flex-wrap gap-2">
        {availableWords.map((word, i) => (
          <button
            key={`avail-${i}`}
            onClick={() => !disabled && onWordTap(word, i)}
            disabled={disabled}
            className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-800 disabled:opacity-60"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Free text exercise
// ---------------------------------------------------------------------------

function FreeTextExercise({
  prompt,
  answer,
  onAnswerChange,
  disabled,
}: {
  prompt: string;
  answer: string;
  onAnswerChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="mb-6">
      {prompt && (
        <div className="mb-4 rounded-lg bg-gray-800 p-4">
          <p className="text-sm leading-relaxed text-gray-300">{prompt}</p>
        </div>
      )}
      <label htmlFor="free-text-input" className="sr-only">
        Your answer
      </label>
      <textarea
        id="free-text-input"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer..."
        rows={4}
        className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Wrap-up step
// ---------------------------------------------------------------------------

function WrapupStep({
  wrapup,
  onComplete,
}: {
  wrapup: LessonContent["wrapup"];
  onComplete: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
          Summary
        </p>
        <p className="text-sm leading-relaxed text-gray-300">
          {wrapup.summary}
        </p>
      </div>

      {/* Key points */}
      {wrapup.keyPoints.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            Key Points
          </p>
          <ul className="space-y-2">
            {wrapup.keyPoints.map((point, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-300"
              >
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next preview */}
      {wrapup.nextPreview && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
            Coming Up Next
          </p>
          <p className="text-sm text-gray-400">{wrapup.nextPreview}</p>
        </div>
      )}

      {/* Complete button */}
      <button
        onClick={onComplete}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
      >
        Complete Lesson
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Complete screen
// ---------------------------------------------------------------------------

function CompleteScreen({
  lessonId,
  completionData,
  router,
}: {
  lessonId: string;
  completionData: LessonCompleteResponse | null;
  router: ReturnType<typeof useRouter>;
}) {
  const [feedback, setFeedback] = useState<DifficultyFeedback | null>(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showScore, setShowScore] = useState(false);

  // Animate score in
  useEffect(() => {
    const timer = setTimeout(() => setShowScore(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleFeedback = useCallback(
    async (difficulty: DifficultyFeedback) => {
      setFeedback(difficulty);
      try {
        await apiFetch<LessonFeedbackResponse>(
          `/api/lessons/${lessonId}/feedback`,
          {
            method: "POST",
            body: JSON.stringify({ difficulty }),
          }
        );
      } catch {
        // Silent fail for feedback
      }
      setFeedbackSent(true);
    },
    [lessonId]
  );

  const score = completionData?.score ?? 0;
  const streak = completionData?.streak;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        {/* Score display */}
        <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-500">
            Lesson Complete
          </p>

          <div
            className={`mb-4 transition-all duration-700 ${
              showScore
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <p className="font-mono text-6xl font-bold text-gray-100">
              {score}
            </p>
            <p className="text-sm text-gray-400">/ 100</p>
          </div>

          {/* Streak */}
          {streak && (
            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-500 delay-300 ${
                showScore
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              } ${
                streak.isNewRecord
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-gray-800 text-gray-300"
              }`}
            >
              <span role="img" aria-label="Fire">
                {"\uD83D\uDD25"}
              </span>
              <span className="font-mono text-sm font-semibold">
                {streak.currentStreak} day streak
              </span>
              {streak.isNewRecord && (
                <span className="text-xs font-medium">New record!</span>
              )}
            </div>
          )}
        </div>

        {/* Difficulty feedback */}
        <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="mb-4 text-center text-sm font-semibold text-gray-200">
            How was the difficulty?
          </p>
          {!feedbackSent ? (
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { key: "too_easy", label: "Too Easy", icon: "\uD83D\uDE34" },
                  {
                    key: "just_right",
                    label: "Just Right",
                    icon: "\uD83D\uDC4D",
                  },
                  { key: "too_hard", label: "Too Hard", icon: "\uD83E\uDD2F" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleFeedback(opt.key)}
                  disabled={!!feedback}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-colors ${
                    feedback === opt.key
                      ? "border-blue-500 bg-blue-950/30"
                      : "border-gray-700 hover:border-gray-600 hover:bg-gray-800"
                  } disabled:cursor-default`}
                >
                  <span className="text-xl" role="img" aria-hidden="true">
                    {opt.icon}
                  </span>
                  <span className="text-xs text-gray-300">{opt.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400">
              Thanks for your feedback!
            </p>
          )}
        </div>

        {/* Back to dashboard */}
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
        >
          Back to Dashboard
        </button>
      </div>
    </main>
  );
}
