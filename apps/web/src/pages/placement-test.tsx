import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type {
  PlacementAnswerFeedback,
  PlacementNextResponse,
  PlacementQuestionClient,
  SkillAxis,
} from "@teklin/shared";

const AXIS_META: Record<SkillAxis, { label: string; color: string }> = {
  reading: { label: "リーディング", color: "bg-blue-500/20 text-blue-400" },
  writing: { label: "ライティング", color: "bg-green-500/20 text-green-400" },
  vocabulary: {
    label: "ボキャブラリー",
    color: "bg-purple-500/20 text-purple-400",
  },
  nuance: { label: "ニュアンス", color: "bg-amber-500/20 text-amber-400" },
};

export function PlacementTestPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<PlacementQuestionClient | null>(
    null
  );
  const [progress, setProgress] = useState({ current: 0, total: 20 });
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<PlacementAnswerFeedback | null>(null);
  const [pendingNext, setPendingNext] = useState<PlacementNextResponse | null>(null);

  // Load the first question on mount
  useEffect(() => {
    if (authLoading || !user) return;

    apiFetch<PlacementNextResponse>("/api/placement/start", {
      method: "POST",
    })
      .then((data) => {
        if (data.isComplete) {
          setIsComplete(true);
        } else {
          setQuestion(data.question);
          setProgress(data.progress);
        }
      })
      .catch(() => {
        setError("テストの読み込みに失敗しました。もう一度お試しください。");
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, [authLoading, user]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (!question || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const data = await apiFetch<PlacementNextResponse>(
        "/api/placement/answer",
        {
          method: "POST",
          body: JSON.stringify({ questionId: question.id, answer }),
        }
      );

      const isSkip = answer === "__skip__";
      if (data.feedback && !isSkip) {
        setFeedback(data.feedback);
        setPendingNext(data);
      } else if (data.isComplete) {
        setIsComplete(true);
      } else {
        setQuestion(data.question);
        setProgress(data.progress);
        setSelectedChoice(null);
        setFreeText("");
      }
    } catch {
      setError("回答の送信に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }, [question, isSubmitting]);

  const dismissFeedback = useCallback(() => {
    if (!pendingNext) return;
    setFeedback(null);
    setPendingNext(null);
    if (pendingNext.isComplete) {
      setIsComplete(true);
    } else {
      setQuestion(pendingNext.question);
      setProgress(pendingNext.progress);
      setSelectedChoice(null);
      setFreeText("");
    }
  }, [pendingNext]);

  const handleSubmit = useCallback(async () => {
    if (!question) return;
    const answer =
      question.type === "multiple_choice" ? selectedChoice : freeText.trim();
    if (!answer) return;
    await submitAnswer(answer);
  }, [question, selectedChoice, freeText, submitAnswer]);

  const handleSkip = useCallback(async () => {
    await submitAnswer("__skip__");
  }, [submitAnswer]);

  // When test completes, call complete endpoint and navigate to results
  useEffect(() => {
    if (!isComplete) return;

    apiFetch<unknown>("/api/placement/complete", { method: "POST" })
      .then(() => {
        navigate("/placement/result");
      })
      .catch(() => {
        setError("Failed to save results. Please try again.");
        setIsComplete(false);
      });
  }, [isComplete, navigate]);

  const canSubmit =
    !isSubmitting &&
    question !== null &&
    (question.type === "multiple_choice"
      ? selectedChoice !== null
      : freeText.trim().length > 0);

  const progressPercent =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  // -- Loading states --

  if (authLoading || isInitializing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500"
            role="status"
            aria-label="テストを読み込み中"
          />
          <p className="text-sm text-gray-400">読み込み中...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // -- Completing state --

  if (isComplete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500"
            role="status"
            aria-label="結果を保存中"
          />
          <p className="text-sm text-gray-400">結果を計算中...</p>
        </div>
      </main>
    );
  }

  // -- Error state (no question loaded) --

  if (!question) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <p className="mb-4 text-gray-400">
            {error || "問題の読み込みに失敗しました。"}
          </p>
          <button
            onClick={() => navigate("/placement")}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            最初に戻る
          </button>
        </div>
      </main>
    );
  }

  // -- Main test UI --

  const axisMeta = AXIS_META[question.axis];

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Progress section */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-mono text-gray-400">
              {progress.current}/{progress.total}
            </span>
            <span className="font-mono text-gray-400">{progressPercent}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-gray-800"
            role="progressbar"
            aria-valuenow={progress.current}
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-label={`Question ${progress.current} of ${progress.total}`}
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          {/* Axis label */}
          <span
            className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold ${axisMeta.color}`}
          >
            {axisMeta.label}
          </span>

          {/* Prompt */}
          <p className="mb-6 text-lg leading-relaxed text-gray-100">
            {question.prompt}
          </p>

          {/* Context block */}
          {question.context && (
            <div className="mb-6 rounded-lg bg-gray-800 p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-300">
                {question.context}
              </pre>
            </div>
          )}

          {/* Writing feedback banner */}
          {feedback?.type === "free_text" && (
            <div
              className={`mb-6 rounded-xl border px-5 py-4 ${
                feedback.rating === "Excellent!!!"
                  ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
                  : feedback.rating === "Good!"
                    ? "border-green-500/40 bg-green-500/10 text-green-300"
                    : feedback.rating === "OK"
                      ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                      : "border-red-500/40 bg-red-500/10 text-red-400"
              }`}
            >
              <p className="text-center text-2xl font-bold">{feedback.rating}</p>
              {feedback.advice && (
                <p className="mt-2 text-center text-sm opacity-80">{feedback.advice}</p>
              )}
            </div>
          )}

          {/* Answer input */}
          {question.type === "multiple_choice" && question.choices ? (
            <fieldset className="mb-6 space-y-3" disabled={!!feedback}>
              <legend className="sr-only">Select your answer</legend>
              {question.choices.map((choice) => {
                const isSelected = selectedChoice === choice.id;
                const mcFeedback =
                  feedback?.type === "multiple_choice" ? feedback : null;
                const isCorrectChoice =
                  mcFeedback?.correctChoiceId === choice.id;
                const isWrongSelected =
                  mcFeedback && isSelected && !mcFeedback.isCorrect;

                let borderColor = "border-gray-700 bg-gray-950 hover:border-gray-600";
                if (mcFeedback) {
                  if (isCorrectChoice)
                    borderColor = "border-green-500 bg-green-950/30";
                  else if (isWrongSelected)
                    borderColor = "border-red-500 bg-red-950/30";
                  else borderColor = "border-gray-700 bg-gray-950";
                } else if (isSelected) {
                  borderColor = "border-blue-500 bg-blue-950/30";
                }

                return (
                  <label
                    key={choice.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      mcFeedback ? "cursor-default" : "cursor-pointer"
                    } ${borderColor}`}
                  >
                    <input
                      type="radio"
                      name="placement-choice"
                      value={choice.id}
                      checked={isSelected}
                      onChange={() => setSelectedChoice(choice.id)}
                      className="sr-only"
                      disabled={isSubmitting || !!feedback}
                    />
                    <span
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        mcFeedback
                          ? isCorrectChoice
                            ? "border-green-500 bg-green-500"
                            : isWrongSelected
                              ? "border-red-500 bg-red-500"
                              : "border-gray-600"
                          : isSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-600"
                      }`}
                      aria-hidden="true"
                    >
                      {(isSelected || (mcFeedback && isCorrectChoice)) && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="text-sm text-gray-200">{choice.text}</span>
                  </label>
                );
              })}
            </fieldset>
          ) : (
            <div className="mb-6">
              <label htmlFor="free-text-answer" className="sr-only">
                Your answer
              </label>
              <textarea
                id="free-text-answer"
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="答えを入力..."
                disabled={isSubmitting || !!feedback}
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="mb-4 rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Submit / Next button */}
          {feedback ? (
            <button
              onClick={dismissFeedback}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
            >
              次へ
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden="true"
                  />
                  採点中...
                </span>
              ) : progress.current === progress.total - 1 ? (
                "完了"
              ) : (
                "回答する"
              )}
            </button>
          )}

          {/* Skip button */}
          {!feedback && (
            <div className="mt-3 text-center">
              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className="text-sm text-gray-600 underline-offset-2 transition-colors hover:text-gray-400 hover:underline disabled:cursor-not-allowed"
              >
                わからない
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
