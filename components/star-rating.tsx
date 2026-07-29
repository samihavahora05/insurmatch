import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  size = 16,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            width={size}
            height={size}
            className={filled ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/40"}
          />
        );
      })}
    </div>
  );
}

export function InteractiveStarRating({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className="transition-transform hover:scale-110"
            aria-label={`Rate ${i + 1} star`}
          >
            <Star
              width={size}
              height={size}
              className={filled ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/40"}
            />
          </button>
        );
      })}
    </div>
  );
}
