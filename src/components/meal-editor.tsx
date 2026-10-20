"use client";

import { useEffect, useRef, useState } from "react";

import {
  MEAL_IDEAS,
  MEAL_TYPES,
  formatLongDayHeading,
  type MealType,
} from "@/lib/meal-plan";

type EditingMeal = {
  dateKey: string;
  type: MealType;
};

type MealEditorProps = {
  editing: EditingMeal;
  existing?: string;
  onClose: () => void;
  onSave: (value: string) => void;
  onRemove: () => void;
};

export function MealEditor({
  editing,
  existing,
  onClose,
  onSave,
  onRemove,
}: MealEditorProps) {
  const [draft, setDraft] = useState(existing ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const meta = MEAL_TYPES.find((meal) => meal.id === editing.type)!;
  const ideas = MEAL_IDEAS[editing.type];

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-editor-title"
        className="w-full max-w-lg rounded-t-3xl border border-stone-200 bg-[#fffdf9] p-5 shadow-2xl sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${meta.chip}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            <h2
              id="meal-editor-title"
              className="mt-3 text-xl font-semibold tracking-tight text-stone-900"
            >
              {formatLongDayHeading(editing.dateKey)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="h-4 w-4"
            >
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            onSave(draft);
          }}
        >
          <label
            htmlFor="meal-name"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500"
          >
            What are you having?
          </label>
          <input
            ref={inputRef}
            id="meal-name"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`e.g. ${ideas[0].toLowerCase()}`}
            maxLength={80}
            autoComplete="off"
            className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            Need an idea?
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ideas.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => {
                  setDraft(idea);
                  inputRef.current?.focus();
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  draft === idea
                    ? "border-orange-300 bg-orange-100 text-orange-900"
                    : "border-stone-200 bg-white text-stone-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-900"
                }`}
              >
                {idea}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {existing ? (
                <button
                  type="button"
                  onClick={onRemove}
                  className="w-full rounded-full px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 sm:w-auto"
                >
                  Remove meal
                </button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 sm:flex-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!draft.trim()}
                className="flex-1 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300 sm:flex-none"
              >
                Save meal
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
