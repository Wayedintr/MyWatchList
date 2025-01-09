import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals: { [key: string]: number } = {
    year: 60 * 60 * 24 * 365,
    month: 60 * 60 * 24 * 30,
    week: 60 * 60 * 24 * 7,
    day: 60 * 60 * 24,
    hour: 60 * 60,
    minute: 60,
    second: 1,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const diff = Math.floor(diffInSeconds / secondsInUnit);
    if (diff >= 1 || unit === "second") {
      const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
      return rtf.format(-diff, unit as Intl.RelativeTimeFormatUnit);
    }
  }

  return "just now";
}
