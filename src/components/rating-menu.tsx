"use client";

import { useEffect } from "react";

import { RatingIcon } from "@/components/rating-icon";
import { RATINGS, type MealRating } from "@/lib/meal-plan";

type RatingMenuProps = {
  mealName: string;
  current?: MealRating;
  rect: DOMRect;
  onSelect: (rating?: MealRating) => void;
  onClose: () => void;
};

const MENU_WIDTH = 208;
const MENU_MARGIN = 12;

export function RatingMenu({
  mealName,
  current,
  rect,
  onSelect,
  onClose,
}: RatingMenuProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const menuHeight = current ? 214 : 174;
  const left = Math.min(
    Math.max(MENU_MARGIN, rect.left),
    Math.max(MENU_MARGIN, window.innerWidth - MENU_WIDTH - MENU_MARGIN),
  );
  const fitsBelow =
    rect.bottom + menuHeight + MENU_MARGIN <= window.innerHeight;
  const top = fitsBelow
    ? rect.bottom + 8
    : Math.max(MENU_MARGIN, rect.top - menuHeight - 8);

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="menu"
        aria-label={`Rate ${mealName}`}
        style={{ top, left, width: MENU_WIDTH }}
        className="fixed z-50 rounded-2xl border border-stone-200 bg-[#fffdf9] p-1.5 shadow-xl"
      >
        <div className="px-2 pb-1.5 pt-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
            Rate this meal
          </p>
          <p className="truncate text-xs font-semibold text-stone-800">
            {mealName}
          </p>
        </div>

        {RATINGS.map((option) => {
          const selected = current === option.id;

          return (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={selected}
              autoFocus={selected || (!current && option.id === "loved")}
              onClick={() => onSelect(option.id)}
              className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition ${
                selected
                  ? option.chip
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <RatingIcon rating={option.id} className="h-4 w-4" />
              <span className="flex-1">{option.label}</span>
              {selected ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="h-3.5 w-3.5"
                >
                  <path
                    d="M3.5 8.5L6.5 11.5L12.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </button>
          );
        })}

        {current ? (
          <button
            type="button"
            role="menuitem"
            onClick={() => onSelect(undefined)}
            className="mt-1 w-full rounded-xl border-t border-stone-200/80 px-2.5 py-2 text-[11px] font-semibold text-stone-400 transition hover:bg-stone-50 hover:text-stone-600"
          >
            Clear rating
          </button>
        ) : null}
      </div>
    </>
  );
}
