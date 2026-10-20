import type { MealRating } from "@/lib/meal-plan";

type RatingIconProps = {
  rating: MealRating;
  className?: string;
};

type ThumbsUpIconProps = {
  className?: string;
  filled?: boolean;
};

export function ThumbsUpIcon({
  className = "h-3.5 w-3.5",
  filled = false,
}: ThumbsUpIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      className={className}
    >
      <path
        d="M7.5 9.2v6.3H4.8V9.2h2.7zm2 6.3V9.2l2.7-5.4c1.1 0 2 1 2 2.1v2.2h2.1c1 0 1.8.9 1.6 1.9l-.7 3.7c-.2.9-1 1.5-1.9 1.5h-5.8v.3z"
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RatingIcon({
  rating,
  className = "h-4 w-4",
}: RatingIconProps) {
  if (rating === "loved") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={className}
      >
        <path d="M10 17.25l-1.15-1.05C4.6 12.3 2 9.95 2 6.9 2 4.55 3.85 2.7 6.2 2.7c1.3 0 2.55.6 3.35 1.6.8-1 2.05-1.6 3.35-1.6 2.35 0 4.2 1.85 4.2 4.2 0 3.05-2.6 5.4-6.85 9.3L10 17.25z" />
      </svg>
    );
  }

  if (rating === "liked") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className={className}
      >
        <path
          d="M7.5 9.2v6.3H4.8V9.2h2.7zm2 6.3V9.2l2.7-5.4c1.1 0 2 1 2 2.1v2.2h2.1c1 0 1.8.9 1.6 1.9l-.7 3.7c-.2.9-1 1.5-1.9 1.5h-5.8v.3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
    >
      <path
        d="M4 10.5l3.8 3.8L16 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
