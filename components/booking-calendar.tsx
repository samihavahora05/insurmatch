"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIME_SLOTS } from "@/lib/constants";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function BookingCalendar({
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
}: {
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  selectedSlot: string | null;
  onSelectSlot: (s: string) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  const cells: (Date | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const monthLabel = viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="rounded-md p-1.5 hover:bg-secondary"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="rounded-md p-1.5 hover:bg-secondary"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const isPast = date < today;
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          return (
            <button
              key={i}
              type="button"
              disabled={isPast}
              onClick={() => onSelectDate(date)}
              className={cn(
                "aspect-square rounded-md text-sm transition-colors",
                isPast && "cursor-not-allowed text-muted-foreground/30",
                !isPast && !isSelected && "text-foreground hover:bg-secondary",
                isSelected && "bg-primary text-primary-foreground font-semibold"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">Available time slots</p>
          <div className="grid grid-cols-3 gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onSelectSlot(slot)}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                  selectedSlot === slot
                    ? "border-primary bg-primary-50 text-primary-700"
                    : "border-border text-muted-foreground hover:bg-secondary"
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
