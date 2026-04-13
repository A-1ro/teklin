"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type {
  PlacementNextResponse,
  PlacementQuestionClient,
  SkillAxis,
} from "@teklin/shared";

const AXIS_META: Record<SkillAxis, { label: string; color: string }> = {
  reading: { label: "Reading", color: "bg-blue-500/20 text-blue-400" },
  writing: { label: "Writing", color: "bg-green-500/20 text-green-400" },
  vocabulary: {
    label: "Vocabulary",
    color: "bg-purple-500/20 text-purple-400",
  },
  nuance: { label: "Nuance", color: "bg-amber-500/20 text-amber-400" },
};

export default function PlacementTestPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const router = useRouter();

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
        setError("Failed to load the test. Please try again.");
      })
      .finally(() => {
        setIsInitializing(false);
      });
  }, [authLoading, user]);

  const handleSubmit = useCallback(async () => {
    if (!question) return;

    const answer =
      question.type === "multiple_choice" ? selectedChoice : freeText.trim();
    if (!answer) return;

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

      if (data.isComplete) {
        setIsComplete(true);
      } else {
        setQuestion(data.question);
        setProgress(data.progress);
        setSelectedChoice(null);
        setFreeText("");
      }
    } catch {
      setError("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [question, selectedChoice, freeText]);

  // When test completes, call complete endpoint and navigate to results
  useEffect(() => {
    if (!isComplete) return;

    apiFetch<unknown>("/api/placement/complete", { method: "POST" })
      .then(() => {
        router.push("/placement/result");
      })
      .catch(() => {
        setError("Failed to save results. Please try again.");
        setIsComplete(false);
      });
  }, [isComplete, router]);

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
            aria-label="Loading test"
          />
          <p className="text-sm text-gray-400">Loading...</p>
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
            aria-label="Saving results"
          />
          <p className="text-sm text-gray-400">Calculating results...</p>
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
            {error || "Failed to load question."}
          </p>
          <button
            onClick={() => router.push("/placement")}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Back to Start
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

          {/* Answer input */}
          {question.type === "multiple_choice" && question.choices ? (
            <fieldset className="mb-6 space-y-3">
              <legend className="sr-only">Select your answer</legend>
              {question.choices.map((choice) => {
                const isSelected = selectedChoice === choice.id;
                return (
                  <label
                    key={choice.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-950/30"
                        : "border-gray-700 bg-gray-950 hover:border-gray-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="placement-choice"
                      value={choice.id}
                      checked={isSelected}
                      onChange={() => setSelectedChoice(choice.id)}
                      className="sr-only"
                      disabled={isSubmitting}
                    />
                    <span
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-600"
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected && (
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
                placeholder="Type your answer..."
                disabled={isSubmitting}
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

          {/* Submit button */}
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
                Submitting...
              </span>
            ) : progress.current === progress.total - 1 ? (
              "Finish"
            ) : (
              "Next"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
