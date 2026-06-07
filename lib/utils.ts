import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, getWeek, getYear, getMonth } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCurrentWeekNumber(): number {
  return getWeek(new Date(), { weekStartsOn: 1 });
}

export function getCurrentYear(): number {
  return getYear(new Date());
}

export function getCurrentMonth(): number {
  return getMonth(new Date()) + 1;
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateShort(date: string | Date): string {
  return format(new Date(date), 'MMM d');
}

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getMonthName(month: number): string {
  return format(new Date(2024, month - 1, 1), 'MMMM');
}

export function getCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function getSectorIcon(icon: string): string {
  const iconMap: Record<string, string> = {
    circle: '⭕',
    star: '⭐',
    heart: '❤️',
    brain: '🧠',
    fire: '🔥',
    target: '🎯',
    book: '📚',
    code: '💻',
    money: '💰',
    health: '🏃',
    pray: '🙏',
    chart: '📊',
    rocket: '🚀',
    lightbulb: '💡',
    trophy: '🏆',
    globe: '🌍',
  };
  return iconMap[icon] || '⭕';
}

export const SECTOR_ICONS = [
  { value: 'circle', label: '⭕ Circle' },
  { value: 'star', label: '⭐ Star' },
  { value: 'heart', label: '❤️ Heart' },
  { value: 'brain', label: '🧠 Brain' },
  { value: 'fire', label: '🔥 Fire' },
  { value: 'target', label: '🎯 Target' },
  { value: 'book', label: '📚 Book' },
  { value: 'code', label: '💻 Code' },
  { value: 'money', label: '💰 Money' },
  { value: 'health', label: '🏃 Health' },
  { value: 'pray', label: '🙏 Pray' },
  { value: 'chart', label: '📊 Chart' },
  { value: 'rocket', label: '🚀 Rocket' },
  { value: 'lightbulb', label: '💡 Idea' },
  { value: 'trophy', label: '🏆 Trophy' },
  { value: 'globe', label: '🌍 Globe' },
];

export const SECTOR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#14b8a6', '#a855f7', '#f43f5e',
];

export function getTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
