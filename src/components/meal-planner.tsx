"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { MealEditor } from "@/components/meal-editor";
import { RatingIcon, ThumbsUpIcon } from "@/components/rating-icon";
import { RatingMenu } from "@/components/rating-menu";
import {
  MEAL_TYPES,
  RATINGS,
  STORAGE_KEY,
  buildCalendar,
  clearMonth,
  formatDayHeading,
  formatMonth,
  parseMealPlan,
  removeMeal,
  setMeal,
  setMealRating,
  toDateKey,
  type CalendarCell,
  type DayPlan,
  type MealPlan,
  type MealRating,
  type MealType,
} from "@/lib/meal-plan";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type EditingMeal = {
  dateKey: string;
  type: MealType;
};

type MonthCursor = {
  year: number;
  month: number;
};

type RatingAnchor = {
  dateKey: string;
  type: MealType;
  rect: DOMRect;
};

function subscribeToClient() {
  return () => {};
}

let clientToday: Date | null = null;

function getClientToday() {
  if (!clientToday) {
    clientToday = new Date();
  }

  return clientToday;
}

function getServerToday() {
  return null;
}

function readStoredPlan(): MealPlan {
  if (typeof window === "undefined") return {};

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    const parsed: unknown = JSON.parse(stored);
    return parseMealPlan(parsed);
  } catch {
    // Ignore corrupted or unavailable storage.
  }

  return {};
}

export function MealPlanner() {
  const today = useSyncExternalStore(
    subscribeToClient,
    getClientToday,
    getServerToday,
  );
  const [monthOffset, setMonthOffset] = useState(0);
  const [plan, setPlan] = useState<MealPlan>(readStoredPlan);
  const [editing, setEditing] = useState<EditingMeal | null>(null);
  const [ratingAnchor, setRatingAnchor] = useState<RatingAnchor | null>(null);

  useEffect(() => {
    if (!today) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    } catch {
      // Storage can be full or unavailable; the planner still works in memory.
    }
  }, [plan, today]);

  const cursor = useMemo<MonthCursor | null>(() => {
    if (!today) return null;

    const date = new Date(
      today.getFullYear(),
      today.getMonth() + monthOffset,
      1,
    );

    return { year: date.getFullYear(), month: date.getMonth() };
  }, [today, monthOffset]);

  const calendar = useMemo(
    () => (cursor ? buildCalendar(cursor.year, cursor.month) : []),
    [cursor],
  );

  const monthCells = useMemo(
    () => calendar.filter((cell) => cell.inMonth),
    [calendar],
  );

  const stats = useMemo(() => {
    const counts: Record<MealType, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
    };
    const ratings: Record<MealRating, number> = {
      loved: 0,
      liked: 0,
      tried: 0,
    };

    for (const cell of monthCells) {
      const day = plan[cell.key];
      if (!day) continue;

      for (const meal of MEAL_TYPES) {
        const entry = day[meal.id];
        if (!entry) continue;

        counts[meal.id] += 1;
        if (entry.rating) ratings[entry.rating] += 1;
      }
    }

    const totalDays = monthCells.length;
    const filled = counts.breakfast + counts.lunch + counts.dinner;
    const total = totalDays * MEAL_TYPES.length;

    return {
      counts,
      ratings,
      totalDays,
      filled,
      total,
      percent: total === 0 ? 0 : Math.round((filled / total) * 100),
    };
  }, [monthCells, plan]);

  if (!today || !cursor) {
    return <PlannerSkeleton />;
  }

  const todayKey = toDateKey(today);
  const activeYear = cursor.year;
  const activeMonth = cursor.month;
  const currentMonthLabel = formatMonth(activeYear, activeMonth);
  const isCurrentMonth = monthOffset === 0;

  function shiftMonth(delta: number) {
    setMonthOffset((current) => current + delta);
  }

  function goToToday() {
    setMonthOffset(0);
  }

  function handleClearMonth() {
    if (stats.filled === 0) return;

    const confirmed = window.confirm(
      `Clear all ${stats.filled} planned meals for ${currentMonthLabel}?`,
    );
    if (!confirmed) return;

    setPlan((current) => clearMonth(current, activeYear, activeMonth));
  }

  function handleSave(value: string) {
    if (!editing) return;
    setPlan((current) =>
      setMeal(
        current,
        editing.dateKey,
        editing.type,
        value,
        current[editing.dateKey]?.[editing.type]?.rating,
      ),
    );
    setEditing(null);
  }

  function openRatingMenu(
    dateKey: string,
    type: MealType,
    element: HTMLElement,
  ) {
    setRatingAnchor({
      dateKey,
      type,
      rect: element.getBoundingClientRect(),
    });
  }

  function handleRatingSelect(rating?: MealRating) {
    if (!ratingAnchor) return;

    setPlan((current) =>
      setMealRating(
        current,
        ratingAnchor.dateKey,
        ratingAnchor.type,
        rating,
      ),
    );
    setRatingAnchor(null);
  }

  function handleRemove() {
    if (!editing) return;
    setPlan((current) =>
      removeMeal(current, editing.dateKey, editing.type),
    );
    setEditing(null);
  }

  return (
    <>
      <header className="flex flex-col gap-6 border-b border-stone-200/90 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-700">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            Monthly meal planner
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            What&apos;s cooking?
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
            Breakfast, lunch, and dinner for every day of the month. Tap any
            slot to plan a meal — it saves automatically on this device.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-full border border-stone-200 bg-white/90 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <ChevronIcon direction="left" />
            </button>
            <span className="min-w-[9.5rem] px-2 text-center text-sm font-semibold text-stone-800">
              {currentMonthLabel}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
          <button
            type="button"
            onClick={goToToday}
            disabled={isCurrentMonth}
            className="rounded-full border border-stone-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-white disabled:cursor-default disabled:text-stone-400"
          >
            Today
          </button>
        </div>
      </header>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_296px]">
        <section
          aria-label={`Calendar for ${currentMonthLabel}`}
          className="overflow-hidden rounded-3xl border border-stone-200 bg-white/80 shadow-[0_24px_70px_-40px_rgba(120,80,40,0.45)] backdrop-blur"
        >
          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-7 border-b border-stone-200 bg-[#fffaf1]">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px bg-stone-200/80">
                {calendar.map((cell) => (
                  <DayCell
                    key={cell.key}
                    cell={cell}
                    dayPlan={plan[cell.key]}
                    isToday={cell.key === todayKey}
                    onEdit={(type) =>
                      setEditing({ dateKey: cell.key, type })
                    }
                    onRate={(type, element) =>
                      openRatingMenu(cell.key, type, element)
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-stone-200 md:hidden">
            {monthCells.map((cell) => (
              <MobileDay
                key={cell.key}
                cell={cell}
                dayPlan={plan[cell.key]}
                isToday={cell.key === todayKey}
                onEdit={(type) => setEditing({ dateKey: cell.key, type })}
                onRate={(type, element) =>
                  openRatingMenu(cell.key, type, element)
                }
              />
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-stone-900">
                Month progress
              </h2>
              <span className="text-lg font-semibold tracking-tight text-orange-700">
                {stats.percent}%
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              {stats.filled} of {stats.total} meals planned
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-[width] duration-300"
                style={{ width: `${stats.percent}%` }}
              />
            </div>

            <div className="mt-5 space-y-3">
              {MEAL_TYPES.map((meal) => {
                const count = stats.counts[meal.id];
                const percent =
                  stats.totalDays === 0
                    ? 0
                    : Math.round((count / stats.totalDays) * 100);

                return (
                  <div key={meal.id}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-medium text-stone-600">
                        <span
                          className={`h-2 w-2 rounded-full ${meal.dot}`}
                        />
                        {meal.label}
                      </span>
                      <span className="tabular-nums text-stone-400">
                        {count}/{stats.totalDays}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className={`h-full rounded-full ${meal.dot} transition-[width] duration-300`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleClearMonth}
              disabled={stats.filled === 0}
              className="mt-5 w-full rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-default disabled:hover:border-stone-200 disabled:hover:bg-transparent disabled:hover:text-stone-400"
            >
              Clear this month
            </button>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white/85 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-900">
              Your ratings
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Keep track of what you&apos;d make again.
            </p>
            <div className="mt-4 space-y-2">
              {RATINGS.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2"
                >
                  <span
                    className={`flex items-center gap-2 text-xs font-semibold ${option.text}`}
                  >
                    <RatingIcon
                      rating={option.id}
                      className="h-3.5 w-3.5"
                    />
                    {option.label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-stone-800">
                    {stats.ratings[option.id]}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-orange-200/80 bg-gradient-to-br from-orange-50 via-amber-50 to-stone-50 p-5">
            <h2 className="text-sm font-semibold text-orange-950">
              A little tip
            </h2>
            <p className="mt-2 text-sm leading-6 text-orange-950/75">
              Plan dinners first, then build lunches around the leftovers.
              Leave a couple of nights open for takeout — a realistic plan is
              easier to stick to.
            </p>
          </section>
        </aside>
      </div>

      {editing ? (
        <MealEditor
          key={`${editing.dateKey}-${editing.type}`}
          editing={editing}
          existing={plan[editing.dateKey]?.[editing.type]}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onRemove={handleRemove}
        />
      ) : null}

      {ratingAnchor ? (
        <RatingMenu
          mealName={
            plan[ratingAnchor.dateKey]?.[ratingAnchor.type]?.name ?? "Meal"
          }
          current={plan[ratingAnchor.dateKey]?.[ratingAnchor.type]?.rating}
          rect={ratingAnchor.rect}
          onSelect={handleRatingSelect}
          onClose={() => setRatingAnchor(null)}
        />
      ) : null}
    </>
  );
}

type DayCellProps = {
  cell: CalendarCell;
  dayPlan?: DayPlan;
  isToday: boolean;
  onEdit: (type: MealType) => void;
  onRate: (type: MealType, element: HTMLElement) => void;
};

function DayCell({
  cell,
  dayPlan,
  isToday,
  onEdit,
  onRate,
}: DayCellProps) {
  if (!cell.inMonth) {
    return (
      <div className="min-h-[132px] bg-[#f4f0e8]/70 p-2">
        <span className="text-xs font-medium text-stone-300">
          {cell.date.getDate()}
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-[132px] bg-[#fffdf9] p-2">
      <div className="flex items-center justify-between px-0.5">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
            isToday
              ? "bg-orange-500 text-white shadow-sm"
              : "text-stone-700"
          }`}
        >
          {cell.date.getDate()}
        </span>
      </div>

      <div className="mt-1 space-y-0.5">
        {MEAL_TYPES.map((meal) => {
          const entry = dayPlan?.[meal.id];
          const value = entry?.name;
          const rating = RATINGS.find(
            (option) => option.id === entry?.rating,
          );

          return (
            <div
              key={meal.id}
              className="group flex w-full items-center gap-0.5 rounded-lg px-1 py-1 transition hover:bg-orange-50"
            >
              <button
                type="button"
                onClick={() => onEdit(meal.id)}
                title={
                  entry
                    ? `${meal.label}: ${entry.name}${
                        rating ? ` (${rating.label})` : ""
                      }`
                    : `Add ${meal.label.toLowerCase()}`
                }
                aria-label={`${
                  value ? `${meal.label}: ${value}` : `Add ${meal.label}`
                } for ${formatDayHeading(cell.key)}`}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold ${meal.chip}`}
                >
                  {meal.short}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate text-[11px] leading-4 ${
                    value
                      ? "font-medium text-stone-700"
                      : "text-stone-400 group-hover:text-stone-500"
                  }`}
                >
                  {value ?? "Add"}
                </span>
              </button>

              {entry ? (
                <button
                  type="button"
                  onClick={(event) =>
                    onRate(meal.id, event.currentTarget)
                  }
                  title={
                    rating
                      ? `Rated ${rating.label.toLowerCase()}`
                      : "Rate this meal"
                  }
                  aria-label={
                    rating
                      ? `Change rating for ${entry.name}`
                      : `Rate ${entry.name}`
                  }
                  aria-haspopup="menu"
                  className={`shrink-0 rounded-md p-0.5 transition ${
                    rating
                      ? rating.text
                      : "text-stone-300 hover:text-stone-600"
                  }`}
                >
                  <ThumbsUpIcon
                    className="h-3 w-3"
                    filled={Boolean(entry.rating)}
                  />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type MobileDayProps = {
  cell: CalendarCell;
  dayPlan?: DayPlan;
  isToday: boolean;
  onEdit: (type: MealType) => void;
  onRate: (type: MealType, element: HTMLElement) => void;
};

function MobileDay({
  cell,
  dayPlan,
  isToday,
  onEdit,
  onRate,
}: MobileDayProps) {
  return (
    <div className={`p-3.5 ${isToday ? "bg-orange-50/60" : ""}`}>
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
            isToday
              ? "bg-orange-500 text-white"
              : "bg-stone-100 text-stone-700"
          }`}
        >
          {cell.date.getDate()}
        </span>
        <span className="text-sm font-semibold text-stone-800">
          {formatDayHeading(cell.key)}
        </span>
        {isToday ? (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-700">
            Today
          </span>
        ) : null}
      </div>

      <div className="mt-2 grid gap-1.5">
        {MEAL_TYPES.map((meal) => {
          const entry = dayPlan?.[meal.id];
          const value = entry?.name;
          const rating = RATINGS.find(
            (option) => option.id === entry?.rating,
          );

          return (
            <div
              key={meal.id}
              className="flex w-full items-center rounded-xl border border-stone-200/80 bg-white transition hover:border-orange-200 hover:bg-orange-50/60"
            >
              <button
                type="button"
                onClick={() => onEdit(meal.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold ${meal.chip}`}
                >
                  {meal.short}
                </span>
                <span className="w-16 shrink-0 text-xs font-medium text-stone-500">
                  {meal.label}
                </span>
                <span
                  className={`flex-1 truncate text-sm ${
                    value
                      ? "font-medium text-stone-800"
                      : "text-stone-400"
                  }`}
                >
                  {value ?? "Add a meal"}
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="h-3.5 w-3.5 shrink-0 text-stone-300"
                >
                  <path
                    d="M6 3.5L10.5 8L6 12.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {entry ? (
                <button
                  type="button"
                  onClick={(event) =>
                    onRate(meal.id, event.currentTarget)
                  }
                  title={
                    rating
                      ? `Rated ${rating.label.toLowerCase()}`
                      : "Rate this meal"
                  }
                  aria-label={
                    rating
                      ? `Change rating for ${entry.name}`
                      : `Rate ${entry.name}`
                  }
                  aria-haspopup="menu"
                  className={`mr-2 shrink-0 rounded-lg p-1.5 transition ${
                    rating
                      ? rating.text
                      : "text-stone-300 hover:bg-stone-100 hover:text-stone-600"
                  }`}
                >
                  <ThumbsUpIcon
                    className="h-4 w-4"
                    filled={Boolean(entry.rating)}
                  />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={`h-4 w-4 ${direction === "right" ? "rotate-180" : ""}`}
    >
      <path
        d="M12.5 4.5L7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlannerSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="flex flex-col gap-6 border-b border-stone-200/90 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="h-3 w-44 rounded-full bg-stone-200" />
          <div className="mt-4 h-12 w-72 rounded-2xl bg-stone-200/80" />
          <div className="mt-3 h-3 w-96 max-w-full rounded-full bg-stone-200/70" />
        </div>
        <div className="flex gap-2">
          <div className="h-11 w-56 rounded-full bg-stone-200/80" />
          <div className="h-11 w-20 rounded-full bg-stone-200/70" />
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_296px]">
        <div className="h-[620px] rounded-3xl border border-stone-200 bg-white/60" />
        <div className="space-y-4">
          <div className="h-72 rounded-3xl border border-stone-200 bg-white/60" />
          <div className="h-40 rounded-3xl border border-stone-200 bg-white/50" />
        </div>
      </div>
    </div>
  );
}
