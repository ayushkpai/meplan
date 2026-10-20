export type MealType = "breakfast" | "lunch" | "dinner";

export type MealRating = "loved" | "liked" | "tried";

export type MealEntry = {
  name: string;
  rating?: MealRating;
};

export type DayPlan = Partial<Record<MealType, MealEntry>>;

export type MealPlan = Record<string, DayPlan>;

export type CalendarCell = {
  date: Date;
  key: string;
  inMonth: boolean;
};

export type MealTypeMeta = {
  id: MealType;
  label: string;
  short: string;
  chip: string;
  dot: string;
};

export type RatingMeta = {
  id: MealRating;
  label: string;
  shortLabel: string;
  chip: string;
  text: string;
  dot: string;
  selected: string;
};

export const MEAL_TYPES: MealTypeMeta[] = [
  {
    id: "breakfast",
    label: "Breakfast",
    short: "B",
    chip: "bg-amber-100 text-amber-800",
    dot: "bg-amber-400",
  },
  {
    id: "lunch",
    label: "Lunch",
    short: "L",
    chip: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-400",
  },
  {
    id: "dinner",
    label: "Dinner",
    short: "D",
    chip: "bg-rose-100 text-rose-800",
    dot: "bg-rose-400",
  },
];

export const RATINGS: RatingMeta[] = [
  {
    id: "loved",
    label: "Loved it",
    shortLabel: "Loved",
    chip: "bg-rose-50 text-rose-700",
    text: "text-rose-500",
    dot: "bg-rose-400",
    selected: "border-rose-300 bg-rose-50 text-rose-800",
  },
  {
    id: "liked",
    label: "Liked it",
    shortLabel: "Liked",
    chip: "bg-amber-50 text-amber-700",
    text: "text-amber-500",
    dot: "bg-amber-400",
    selected: "border-amber-300 bg-amber-50 text-amber-800",
  },
  {
    id: "tried",
    label: "Tried it",
    shortLabel: "Tried",
    chip: "bg-sky-50 text-sky-700",
    text: "text-sky-500",
    dot: "bg-sky-400",
    selected: "border-sky-300 bg-sky-50 text-sky-800",
  },
];

export const MEAL_IDEAS: Record<MealType, string[]> = {
  breakfast: [
    "Oatmeal with berries",
    "Eggs on toast",
    "Greek yogurt & granola",
    "Banana smoothie",
    "Pancakes",
    "Avocado toast",
    "Breakfast burrito",
    "Chia pudding",
  ],
  lunch: [
    "Chicken salad",
    "Grilled cheese",
    "Lentil soup",
    "Buddha bowl",
    "Turkey wrap",
    "Leftovers",
    "Caprese sandwich",
    "Veggie fried rice",
  ],
  dinner: [
    "Spaghetti bolognese",
    "Taco night",
    "Sheet-pan salmon",
    "Chicken stir-fry",
    "Coconut curry",
    "Roast chicken",
    "Veggie chili",
    "Homemade pizza",
  ],
};

export const STORAGE_KEY = "meplan.plan.v1";

const pad = (value: number) => String(value).padStart(2, "0");

export function isMealRating(value: unknown): value is MealRating {
  return value === "loved" || value === "liked" || value === "tried";
}

export function parseMealPlan(value: unknown): MealPlan {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const plan: MealPlan = {};

  for (const [dateKey, rawDay] of Object.entries(value)) {
    if (!rawDay || typeof rawDay !== "object" || Array.isArray(rawDay)) {
      continue;
    }

    const day: DayPlan = {};

    for (const meal of MEAL_TYPES) {
      const rawEntry = (rawDay as Record<string, unknown>)[meal.id];

      if (typeof rawEntry === "string") {
        const name = rawEntry.trim();
        if (name) day[meal.id] = { name };
        continue;
      }

      if (
        !rawEntry ||
        typeof rawEntry !== "object" ||
        Array.isArray(rawEntry)
      ) {
        continue;
      }

      const { name, rating } = rawEntry as {
        name?: unknown;
        rating?: unknown;
      };

      if (typeof name === "string" && name.trim()) {
        day[meal.id] = {
          name: name.trim(),
          ...(isMealRating(rating) ? { rating } : {}),
        };
      }
    }

    if (Object.keys(day).length > 0) {
      plan[dateKey] = day;
    }
  }

  return plan;
}

export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

export function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function buildCalendar(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const offset = (firstOfMonth.getDay() + 6) % 7;
  const totalDays = daysInMonth(year, month);
  const totalCells = Math.ceil((offset + totalDays) / 7) * 7;
  const start = new Date(year, month, 1 - offset);

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + index,
    );

    return {
      date,
      key: toDateKey(date),
      inMonth: date.getMonth() === month && date.getFullYear() === year,
    };
  });
}

export function formatMonth(year: number, month: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));
}

export function formatDayHeading(key: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parseDateKey(key));
}

export function formatLongDayHeading(key: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(parseDateKey(key));
}

export function isSameMonth(date: Date, year: number, month: number) {
  return date.getFullYear() === year && date.getMonth() === month;
}

export function removeMeal(plan: MealPlan, dateKey: string, type: MealType) {
  const day = { ...plan[dateKey] };
  delete day[type];

  if (Object.keys(day).length === 0) {
    const next = { ...plan };
    delete next[dateKey];
    return next;
  }

  return { ...plan, [dateKey]: day };
}

export function setMeal(
  plan: MealPlan,
  dateKey: string,
  type: MealType,
  value: string,
  rating?: MealRating,
) {
  const trimmed = value.trim();
  if (!trimmed) {
    return removeMeal(plan, dateKey, type);
  }

  const entry: MealEntry = rating
    ? { name: trimmed, rating }
    : { name: trimmed };

  return {
    ...plan,
    [dateKey]: { ...plan[dateKey], [type]: entry },
  };
}

export function clearMonth(plan: MealPlan, year: number, month: number) {
  const next = { ...plan };

  for (let day = 1; day <= daysInMonth(year, month); day += 1) {
    delete next[toDateKey(new Date(year, month, day))];
  }

  return next;
}
